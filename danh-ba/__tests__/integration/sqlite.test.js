/**
 * Kiểm thử tích hợp: tầng nghiệp vụ + repository SQLite + lược đồ CSDL thật
 * (chạy trên SQLite tích hợp sẵn của Node.js thay cho expo-sqlite).
 * @jest-environment node
 */
import { migrate } from '../../src/db/schema';
import { SqliteContactRepository } from '../../src/db/SqliteContactRepository';
import { SqliteGroupRepository } from '../../src/db/SqliteGroupRepository';
import { SqliteSettingsRepository } from '../../src/db/SqliteSettingsRepository';
import { ContactService } from '../../src/services/ContactService';
import { GroupService } from '../../src/services/GroupService';
import { ErrorCode } from '../../src/services/errors';
import { openMemoryDatabase } from '../helpers/nodeSqlite';

let db;
let contacts;
let groups;

beforeEach(async () => {
  db = openMemoryDatabase();
  await migrate(db);
  contacts = new ContactService(new SqliteContactRepository(db));
  groups = new GroupService(new SqliteGroupRepository(db));
});

afterEach(() => db.close());

test('TC-33 khởi tạo CSDL tạo đủ bảng, dữ liệu mẫu và đặt phiên bản lược đồ', async () => {
  const tables = (await db.getAllAsync("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")).map((t) => t.name);
  expect(tables).toEqual(expect.arrayContaining(['app_settings', 'contact_groups', 'contacts']));
  expect((await db.getFirstAsync('PRAGMA user_version')).user_version).toBe(1);
  expect(await contacts.list()).toHaveLength(10);
  // Chạy lại migrate không nhân đôi dữ liệu.
  await migrate(db);
  expect(await contacts.list()).toHaveLength(10);
});

test('TC-34 thêm, tìm kiếm không dấu và sắp xếp A–Z trên CSDL thật', async () => {
  await contacts.create({ fullName: 'Ánh Dương', phone: '0901000001' });
  const all = await contacts.list();
  expect(all[0].fullName).toBe('Ánh Dương');
  expect((await contacts.list({ keyword: 'thu ha' })).map((c) => c.fullName)).toEqual(['Đặng Thu Hà']);
});

test('TC-35 ký tự đặc biệt % và _ trong từ khóa được tìm theo nghĩa đen', async () => {
  await contacts.create({ fullName: 'Giảm 50% cước', phone: '0901000002' });
  expect((await contacts.list({ keyword: '%' })).map((c) => c.fullName)).toEqual(['Giảm 50% cước']);
  expect(await contacts.list({ keyword: '_' })).toEqual([]);
});

test('TC-36 chỉ mục duy nhất của CSDL chặn trùng số kể cả khi bỏ qua tầng nghiệp vụ', async () => {
  const repo = new SqliteContactRepository(db);
  const ts = new Date().toISOString();
  await expect(
    repo.insert({ fullName: 'X', searchName: 'x', phone: '0912345678', isFavorite: false, createdAt: ts, updatedAt: ts }),
  ).rejects.toThrow(/UNIQUE/);
});

test('TC-37 xóa nhóm: khóa ngoại ON DELETE SET NULL giữ lại liên hệ', async () => {
  const family = (await groups.list()).find((g) => g.name === 'Gia đình');
  expect(family.contactCount).toBe(2);
  await groups.remove(family.id);
  const binh = (await contacts.list({ keyword: 'binh' }))[0];
  expect(binh.groupId).toBeNull();
  expect(await contacts.list()).toHaveLength(10);
});

test('TC-38 vòng đời thùng rác trên CSDL thật: xóa, khôi phục xung đột, xóa vĩnh viễn', async () => {
  const an = (await contacts.list({ keyword: 'an' })).find((c) => c.fullName === 'Nguyễn Văn An');
  await contacts.moveToTrash(an.id);
  expect(await contacts.list()).toHaveLength(9);
  await contacts.create({ fullName: 'An mới', phone: an.phone });
  await expect(contacts.restore(an.id)).rejects.toMatchObject({ code: ErrorCode.DUPLICATE_PHONE });
  await contacts.deletePermanently(an.id);
  expect(await contacts.listTrash()).toEqual([]);
});

test('TC-40 (hồi quy BUG-01) trùng tên nhóm có dấu viết hoa khác vẫn bị phát hiện', async () => {
  await expect(groups.create('GIA ĐÌNH')).rejects.toMatchObject({ code: ErrorCode.DUPLICATE_GROUP });
  await expect(groups.create('bạn BÈ')).rejects.toMatchObject({ code: ErrorCode.DUPLICATE_GROUP });
});

test('TC-39 lưu và cập nhật cấu hình dạng key/value', async () => {
  const settings = new SqliteSettingsRepository(db);
  expect(await settings.get('pin_hash')).toBeNull();
  await settings.set('pin_hash', 'a');
  await settings.set('pin_hash', 'b');
  expect(await settings.get('pin_hash')).toBe('b');
});
