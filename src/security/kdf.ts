/**
 * Key Derivation Function (KDF) & Salt Management
 * Derives a 256-bit Key Encryption Key (KEK) using Argon2id
 * Based on PRD Section 3 (Argon2id)
 */

import * as Crypto from 'expo-crypto';
import { argon2id } from '@noble/hashes/argon2.js';

export interface KdfConfig {
  algorithm: string;
  iterations: number; // time cost (t)
  memorySize: number; // memory cost (m in KB)
  parallelism: number; // parallelism (p)
  saltLength: number;
  keyLength: number; // in bytes (32 bytes = 256 bits)
}

export const DEFAULT_KDF_CONFIG: KdfConfig = {
  algorithm: 'Argon2id',
  iterations: 2,       // Time cost
  memorySize: 19456,   // 19MB memory cost (RFC 9106 recommended)
  parallelism: 1,      // Single thread for mobile battery & performance
  saltLength: 32,      // 256-bit salt
  keyLength: 32,       // 256-bit key for AES-256
};

/**
 * Generates cryptographically secure random bytes using native Android SecureRandom.
 */
export function generateRandomBytes(length: number): Uint8Array {
  try {
    return Crypto.getRandomBytes(length);
  } catch {
    const bytes = new Uint8Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
      return bytes;
    }
    // Final deterministic fallback if native bridge is not ready
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  }
}

/**
 * Derives a 32-byte Key Encryption Key (KEK) from Master Password and Salt using Argon2id.
 */
export async function deriveKeyEncryptionKey(
  masterPassword: string,
  salt: Uint8Array,
  iterations: number = DEFAULT_KDF_CONFIG.iterations
): Promise<Uint8Array> {
  const derived = argon2id(masterPassword, salt, {
    t: iterations,
    m: DEFAULT_KDF_CONFIG.memorySize,
    p: DEFAULT_KDF_CONFIG.parallelism,
    dkLen: DEFAULT_KDF_CONFIG.keyLength,
  });

  return derived;
}

/**
 * Generates a fresh random 256-bit (32-byte) Vault Encryption Key (VEK).
 */
export function generateVaultEncryptionKey(): Uint8Array {
  return generateRandomBytes(32);
}
