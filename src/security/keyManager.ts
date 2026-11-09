import * as SecureStore from 'expo-secure-store';
import { getDatabase } from '../database/db';
import { SecurityMetadataRecord } from '../types';
import { encryptAesGcm, decryptAesGcm } from './cipher';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/base64';
import {
  deriveKeyEncryptionKey,
  generateRandomBytes,
  generateVaultEncryptionKey,
  DEFAULT_KDF_CONFIG,
} from './kdf';

const BIOMETRIC_KEY_ALIAS = 'vaultix_vek_biometric';

export interface VaultInitResult {
  vek: Uint8Array;
  salt: Uint8Array;
}

/**
 * Initializes a new vault with a user's Master Password.
 * Generates salt, derives KEK, generates random VEK, encrypts VEK, and persists metadata.
 */
export async function setupInitialVault(masterPassword: string): Promise<VaultInitResult> {
  const db = await getDatabase();
  const salt = generateRandomBytes(DEFAULT_KDF_CONFIG.saltLength);
  const vek = generateVaultEncryptionKey();

  const kek = await deriveKeyEncryptionKey(masterPassword, salt, DEFAULT_KDF_CONFIG.iterations);

  // Convert VEK bytes to base64 string for GCM encryption
  const vekString = uint8ArrayToBase64(vek);
  const wrappedVek = await encryptAesGcm(vekString, kek);

  const kdfParams = JSON.stringify({
    iterations: DEFAULT_KDF_CONFIG.iterations,
    algorithm: DEFAULT_KDF_CONFIG.algorithm,
    keyLength: DEFAULT_KDF_CONFIG.keyLength,
  });

  const now = new Date().toISOString();

  // Save to SQLite security_metadata table
  await db.runAsync(
    `INSERT OR REPLACE INTO security_metadata (id, kdf_salt, kdf_algorithm, kdf_params, wrapped_vek, created_at, updated_at)
     VALUES (1, ?, ?, ?, ?, ?, ?);`,
    [salt, DEFAULT_KDF_CONFIG.algorithm, kdfParams, wrappedVek, now, now]
  );

  return { vek, salt };
}

/**
 * Unlocks the vault using the Master Password.
 * Returns the decrypted VEK if password is correct, otherwise throws error.
 */
export async function unlockVaultWithPassword(masterPassword: string): Promise<Uint8Array> {
  const db = await getDatabase();
  const meta = await db.getFirstAsync<SecurityMetadataRecord>(
    'SELECT * FROM security_metadata WHERE id = 1;'
  );

  if (!meta) {
    throw new Error('Vault has not been initialized yet');
  }

  const salt = new Uint8Array(meta.kdf_salt);
  const wrappedVek = new Uint8Array(meta.wrapped_vek);
  const params = JSON.parse(meta.kdf_params);

  const kek = await deriveKeyEncryptionKey(masterPassword, salt, params.iterations ?? DEFAULT_KDF_CONFIG.iterations);

  try {
    const vekBase64 = await decryptAesGcm(wrappedVek, kek);
    const vek = base64ToUint8Array(vekBase64);
    return vek;
  } catch {
    throw new Error('Master Password incorrect');
  }
}

/**
 * Checks whether the vault has been initialized.
 */
export async function isVaultInitialized(): Promise<boolean> {
  const db = await getDatabase();
  const meta = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM security_metadata WHERE id = 1;'
  );
  return meta !== null;
}

/**
 * Saves the VEK into SecureStore protected by Biometrics.
 */
export async function enableBiometricUnlock(vek: Uint8Array): Promise<void> {
  const vekBase64 = uint8ArrayToBase64(vek);
  await SecureStore.setItemAsync(BIOMETRIC_KEY_ALIAS, vekBase64, {
    requireAuthentication: true,
  });
}

/**
 * Removes the biometric VEK from SecureStore.
 */
export async function disableBiometricUnlock(): Promise<void> {
  await SecureStore.deleteItemAsync(BIOMETRIC_KEY_ALIAS);
}

/**
 * Unlocks the vault using Biometrics from SecureStore.
 */
export async function unlockVaultWithBiometrics(): Promise<Uint8Array> {
  const vekBase64 = await SecureStore.getItemAsync(BIOMETRIC_KEY_ALIAS, {
    requireAuthentication: true,
  });

  if (!vekBase64) {
    throw new Error('Biometric key not found or authentication failed');
  }

  return base64ToUint8Array(vekBase64);
}

/**
 * Changes the Master Password.
 * Unwraps VEK with current password, re-wraps with new password and fresh salt.
 */
export async function changeMasterPassword(
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const vek = await unlockVaultWithPassword(oldPassword);
  const db = await getDatabase();

  const newSalt = generateRandomBytes(DEFAULT_KDF_CONFIG.saltLength);
  const newKek = await deriveKeyEncryptionKey(newPassword, newSalt, DEFAULT_KDF_CONFIG.iterations);

  const vekString = uint8ArrayToBase64(vek);
  const newWrappedVek = await encryptAesGcm(vekString, newKek);

  const kdfParams = JSON.stringify({
    iterations: DEFAULT_KDF_CONFIG.iterations,
    algorithm: DEFAULT_KDF_CONFIG.algorithm,
    keyLength: DEFAULT_KDF_CONFIG.keyLength,
  });

  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE security_metadata
     SET kdf_salt = ?, kdf_params = ?, wrapped_vek = ?, updated_at = ?
     WHERE id = 1;`,
    [newSalt, kdfParams, newWrappedVek, now]
  );
}
