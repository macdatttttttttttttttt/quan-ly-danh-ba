// Bộ chuyển đổi giúp chạy mã dùng API expo-sqlite trên SQLite có sẵn của Node.js
// (node:sqlite), phục vụ kiểm thử tích hợp tầng dữ liệu với CSDL thật.
const { DatabaseSync } = require('node:sqlite');

const flat = (params) => (params.length === 1 && Array.isArray(params[0]) ? params[0] : params);
// node:sqlite không nhận undefined/boolean làm tham số.
const clean = (params) => flat(params).map((p) => (p === undefined ? null : typeof p === 'boolean' ? Number(p) : p));

export function openMemoryDatabase() {
  const db = new DatabaseSync(':memory:');
  return {
    raw: db,
    async execAsync(sql) {
      db.exec(sql);
    },
    async getFirstAsync(sql, ...params) {
      return db.prepare(sql).get(...clean(params)) ?? null;
    },
    async getAllAsync(sql, ...params) {
      return db.prepare(sql).all(...clean(params));
    },
    async runAsync(sql, ...params) {
      const r = db.prepare(sql).run(...clean(params));
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    async withTransactionAsync(fn) {
      db.exec('BEGIN');
      try {
        await fn();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    close() {
      db.close();
    },
  };
}
