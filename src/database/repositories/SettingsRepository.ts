import { getDatabase } from '../db';
import { SettingsRecord } from '../../types';

export class SettingsRepository {
  static async getSettings(): Promise<SettingsRecord> {
    const db = await getDatabase();
    const settings = await db.getFirstAsync<SettingsRecord>(
      'SELECT * FROM settings WHERE id = 1;'
    );

    if (settings) {
      return settings;
    }

    // Default fallback
    return {
      id: 1,
      auto_lock_duration: 60,
      biometric_enabled: 0,
      theme: 'dark',
      clipboard_timeout: 30,
    };
  }

  static async updateSettings(updates: Partial<SettingsRecord>): Promise<void> {
    const db = await getDatabase();
    const current = await this.getSettings();

    const merged = { ...current, ...updates };

    await db.runAsync(
      `UPDATE settings SET
        auto_lock_duration = ?,
        biometric_enabled = ?,
        theme = ?,
        clipboard_timeout = ?
      WHERE id = 1;`,
      [
        merged.auto_lock_duration,
        merged.biometric_enabled,
        merged.theme,
        merged.clipboard_timeout,
      ]
    );
  }
}
