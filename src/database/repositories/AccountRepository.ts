import { getDatabase } from '../db';
import { AccountRecord } from '../../types';

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
        password_encrypted, category_id, notes_encrypted, is_favorite,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        account.id,
        account.account_name_encrypted,
        account.username_encrypted,
        account.email_encrypted,
        account.password_encrypted,
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
}
