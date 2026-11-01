// Lưu cấu hình ứng dụng (mã PIN đã băm, số lần nhập sai...) dạng key/value.

export class SqliteSettingsRepository {
  constructor(db) {
    this.db = db;
  }

  async get(key) {
    const row = await this.db.getFirstAsync('SELECT value FROM app_settings WHERE key = ?', key);
    return row ? row.value : null;
  }

  async set(key, value) {
    await this.db.runAsync(
      'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      key, value,
    );
  }
}
