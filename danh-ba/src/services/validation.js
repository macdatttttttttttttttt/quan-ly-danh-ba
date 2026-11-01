// Quy tắc kiểm tra dữ liệu liên hệ (BR-01 .. BR-04 trong tài liệu SRS).

export const NAME_MAX_LENGTH = 100;
export const NOTE_MAX_LENGTH = 500;

/**
 * Chuẩn hóa số điện thoại: bỏ khoảng trắng, dấu chấm, gạch, ngoặc;
 * đổi tiền tố +84 / 84 thành 0. Ví dụ "+84 912.345.678" -> "0912345678".
 */
export function normalizePhone(phone) {
  let p = String(phone ?? '').replace(/[\s.\-()]/g, '');
  if (p.startsWith('+84')) p = '0' + p.slice(3);
  else if (/^84\d{9,10}$/.test(p)) p = '0' + p.slice(2);
  return p;
}

/** BR-02: số hợp lệ gồm 10–11 chữ số và bắt đầu bằng 0 (sau khi chuẩn hóa). */
export function isValidPhone(phone) {
  return /^0\d{9,10}$/.test(normalizePhone(phone));
}

/** BR-04: email không bắt buộc, nếu có phải đúng định dạng. */
export function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
}

/**
 * Kiểm tra toàn bộ dữ liệu một liên hệ.
 * Trả về đối tượng lỗi theo từng trường; rỗng nghĩa là hợp lệ.
 */
export function validateContact(input) {
  const errors = {};
  const name = String(input.fullName ?? '').trim();

  if (!name) errors.fullName = 'Họ tên không được để trống';
  else if (name.length > NAME_MAX_LENGTH)
    errors.fullName = `Họ tên tối đa ${NAME_MAX_LENGTH} ký tự`;

  if (!String(input.phone ?? '').trim()) errors.phone = 'Số điện thoại không được để trống';
  else if (!isValidPhone(input.phone))
    errors.phone = 'Số điện thoại phải gồm 10–11 chữ số và bắt đầu bằng 0 hoặc +84';

  if (!isValidEmail(input.email)) errors.email = 'Email không đúng định dạng';

  if (String(input.note ?? '').length > NOTE_MAX_LENGTH)
    errors.note = `Ghi chú tối đa ${NOTE_MAX_LENGTH} ký tự`;

  return errors;
}

/** BR-07: mã PIN gồm đúng 4 chữ số. */
export function isValidPin(pin) {
  return /^\d{4}$/.test(String(pin ?? ''));
}
