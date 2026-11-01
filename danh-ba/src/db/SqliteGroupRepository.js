// Truy cập bảng contact_groups bằng expo-sqlite.

export class SqliteGroupRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll() {
    const rows = await this.db.getAllAsync(`
      SELECT g.id, g.name, COUNT(c.id) AS contact_count
      FROM contact_groups g
      LEFT JOIN contacts c ON c.group_id = g.id AND c.is_deleted = 0
      GROUP BY g.id ORDER BY g.name`);
    return rows.map((r) => ({ id: r.id, name: r.name, contactCount: r.contact_count }));
  }

  async findById(id) {
    return this.db.getFirstAsync('SELECT id, name FROM contact_groups WHERE id = ?', id);
  }

  /**
   * So sánh không phân biệt hoa thường bằng JavaScript vì COLLATE NOCASE của
   * SQLite chỉ áp dụng cho chữ ASCII ("GIA ĐÌNH" khác "Gia đình"). Số nhóm ít nên chấp nhận được.
   */
  async findByName(name) {
    const target = String(name).toLocaleLowerCase('vi');
    const rows = await this.db.getAllAsync('SELECT id, name FROM contact_groups');
    return rows.find((g) => g.name.toLocaleLowerCase('vi') === target) ?? null;
  }

  async insert(name, createdAt) {
    const r = await this.db.runAsync('INSERT INTO contact_groups (name, created_at) VALUES (?, ?)', name, createdAt);
    return r.lastInsertRowId;
  }

  async rename(id, name) {
    await this.db.runAsync('UPDATE contact_groups SET name = ? WHERE id = ?', name, id);
  }

  /** Khóa ngoại ON DELETE SET NULL tự chuyển liên hệ về "Chưa phân nhóm". */
  async delete(id) {
    await this.db.runAsync('DELETE FROM contact_groups WHERE id = ?', id);
  }
}
