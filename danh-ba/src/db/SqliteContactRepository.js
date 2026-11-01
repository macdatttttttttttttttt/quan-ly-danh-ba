// Truy cập bảng contacts bằng expo-sqlite. Mọi giá trị đều truyền qua tham số
// (không ghép chuỗi SQL) để tránh SQL injection.

const SELECT = `
  SELECT c.*, g.name AS group_name
  FROM contacts c LEFT JOIN contact_groups g ON g.id = c.group_id`;

export function mapContact(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    searchName: row.search_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    note: row.note,
    groupId: row.group_id,
    groupName: row.group_name ?? null,
    isFavorite: row.is_favorite === 1,
    isDeleted: row.is_deleted === 1,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteContactRepository {
  constructor(db) {
    this.db = db;
  }

  async findById(id) {
    return mapContact(await this.db.getFirstAsync(`${SELECT} WHERE c.id = ?`, id));
  }

  async findActiveByPhone(phone, excludeId = null) {
    const row = await this.db.getFirstAsync(
      `${SELECT} WHERE c.is_deleted = 0 AND c.phone = ? AND c.id IS NOT ?`,
      phone, excludeId,
    );
    return mapContact(row);
  }

  async findActive({ nameKeyword = '', phoneKeyword = '', groupId = null, favoritesOnly = false }) {
    const where = ['c.is_deleted = 0'];
    const params = [];
    if (nameKeyword || phoneKeyword) {
      const parts = [];
      if (nameKeyword) { parts.push("c.search_name LIKE ? ESCAPE '\\'"); params.push(`%${escapeLike(nameKeyword)}%`); }
      if (phoneKeyword) { parts.push("c.phone LIKE ? ESCAPE '\\'"); params.push(`%${escapeLike(phoneKeyword)}%`); }
      where.push(`(${parts.join(' OR ')})`);
    }
    if (groupId != null) { where.push('c.group_id = ?'); params.push(groupId); }
    if (favoritesOnly) where.push('c.is_favorite = 1');
    const rows = await this.db.getAllAsync(
      `${SELECT} WHERE ${where.join(' AND ')} ORDER BY c.search_name`,
      params,
    );
    return rows.map(mapContact);
  }

  async findDeleted() {
    const rows = await this.db.getAllAsync(`${SELECT} WHERE c.is_deleted = 1 ORDER BY c.deleted_at DESC`);
    return rows.map(mapContact);
  }

  async insert(c) {
    const r = await this.db.runAsync(
      `INSERT INTO contacts (full_name, search_name, phone, email, address, note, group_id, is_favorite, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      c.fullName, c.searchName, c.phone, c.email, c.address, c.note, c.groupId,
      c.isFavorite ? 1 : 0, c.createdAt, c.updatedAt,
    );
    return r.lastInsertRowId;
  }

  async update(id, c) {
    await this.db.runAsync(
      `UPDATE contacts SET full_name = ?, search_name = ?, phone = ?, email = ?, address = ?,
         note = ?, group_id = ?, updated_at = ? WHERE id = ?`,
      c.fullName, c.searchName, c.phone, c.email, c.address, c.note, c.groupId, c.updatedAt, id,
    );
  }

  async setFavorite(id, value, updatedAt) {
    await this.db.runAsync('UPDATE contacts SET is_favorite = ?, updated_at = ? WHERE id = ?', value ? 1 : 0, updatedAt, id);
  }

  async softDelete(id, deletedAt) {
    await this.db.runAsync('UPDATE contacts SET is_deleted = 1, deleted_at = ?, updated_at = ? WHERE id = ?', deletedAt, deletedAt, id);
  }

  async restore(id, updatedAt) {
    await this.db.runAsync('UPDATE contacts SET is_deleted = 0, deleted_at = NULL, updated_at = ? WHERE id = ?', updatedAt, id);
  }

  async hardDelete(id) {
    await this.db.runAsync('DELETE FROM contacts WHERE id = ?', id);
  }
}

function escapeLike(s) {
  return s.replace(/[\\%_]/g, (m) => '\\' + m);
}
