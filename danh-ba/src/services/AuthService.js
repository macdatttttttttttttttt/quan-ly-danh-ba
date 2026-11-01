// Xác thực bằng mã PIN (BR-07, BR-08). PIN được băm SHA-256 kèm muối,
// không lưu dạng rõ. Nhập sai 5 lần liên tiếp sẽ bị khóa 30 giây.
import { isValidPin } from './validation';
import { BusinessError, ErrorCode } from './errors';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 30_000;

const KEY_HASH = 'pin_hash';
const KEY_SALT = 'pin_salt';
const KEY_FAILED = 'pin_failed_attempts';
const KEY_LOCKED_UNTIL = 'pin_locked_until';

export class AuthService {
  /**
   * @param {object} settingsRepo        lưu cặp key/value
   * @param {(text: string) => Promise<string>} hash  hàm băm SHA-256
   * @param {() => string} makeSalt      sinh chuỗi muối ngẫu nhiên
   * @param {() => number} now           thời điểm hiện tại (ms)
   */
  constructor(settingsRepo, hash, makeSalt, now = () => Date.now()) {
    this.repo = settingsRepo;
    this.hash = hash;
    this.makeSalt = makeSalt;
    this.now = now;
  }

  async hasPin() {
    return !!(await this.repo.get(KEY_HASH));
  }

  /** Thiết lập PIN lần đầu (UC-07). */
  async setPin(pin, confirmPin) {
    if (!isValidPin(pin))
      throw new BusinessError(ErrorCode.PIN_INVALID, 'Mã PIN phải gồm đúng 4 chữ số');
    if (pin !== confirmPin)
      throw new BusinessError(ErrorCode.PIN_INVALID, 'Mã PIN nhập lại không khớp');
    const salt = this.makeSalt();
    await this.repo.set(KEY_SALT, salt);
    await this.repo.set(KEY_HASH, await this.hash(salt + pin));
    await this.#resetFailures();
  }

  /** Số mili-giây còn bị khóa; 0 nếu không bị khóa. */
  async lockRemainingMs() {
    const until = Number((await this.repo.get(KEY_LOCKED_UNTIL)) ?? 0);
    return Math.max(0, until - this.now());
  }

  /** Mở khóa ứng dụng (UC-07). Ném lỗi nếu sai PIN hoặc đang bị khóa. */
  async verify(pin) {
    const remaining = await this.lockRemainingMs();
    if (remaining > 0) {
      throw new BusinessError(
        ErrorCode.PIN_LOCKED,
        `Nhập sai quá nhiều lần. Thử lại sau ${Math.ceil(remaining / 1000)} giây`,
      );
    }
    const salt = (await this.repo.get(KEY_SALT)) ?? '';
    const expected = await this.repo.get(KEY_HASH);
    if (expected && (await this.hash(salt + String(pin ?? ''))) === expected) {
      await this.#resetFailures();
      return true;
    }

    const failed = Number((await this.repo.get(KEY_FAILED)) ?? 0) + 1;
    if (failed >= MAX_FAILED_ATTEMPTS) {
      await this.repo.set(KEY_LOCKED_UNTIL, String(this.now() + LOCK_DURATION_MS));
      await this.repo.set(KEY_FAILED, '0');
      throw new BusinessError(
        ErrorCode.PIN_LOCKED,
        `Nhập sai ${MAX_FAILED_ATTEMPTS} lần. Ứng dụng bị khóa ${LOCK_DURATION_MS / 1000} giây`,
      );
    }
    await this.repo.set(KEY_FAILED, String(failed));
    throw new BusinessError(
      ErrorCode.PIN_WRONG,
      `Mã PIN không đúng (còn ${MAX_FAILED_ATTEMPTS - failed} lần thử)`,
    );
  }

  /** Đổi PIN: phải nhập đúng PIN cũ. */
  async changePin(oldPin, newPin, confirmPin) {
    await this.verify(oldPin);
    await this.setPin(newPin, confirmPin);
  }

  async #resetFailures() {
    await this.repo.set(KEY_FAILED, '0');
    await this.repo.set(KEY_LOCKED_UNTIL, '0');
  }
}
