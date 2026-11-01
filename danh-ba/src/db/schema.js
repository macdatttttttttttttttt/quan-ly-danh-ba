// Khởi tạo và nâng cấp lược đồ CSDL SQLite theo PRAGMA user_version.
import { removeAccents } from '../utils/text';

export const DATABASE_NAME = 'danhba.db';
const SCHEMA_VERSION = 1;

export async function migrate(db) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version >= SCHEMA_VERSION) return;

  await db.withTransactionAsync(async () => {
    if (version < 1) {
      await db.execAsync(`
        CREATE TABLE contact_groups (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          name        TEXT    NOT NULL UNIQUE COLLATE NOCASE CHECK (length(trim(name)) BETWEEN 1 AND 50),
          created_at  TEXT    NOT NULL
        );

        CREATE TABLE contacts (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name   TEXT    NOT NULL CHECK (length(trim(full_name)) BETWEEN 1 AND 100),
          search_name TEXT    NOT NULL,
          phone       TEXT    NOT NULL CHECK (length(phone) BETWEEN 10 AND 11),
          email       TEXT,
          address     TEXT,
          note        TEXT    CHECK (note IS NULL OR length(note) <= 500),
          group_id    INTEGER REFERENCES contact_groups(id) ON DELETE SET NULL,
          is_favorite INTEGER NOT NULL DEFAULT 0 CHECK (is_favorite IN (0, 1)),
          is_deleted  INTEGER NOT NULL DEFAULT 0 CHECK (is_deleted IN (0, 1)),
          deleted_at  TEXT,
          created_at  TEXT    NOT NULL,
          updated_at  TEXT    NOT NULL
        );

        -- BR-03: số điện thoại là duy nhất trong các liên hệ chưa bị xóa.
        CREATE UNIQUE INDEX ux_contacts_active_phone ON contacts(phone) WHERE is_deleted = 0;
        CREATE INDEX ix_contacts_search_name ON contacts(search_name);
        CREATE INDEX ix_contacts_group ON contacts(group_id);

        CREATE TABLE app_settings (
          key   TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );
      `);
      await seed(db);
    }
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}

/** Dữ liệu mẫu phục vụ chạy thử và trình diễn. */
async function seed(db) {
  const ts = new Date().toISOString();
  const groups = ['Gia đình', 'Bạn bè', 'Công việc'];
  for (const name of groups) {
    await db.runAsync('INSERT INTO contact_groups (name, created_at) VALUES (?, ?)', name, ts);
  }
  const samples = [
    ['Nguyễn Văn An', '0912345678', 'an.nguyen@gmail.com', 'Lê Chân, Hải Phòng', 1, 1],
    ['Trần Thị Bình', '0987654321', 'binh.tran@gmail.com', 'Ngô Quyền, Hải Phòng', 1, 0],
    ['Lê Hoàng Cường', '0905111222', null, 'Hồng Bàng, Hải Phòng', 2, 1],
    ['Phạm Minh Đức', '0336789012', 'duc.pham@outlook.com', null, 2, 0],
    ['Đặng Thu Hà', '0868123456', null, 'Kiến An, Hải Phòng', 2, 0],
    ['Hoàng Văn Khánh', '0243826123', 'khanh.hv@congty.vn', 'Cầu Giấy, Hà Nội', 3, 0],
    ['Vũ Thị Lan', '0794567890', 'lan.vu@congty.vn', null, 3, 1],
    ['Bùi Quốc Minh', '0397001122', null, null, null, 0],
    ['Ngô Thanh Tâm', '0356223344', 'tam.ngo@gmail.com', null, null, 0],
    ['Đỗ Gia Huy', '0918777666', null, 'Thủy Nguyên, Hải Phòng', 2, 0],
  ];
  for (const [name, phone, email, address, groupId, fav] of samples) {
    await db.runAsync(
      `INSERT INTO contacts (full_name, search_name, phone, email, address, group_id, is_favorite, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      name, removeAccents(name), phone, email, address, groupId, fav, ts, ts,
    );
  }
}
