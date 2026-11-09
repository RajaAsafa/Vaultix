import { getDatabase } from '../db';
import { CategoryRecord, DecryptedCategory } from '../../types';
import { encryptAesGcm, decryptAesGcm } from '../../security/cipher';
import { DEFAULT_CATEGORIES } from '../../constants/categories';

export class CategoryRepository {
  static async getAll(): Promise<CategoryRecord[]> {
    const db = await getDatabase();
    return await db.getAllAsync<CategoryRecord>(
      'SELECT * FROM categories ORDER BY created_at ASC;'
    );
  }

  static async getDecryptedCategories(vek: Uint8Array): Promise<DecryptedCategory[]> {
    const records = await this.getAll();
    const results: DecryptedCategory[] = [];

    for (const record of records) {
      try {
        const name = await decryptAesGcm(new Uint8Array(record.name_encrypted), vek);
        results.push({
          id: record.id,
          name,
          icon: record.icon,
          createdAt: record.created_at,
        });
      } catch {
        // Fallback name if decryption fails
        results.push({
          id: record.id,
          name: 'Unknown Category',
          icon: record.icon,
          createdAt: record.created_at,
        });
      }
    }

    return results;
  }

  static async create(id: string, name: string, icon: string, vek: Uint8Array): Promise<void> {
    const db = await getDatabase();
    const nameEncrypted = await encryptAesGcm(name, vek);
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO categories (id, name_encrypted, icon, created_at) VALUES (?, ?, ?, ?);',
      [id, nameEncrypted, icon, now]
    );
  }

  static async delete(id: string): Promise<void> {
    const db = await getDatabase();
    // PRD FR-08: Deleting category sets accounts to NULL category or Others, does not delete accounts
    await db.runAsync('DELETE FROM categories WHERE id = ?;', [id]);
  }

  static async seedDefaultCategories(vek: Uint8Array): Promise<void> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories;'
    );

    if (existing && existing.count > 0) {
      return; // Already seeded
    }

    const now = new Date().toISOString();
    for (const item of DEFAULT_CATEGORIES) {
      const nameEncrypted = await encryptAesGcm(item.name, vek);
      await db.runAsync(
        'INSERT INTO categories (id, name_encrypted, icon, created_at) VALUES (?, ?, ?, ?);',
        [item.id, nameEncrypted, item.icon, now]
      );
    }
  }
}
