// Lỗi nghiệp vụ: mang theo mã lỗi và lỗi theo từng trường để giao diện hiển thị.
export class BusinessError extends Error {
  constructor(code, message, fieldErrors = {}) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export const ErrorCode = {
  VALIDATION: 'VALIDATION',
  DUPLICATE_PHONE: 'DUPLICATE_PHONE',
  DUPLICATE_GROUP: 'DUPLICATE_GROUP',
  NOT_FOUND: 'NOT_FOUND',
  PIN_INVALID: 'PIN_INVALID',
  PIN_WRONG: 'PIN_WRONG',
  PIN_LOCKED: 'PIN_LOCKED',
};
