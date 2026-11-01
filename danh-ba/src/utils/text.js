// Tiện ích xử lý chuỗi tiếng Việt dùng cho tìm kiếm và sắp xếp.

/** Bỏ dấu tiếng Việt và chuyển về chữ thường: "Đặng Văn Ánh" -> "dang van anh". */
export function removeAccents(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/** Chữ cái đầu dùng để nhóm danh bạ theo A–Z; ký tự khác chữ cái trả về "#". */
export function firstLetter(name) {
  const c = removeAccents(name).charAt(0).toUpperCase();
  return c >= 'A' && c <= 'Z' ? c : '#';
}
