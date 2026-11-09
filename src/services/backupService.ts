/**
 * Vaultix Backup & Restore Service
 * Creates and restores strongly encrypted .vaultix backup bundles.
 * Encryption: Argon2id KDF + AES-256-GCM
 * Strictly 100% offline.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../database/db';
import { generateRandomBytes, deriveKeyEncryptionKey } from '../security/kdf';
import { encryptAesGcm, decryptAesGcm } from '../security/cipher';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/base64';

export interface BackupEnvelope {
  app: 'Vaultix';
  format_version: number;
  kdf_algorithm: string;
  salt_b64: string;
  payload_blob_b64: string;
}

export class BackupService {
  /**
   * Exports an encrypted .vaultix file and opens Android native share sheet.
   */
  static async exportBackup(masterPassword: string): Promise<string> {
    const db = await getDatabase();

    // 1. Gather all local database tables
    const [securityMeta, categories, accounts, passwordHistory, settings] = await Promise.all([
      db.getAllAsync<any>('SELECT * FROM security_metadata;'),
      db.getAllAsync<any>('SELECT * FROM categories;'),
      db.getAllAsync<any>('SELECT * FROM accounts;'),
      db.getAllAsync<any>('SELECT * FROM password_history;').catch(() => []),
      db.getAllAsync<any>('SELECT * FROM settings;'),
    ]);

    // Format BLOB fields to base64 for JSON serialization
    const formatRowBlobs = (row: any) => {
      const copy: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        if (value instanceof Uint8Array || (typeof value === 'object' && value !== null && 'byteLength' in value)) {
          copy[key] = uint8ArrayToBase64(new Uint8Array(value as any));
        } else if (Array.isArray(value)) {
          copy[key] = uint8ArrayToBase64(new Uint8Array(value));
        } else {
          copy[key] = value;
        }
      }
      return copy;
    };

    const payload = {
      vaultix_version: '1.2',
      exported_at: new Date().toISOString(),
      security_metadata: securityMeta.map(formatRowBlobs),
      categories: categories.map(formatRowBlobs),
      accounts: accounts.map(formatRowBlobs),
      password_history: passwordHistory.map(formatRowBlobs),
      settings: settings,
    };

    const payloadJson = JSON.stringify(payload);

    // 2. Generate unique 32-byte salt and derive backup key using Argon2id
    const backupSalt = generateRandomBytes(32);
    const backupKey = await deriveKeyEncryptionKey(masterPassword, backupSalt);

    // 3. Encrypt payload with AES-256-GCM
    const encryptedBlob = await encryptAesGcm(payloadJson, backupKey);

    const envelope: BackupEnvelope = {
      app: 'Vaultix',
      format_version: 1,
      kdf_algorithm: 'Argon2id',
      salt_b64: uint8ArrayToBase64(backupSalt),
      payload_blob_b64: uint8ArrayToBase64(encryptedBlob),
    };

    const envelopeJson = JSON.stringify(envelope, null, 2);

    // 4. Save to temporary cache file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `vaultix_backup_${timestamp}.vaultix`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, envelopeJson, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 5. Open Android Share Sheet
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Simpan File Backup Vaultix',
        UTI: 'public.data',
      });
    }

    return filePath;
  }

  /**
   * Prompts user to pick a .vaultix file and restores the database.
   */
  static async importBackup(masterPassword: string): Promise<{ accountsCount: number }> {
    // 1. Pick file
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      throw new Error('Pemilihan file backup dibatalkan.');
    }

    const fileAsset = result.assets[0];
    const fileContent = await FileSystem.readAsStringAsync(fileAsset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    let envelope: BackupEnvelope;
    try {
      envelope = JSON.parse(fileContent);
    } catch {
      throw new Error('Format file tidak valid. Pastikan memilih file .vaultix yang benar.');
    }

    if (envelope.app !== 'Vaultix' || !envelope.salt_b64 || !envelope.payload_blob_b64) {
      throw new Error('File ini bukan file cadangan Vaultix yang sah.');
    }

    // 2. Derive key using Argon2id and decrypt
    const backupSalt = base64ToUint8Array(envelope.salt_b64);
    const backupKey = await deriveKeyEncryptionKey(masterPassword, backupSalt);
    const encryptedBlob = base64ToUint8Array(envelope.payload_blob_b64);

    let payloadJson: string;
    try {
      payloadJson = await decryptAesGcm(encryptedBlob, backupKey);
    } catch {
      throw new Error('Master Password salah atau file cadangan telah rusak / dimodifikasi.');
    }

    const payload = JSON.parse(payloadJson);
    const db = await getDatabase();

    // 3. Restore in atomic transaction
    await db.withTransactionAsync(async () => {
      // Clear existing records
      await db.execAsync(`
        DELETE FROM accounts;
        DELETE FROM categories;
        DELETE FROM security_metadata;
        DELETE FROM password_history;
      `);

      // Restore security metadata
      for (const row of payload.security_metadata) {
        await db.runAsync(
          `INSERT INTO security_metadata (id, kdf_salt, kdf_algorithm, kdf_params, wrapped_vek, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [
            row.id,
            base64ToUint8Array(row.kdf_salt),
            row.kdf_algorithm,
            row.kdf_params,
            base64ToUint8Array(row.wrapped_vek),
            row.created_at,
            row.updated_at,
          ]
        );
      }

      // Restore categories
      for (const cat of payload.categories) {
        await db.runAsync(
          `INSERT INTO categories (id, name_encrypted, icon, created_at)
           VALUES (?, ?, ?, ?);`,
          [cat.id, base64ToUint8Array(cat.name_encrypted), cat.icon, cat.created_at]
        );
      }

      // Restore accounts
      for (const acc of payload.accounts) {
        await db.runAsync(
          `INSERT INTO accounts (
             id, account_name_encrypted, username_encrypted, email_encrypted,
             password_encrypted, pin_encrypted, auth_type, category_id, notes_encrypted, is_favorite,
             created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            acc.id,
            base64ToUint8Array(acc.account_name_encrypted),
            acc.username_encrypted ? base64ToUint8Array(acc.username_encrypted) : null,
            acc.email_encrypted ? base64ToUint8Array(acc.email_encrypted) : null,
            base64ToUint8Array(acc.password_encrypted),
            acc.pin_encrypted ? base64ToUint8Array(acc.pin_encrypted) : null,
            acc.auth_type ?? 'password',
            acc.category_id,
            acc.notes_encrypted ? base64ToUint8Array(acc.notes_encrypted) : null,
            acc.is_favorite,
            acc.created_at,
            acc.updated_at,
          ]
        );
      }

      // Restore password history if any
      if (Array.isArray(payload.password_history)) {
        for (const h of payload.password_history) {
          await db.runAsync(
            `INSERT INTO password_history (id, account_id, password_encrypted, created_at)
             VALUES (?, ?, ?, ?);`,
            [h.id, h.account_id, base64ToUint8Array(h.password_encrypted), h.created_at]
          );
        }
      }

      // Restore settings if present
      if (Array.isArray(payload.settings) && payload.settings.length > 0) {
        const s = payload.settings[0];
        await db.runAsync(
          `INSERT OR REPLACE INTO settings (id, auto_lock_duration, biometric_enabled, theme, clipboard_timeout)
           VALUES (1, ?, ?, ?, ?);`,
          [
            s.auto_lock_duration ?? 60,
            s.biometric_enabled ?? 0,
            s.theme ?? 'dark',
            s.clipboard_timeout ?? 30,
          ]
        );
      }
    });

    return { accountsCount: payload.accounts.length };
  }
}
