// Tầng nghiệp vụ quản lý liên hệ. Không phụ thuộc SQLite: nhận repository qua
// hàm khởi tạo nên có thể kiểm thử bằng repository giả lập trong bộ nhớ.
import { removeAccents, firstLetter } from '../utils/text';
import { normalizePhone, validateContact } from './validation';
import { BusinessError, ErrorCode } from './errors';

export class ContactService {
  /**
   * @param {object} contactRepo  repository bảng contacts
   * @param {() => string} now    hàm trả về thời điểm hiện tại (ISO), tiêm vào để dễ kiểm thử
   */
  constructor(contactRepo, now = () => new Date().toISOString()) {
    this.repo = contactRepo;
    this.now = now;
  }

  /** Chuẩn hóa dữ liệu nhập từ form trước khi lưu. */
  #toRecord(input) {
    const fullName = String(input.fullName ?? '').trim();
    return {
      fullName,
      searchName: removeAccents(fullName),
      phone: normalizePhone(input.phone),
      email: String(input.email ?? '').trim() || null,
      address: String(input.address ?? '').trim() || null,
      note: String(input.note ?? '').trim() || null,
      groupId: input.groupId ?? null,
    };
  }

  async #ensureValid(input, excludeId = null) {
    const errors = validateContact(input);
    if (Object.keys(errors).length > 0) {
      throw new BusinessError(ErrorCode.VALIDATION, 'Dữ liệu không hợp lệ', errors);
    }
    // BR-03: không cho phép hai liên hệ đang hoạt động trùng số điện thoại.
    const dup = await this.repo.findActiveByPhone(normalizePhone(input.phone), excludeId);
    if (dup) {
      throw new BusinessError(ErrorCode.DUPLICATE_PHONE, 'Số điện thoại đã tồn tại', {
        phone: `Số này đã lưu cho "${dup.fullName}"`,
      });
    }
  }

  async #mustExist(id) {
    const contact = await this.repo.findById(id);
    if (!contact) throw new BusinessError(ErrorCode.NOT_FOUND, 'Không tìm thấy liên hệ');
    return contact;
  }

  /** UC-02 Thêm liên hệ. Trả về id liên hệ mới. */
  async create(input) {
    await this.#ensureValid(input);
    const ts = this.now();
    return this.repo.insert({ ...this.#toRecord(input), isFavorite: !!input.isFavorite, createdAt: ts, updatedAt: ts });
  }

  /** UC-03 Sửa liên hệ. */
  async update(id, input) {
    await this.#mustExist(id);
    await this.#ensureValid(input, id);
    await this.repo.update(id, { ...this.#toRecord(input), updatedAt: this.now() });
  }

  async getById(id) {
    return this.#mustExist(id);
  }

  /**
   * UC-01/UC-05 Xem danh sách và tìm kiếm theo tên (không phân biệt dấu, hoa thường)
   * hoặc theo số điện thoại. Có thể lọc theo nhóm và theo yêu thích.
   */
  async list({ keyword = '', groupId = null, favoritesOnly = false } = {}) {
    const kw = String(keyword).trim();
    const digits = kw.replace(/[\s.\-()+]/g, '');
    return this.repo.findActive({
      nameKeyword: kw ? removeAccents(kw) : '',
      phoneKeyword: /^\d+$/.test(digits) ? normalizePhone(kw) : '',
      groupId,
      favoritesOnly,
    });
  }

  /** Nhóm danh sách theo chữ cái đầu để hiển thị dạng mục A, B, C... */
  static toSections(contacts) {
    const map = new Map();
    for (const c of contacts) {
      const key = firstLetter(c.fullName);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(c);
    }
    return [...map.entries()]
      .sort(([a], [b]) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))
      .map(([title, data]) => ({ title, data }));
  }

  /** UC-06 Đánh dấu / bỏ đánh dấu yêu thích. Trả về trạng thái mới. */
  async toggleFavorite(id) {
    const c = await this.#mustExist(id);
    const next = !c.isFavorite;
    await this.repo.setFavorite(id, next, this.now());
    return next;
  }

  /** UC-04 Xóa liên hệ: chuyển vào thùng rác (BR-05), có thể khôi phục. */
  async moveToTrash(id) {
    await this.#mustExist(id);
    await this.repo.softDelete(id, this.now());
  }

  async listTrash() {
    return this.repo.findDeleted();
  }

  /** Khôi phục từ thùng rác; thất bại nếu số điện thoại đã được dùng bởi liên hệ khác. */
  async restore(id) {
    const c = await this.#mustExist(id);
    const dup = await this.repo.findActiveByPhone(c.phone, id);
    if (dup) {
      throw new BusinessError(
        ErrorCode.DUPLICATE_PHONE,
        `Không thể khôi phục: số ${c.phone} đang được dùng cho "${dup.fullName}"`,
      );
    }
    await this.repo.restore(id, this.now());
  }

  /** Xóa vĩnh viễn, chỉ áp dụng cho liên hệ đang ở thùng rác. */
  async deletePermanently(id) {
    const c = await this.#mustExist(id);
    if (!c.isDeleted) {
      throw new BusinessError(ErrorCode.VALIDATION, 'Chỉ xóa vĩnh viễn liên hệ trong thùng rác');
    }
    await this.repo.hardDelete(id);
  }
}
