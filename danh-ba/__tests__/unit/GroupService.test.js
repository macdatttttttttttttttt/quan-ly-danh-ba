// Kiểm thử đơn vị: quản lý nhóm liên hệ (UC-09, BR-06).
import { GroupService } from '../../src/services/GroupService';
import { ErrorCode } from '../../src/services/errors';
import { MemoryContactRepository, MemoryGroupRepository } from '../helpers/memoryRepos';

let contacts;
let service;

beforeEach(() => {
  contacts = new MemoryContactRepository();
  service = new GroupService(new MemoryGroupRepository(contacts));
});

test('TC-24 tên nhóm rỗng hoặc dài quá 50 ký tự bị từ chối', async () => {
  await expect(service.create('  ')).rejects.toMatchObject({ code: ErrorCode.VALIDATION });
  await expect(service.create('x'.repeat(51))).rejects.toMatchObject({ code: ErrorCode.VALIDATION });
  await expect(service.create('x'.repeat(50))).resolves.toBeDefined();
});

test('TC-25 không cho tạo hoặc đổi tên trùng nhóm đã có (không phân biệt hoa thường)', async () => {
  await service.create('Gia đình');
  const id = await service.create('Bạn bè');
  await expect(service.create('GIA ĐÌNH')).rejects.toMatchObject({ code: ErrorCode.DUPLICATE_GROUP });
  await expect(service.rename(id, 'gia đình')).rejects.toMatchObject({ code: ErrorCode.DUPLICATE_GROUP });
  await expect(service.rename(id, 'Bạn bè thân')).resolves.toBeUndefined();
});

test('TC-26 xóa nhóm giữ lại liên hệ và chuyển về "Chưa phân nhóm"', async () => {
  const gid = await service.create('Công việc');
  await contacts.insert({ fullName: 'Khánh', searchName: 'khanh', phone: '0243826123', groupId: gid });
  await service.remove(gid);
  expect(await service.list()).toEqual([]);
  expect(contacts.rows[0].groupId).toBeNull();
});
