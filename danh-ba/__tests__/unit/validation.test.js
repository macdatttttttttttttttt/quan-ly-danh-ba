// Kiểm thử đơn vị: quy tắc kiểm tra dữ liệu (BR-01..BR-04, BR-07).
// Kỹ thuật: phân hoạch tương đương và phân tích giá trị biên.
import {
  isValidEmail, isValidPhone, isValidPin, normalizePhone, validateContact, NAME_MAX_LENGTH,
} from '../../src/services/validation';
import { removeAccents, firstLetter } from '../../src/utils/text';

describe('Chuẩn hóa và kiểm tra số điện thoại', () => {
  test('TC-01 chuẩn hóa +84, khoảng trắng, dấu chấm, gạch về dạng 0xxxxxxxxx', () => {
    expect(normalizePhone('+84 912.345.678')).toBe('0912345678');
    expect(normalizePhone('84912345678')).toBe('0912345678');
    expect(normalizePhone('091-234-5678')).toBe('0912345678');
  });

  test.each([
    ['0912345678', true, '10 số di động'],
    ['02253826123', true, '11 số cố định'],
    ['+84912345678', true, 'tiền tố +84'],
    ['091234567', false, '9 số – dưới biên'],
    ['091234567890', false, '12 số – trên biên'],
    ['1912345678', false, 'không bắt đầu bằng 0'],
    ['09123abc78', false, 'chứa chữ cái'],
    ['', false, 'rỗng'],
  ])('TC-02 isValidPhone("%s") = %s (%s)', (phone, expected) => {
    expect(isValidPhone(phone)).toBe(expected);
  });
});

describe('Kiểm tra email', () => {
  test.each([
    ['', true],
    [null, true],
    ['an.nguyen@gmail.com', true],
    ['an@gmail', false],
    ['an nguyen@gmail.com', false],
    ['@gmail.com', false],
  ])('TC-03 isValidEmail(%p) = %s', (email, expected) => {
    expect(isValidEmail(email)).toBe(expected);
  });
});

describe('Kiểm tra toàn bộ liên hệ', () => {
  const valid = { fullName: 'Nguyễn Văn An', phone: '0912345678', email: '' };

  test('TC-04 liên hệ hợp lệ không có lỗi', () => {
    expect(validateContact(valid)).toEqual({});
  });

  test('TC-05 thiếu họ tên và số điện thoại báo lỗi từng trường', () => {
    const errors = validateContact({ fullName: '   ', phone: '' });
    expect(errors.fullName).toMatch(/không được để trống/);
    expect(errors.phone).toMatch(/không được để trống/);
  });

  test('TC-06 họ tên đúng 100 ký tự hợp lệ, 101 ký tự không hợp lệ (giá trị biên)', () => {
    expect(validateContact({ ...valid, fullName: 'a'.repeat(NAME_MAX_LENGTH) }).fullName).toBeUndefined();
    expect(validateContact({ ...valid, fullName: 'a'.repeat(NAME_MAX_LENGTH + 1) }).fullName).toMatch(/tối đa/);
  });
});

describe('Mã PIN', () => {
  test.each([['1234', true], ['123', false], ['12345', false], ['12a4', false], ['', false]])(
    'TC-07 isValidPin("%s") = %s',
    (pin, expected) => expect(isValidPin(pin)).toBe(expected),
  );
});

describe('Xử lý chuỗi tiếng Việt', () => {
  test('TC-08 bỏ dấu và chữ đ/Đ, lấy chữ cái đầu', () => {
    expect(removeAccents('Đặng Thu Hà')).toBe('dang thu ha');
    expect(firstLetter('Ánh')).toBe('A');
    expect(firstLetter('123 Taxi')).toBe('#');
  });
});
