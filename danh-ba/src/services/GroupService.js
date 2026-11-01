// Tầng nghiệp vụ quản lý nhóm liên hệ (BR-06).
import { BusinessError, ErrorCode } from './errors';

export const GROUP_NAME_MAX_LENGTH = 50;

export class GroupService {
  constructor(groupRepo, now = () => new Date().toISOString()) {
    this.repo = groupRepo;
    this.now = now;
  }

  async #ensureValidName(name, excludeId = null) {
    const n = String(name ?? '').trim();
    if (!n) throw new BusinessError(ErrorCode.VALIDATION, 'Tên nhóm không được để trống');
    if (n.length > GROUP_NAME_MAX_LENGTH)
      throw new BusinessError(ErrorCode.VALIDATION, `Tên nhóm tối đa ${GROUP_NAME_MAX_LENGTH} ký tự`);
    const dup = await this.repo.findByName(n);
    if (dup && dup.id !== excludeId)
      throw new BusinessError(ErrorCode.DUPLICATE_GROUP, `Nhóm "${n}" đã tồn tại`);
    return n;
  }

  /** Danh sách nhóm kèm số liên hệ đang hoạt động trong mỗi nhóm. */
  async list() {
    return this.repo.findAll();
  }

  async create(name) {
    const n = await this.#ensureValidName(name);
    return this.repo.insert(n, this.now());
  }

  async rename(id, name) {
    if (!(await this.repo.findById(id)))
      throw new BusinessError(ErrorCode.NOT_FOUND, 'Không tìm thấy nhóm');
    const n = await this.#ensureValidName(name, id);
    await this.repo.rename(id, n);
  }

  /** Xóa nhóm; các liên hệ trong nhóm được giữ lại và chuyển về "Chưa phân nhóm". */
  async remove(id) {
    if (!(await this.repo.findById(id)))
      throw new BusinessError(ErrorCode.NOT_FOUND, 'Không tìm thấy nhóm');
    await this.repo.delete(id);
  }
}
