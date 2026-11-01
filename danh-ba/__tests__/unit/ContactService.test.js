// Kiểm thử đơn vị: nghiệp vụ quản lý liên hệ (UC-01..UC-06).
import { ContactService } from '../../src/services/ContactService';
import { ErrorCode } from '../../src/services/errors';
import { MemoryContactRepository } from '../helpers/memoryRepos';

const AN = { fullName: 'Nguyễn Văn An', phone: '0912 345 678', email: 'an@gmail.com' };
const HA = { fullName: 'Đặng Thu Hà', phone: '0868123456' };

let repo;
let service;

beforeEach(() => {
  repo = new MemoryContactRepository();
  service = new ContactService(repo, () => '2026-11-01T00:00:00.000Z');
});

describe('Thêm liên hệ (UC-02)', () => {
  test('TC-09 thêm liên hệ hợp lệ: lưu số đã chuẩn hóa và tên không dấu', async () => {
    const id = await service.create(AN);
    const saved = await service.getById(id);
    expect(saved.phone).toBe('0912345678');
    expect(saved.searchName).toBe('nguyen van an');
    expect(await service.list()).toHaveLength(1);
  });

  test('TC-10 không cho thêm trùng số điện thoại dù viết khác định dạng', async () => {
    await service.create(AN);
    await expect(service.create({ fullName: 'An 2', phone: '+84912345678' })).rejects.toMatchObject({
      code: ErrorCode.DUPLICATE_PHONE,
    });
  });

  test('TC-11 dữ liệu không hợp lệ trả về lỗi theo trường và không lưu', async () => {
    await expect(service.create({ fullName: '', phone: '123', email: 'sai' })).rejects.toMatchObject({
      code: ErrorCode.VALIDATION,
      fieldErrors: { fullName: expect.any(String), phone: expect.any(String), email: expect.any(String) },
    });
    expect(repo.rows).toHaveLength(0);
  });
});

describe('Sửa liên hệ (UC-03)', () => {
  test('TC-12 sửa liên hệ giữ nguyên số của chính nó thì hợp lệ', async () => {
    const id = await service.create(AN);
    await service.update(id, { ...AN, fullName: 'Nguyễn Văn An (Cty)' });
    expect((await service.getById(id)).fullName).toBe('Nguyễn Văn An (Cty)');
  });

  test('TC-13 sửa sang số đã thuộc liên hệ khác bị từ chối', async () => {
    await service.create(AN);
    const id = await service.create(HA);
    await expect(service.update(id, { ...HA, phone: '0912345678' })).rejects.toMatchObject({
      code: ErrorCode.DUPLICATE_PHONE,
    });
  });

  test('TC-14 sửa liên hệ không tồn tại báo NOT_FOUND', async () => {
    await expect(service.update(999, AN)).rejects.toMatchObject({ code: ErrorCode.NOT_FOUND });
  });
});

describe('Tìm kiếm (UC-05)', () => {
  beforeEach(async () => {
    await service.create(AN);
    await service.create(HA);
  });

  test('TC-15 tìm theo tên không dấu, không phân biệt hoa thường', async () => {
    const r = await service.list({ keyword: 'DANG thu' });
    expect(r.map((c) => c.fullName)).toEqual(['Đặng Thu Hà']);
  });

  test('TC-16 tìm theo một phần số điện thoại', async () => {
    const r = await service.list({ keyword: '345 678' });
    expect(r.map((c) => c.fullName)).toEqual(['Nguyễn Văn An']);
  });

  test('TC-17 từ khóa không khớp trả về danh sách rỗng', async () => {
    expect(await service.list({ keyword: 'khong ton tai' })).toEqual([]);
  });

  test('TC-18 nhóm danh sách theo chữ cái, mục "#" xếp cuối', () => {
    const sections = ContactService.toSections([
      { fullName: 'Bình' }, { fullName: '123 Taxi' }, { fullName: 'An' }, { fullName: 'Ánh' },
    ]);
    expect(sections.map((s) => s.title)).toEqual(['A', 'B', '#']);
    expect(sections[0].data).toHaveLength(2);
  });
});

describe('Yêu thích (UC-06)', () => {
  test('TC-19 đánh dấu yêu thích rồi lọc danh sách yêu thích', async () => {
    const id = await service.create(AN);
    await service.create(HA);
    expect(await service.toggleFavorite(id)).toBe(true);
    expect((await service.list({ favoritesOnly: true })).map((c) => c.id)).toEqual([id]);
    expect(await service.toggleFavorite(id)).toBe(false);
    expect(await service.list({ favoritesOnly: true })).toEqual([]);
  });
});

describe('Xóa và thùng rác (UC-04)', () => {
  test('TC-20 xóa đưa liên hệ vào thùng rác và giải phóng số điện thoại', async () => {
    const id = await service.create(AN);
    await service.moveToTrash(id);
    expect(await service.list()).toEqual([]);
    expect((await service.listTrash()).map((c) => c.id)).toEqual([id]);
    await expect(service.create({ fullName: 'An mới', phone: AN.phone })).resolves.toBeDefined();
  });

  test('TC-21 không khôi phục được khi số đã được liên hệ khác sử dụng', async () => {
    const id = await service.create(AN);
    await service.moveToTrash(id);
    await service.create({ fullName: 'An mới', phone: AN.phone });
    await expect(service.restore(id)).rejects.toMatchObject({ code: ErrorCode.DUPLICATE_PHONE });
  });

  test('TC-22 khôi phục thành công khi không xung đột', async () => {
    const id = await service.create(AN);
    await service.moveToTrash(id);
    await service.restore(id);
    expect((await service.list()).map((c) => c.id)).toEqual([id]);
  });

  test('TC-23 chỉ xóa vĩnh viễn được liên hệ đang trong thùng rác', async () => {
    const id = await service.create(AN);
    await expect(service.deletePermanently(id)).rejects.toMatchObject({ code: ErrorCode.VALIDATION });
    await service.moveToTrash(id);
    await service.deletePermanently(id);
    expect(repo.rows).toHaveLength(0);
  });
});
