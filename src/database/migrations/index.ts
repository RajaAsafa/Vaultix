import * as SQLite from 'expo-sqlite';
import { getDatabase } from '../db';

interface Migration {
  version: number;
  name: string;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_vaultix_schema',
    up: async (db) => {
      await db.execAsync(`
        -- 1. Security Metadata (Dual-Layer Master Password KDF & Wrapped VEK)
        CREATE TABLE IF NOT EXISTS security_metadata (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          kdf_salt BLOB NOT NULL,
          kdf_algorithm TEXT NOT NULL,
          kdf_params TEXT NOT NULL,
          wrapped_vek BLOB NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        -- 2. Categories Table (PRD Section 8.2)
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY,
          name_encrypted BLOB NOT NULL,
          icon TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        -- 3. Accounts Table (PRD Section 8.1 - Strict: No website URL)
        CREATE TABLE IF NOT EXISTS accounts (
          id TEXT PRIMARY KEY,
          account_name_encrypted BLOB NOT NULL,
          username_encrypted BLOB,
          email_encrypted BLOB,
          password_encrypted BLOB NOT NULL,
          category_id TEXT,
          notes_encrypted BLOB,
          is_favorite INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );

        -- 4. Reminders Table (PRD Section 8.3)
        CREATE TABLE IF NOT EXISTS reminders (
          id TEXT PRIMARY KEY,
          account_id TEXT NOT NULL,
          reminder_date TEXT NOT NULL,
          is_enabled INTEGER DEFAULT 1,
          FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
        );

        -- 5. Settings Table (PRD Section 8.4)
        CREATE TABLE IF NOT EXISTS settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          auto_lock_duration INTEGER DEFAULT 60,
          biometric_enabled INTEGER DEFAULT 0,
          theme TEXT DEFAULT 'dark',
          clipboard_timeout INTEGER DEFAULT 30
        );

        -- Seed initial default settings row
        INSERT OR IGNORE INTO settings (id, auto_lock_duration, biometric_enabled, theme, clipboard_timeout)
        VALUES (1, 60, 0, 'dark', 30);
      `);
    },
  },
];

export async function runMigrations(): Promise<void> {
  const db = await getDatabase();

  const versionResult = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionResult?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await db.withTransactionAsync(async () => {
        await migration.up(db);
        await db.execAsync(`PRAGMA user_version = ${migration.version};`);
      });
    }
  }
}
