import { getDatabase } from '../db';
import { AccountRecord, PasswordHistoryRecord } from '../../types';

export class AccountRepository {
  static async getAll(): Promise<AccountRecord[]> {
    const db = await getDatabase();
    return await db.getAllAsync<AccountRecord>(
      'SELECT * FROM accounts ORDER BY created_at DESC;'
    );
  }

  static async getById(id: string): Promise<AccountRecord | null> {
    const db = await getDatabase();
    return await db.getFirstAsync<AccountRecord>(
      'SELECT * FROM accounts WHERE id = ?;',
      [id]
    );
  }

  static async create(account: AccountRecord): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO accounts (
        id, account_name_encrypted, username_encrypted, email_encrypted,
        password_encrypted, pin_encrypted, category_id, notes_encrypted, is_favorite,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        account.id,
        account.account_name_encrypted,
        account.username_encrypted,
        account.email_encrypted,
        account.password_encrypted,
        account.pin_encrypted ?? null,
        account.category_id,
        account.notes_encrypted,
        account.is_favorite,
        account.created_at,
        account.updated_at,
      ]
    );
  }

  static async update(account: AccountRecord): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE accounts SET
        account_name_encrypted = ?,
        username_encrypted = ?,
        email_encrypted = ?,
        password_encrypted = ?,
        pin_encrypted = ?,
        category_id = ?,
        notes_encrypted = ?,
        is_favorite = ?,
        updated_at = ?
      WHERE id = ?;`,
      [
        account.account_name_encrypted,
        account.username_encrypted,
        account.email_encrypted,
        account.password_encrypted,
        account.pin_encrypted ?? null,
        account.category_id,
        account.notes_encrypted,
        account.is_favorite,
        account.updated_at,
        account.id,
      ]
    );
  }

  static async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM accounts WHERE id = ?;', [id]);
  }

  static async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE accounts SET is_favorite = ?, updated_at = ? WHERE id = ?;',
      [isFavorite ? 1 : 0, now, id]
    );
  }

  static async addPasswordHistory(accountId: string, encryptedPassword: Uint8Array): Promise<void> {
    const db = await getDatabase();
    const historyId = 'hist_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        'INSERT INTO password_history (id, account_id, password_encrypted, created_at) VALUES (?, ?, ?, ?);',
        [historyId, accountId, encryptedPassword, now]
      );

      // Keep only 5 most recent records
      await db.runAsync(
        `DELETE FROM password_history
         WHERE account_id = ?
           AND id NOT IN (
             SELECT id FROM password_history
             WHERE account_id = ?
             ORDER BY created_at DESC
             LIMIT 5
           );`,
        [accountId, accountId]
      );
    });
  }

  static async getPasswordHistory(accountId: string): Promise<PasswordHistoryRecord[]> {
    const db = await getDatabase();
    return await db.getAllAsync<PasswordHistoryRecord>(
      'SELECT * FROM password_history WHERE account_id = ? ORDER BY created_at DESC LIMIT 5;',
      [accountId]
    );
  }
}
