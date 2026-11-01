// Kiểm thử đơn vị: xác thực bằng mã PIN (UC-07, BR-07, BR-08).
import { createHash } from 'node:crypto';
import { AuthService, LOCK_DURATION_MS, MAX_FAILED_ATTEMPTS } from '../../src/services/AuthService';
import { ErrorCode } from '../../src/services/errors';
import { MemorySettingsRepository } from '../helpers/memoryRepos';

const sha256 = async (t) => createHash('sha256').update(t).digest('hex');

let repo;
let clock;
let auth;

beforeEach(() => {
  repo = new MemorySettingsRepository();
  clock = 1_000_000;
  auth = new AuthService(repo, sha256, () => 'salt-test', () => clock);
});

test('TC-27 PIN sai định dạng hoặc nhập lại không khớp thì không được thiết lập', async () => {
  await expect(auth.setPin('12', '12')).rejects.toMatchObject({ code: ErrorCode.PIN_INVALID });
  await expect(auth.setPin('1234', '4321')).rejects.toMatchObject({ code: ErrorCode.PIN_INVALID });
  expect(await auth.hasPin()).toBe(false);
});

test('TC-28 PIN được lưu dạng băm có muối, không lưu dạng rõ', async () => {
  await auth.setPin('1234', '1234');
  const stored = await repo.get('pin_hash');
  expect(stored).not.toContain('1234');
  expect(stored).toBe(await sha256('salt-test1234'));
});

test('TC-29 nhập đúng PIN thì mở khóa được', async () => {
  await auth.setPin('1234', '1234');
  await expect(auth.verify('1234')).resolves.toBe(true);
});

test('TC-30 nhập sai PIN báo số lần thử còn lại', async () => {
  await auth.setPin('1234', '1234');
  await expect(auth.verify('0000')).rejects.toMatchObject({
    code: ErrorCode.PIN_WRONG,
    message: expect.stringContaining(`còn ${MAX_FAILED_ATTEMPTS - 1} lần`),
  });
});

test('TC-31 sai 5 lần liên tiếp bị khóa 30 giây, hết thời gian thì mở lại được', async () => {
  await auth.setPin('1234', '1234');
  for (let i = 1; i < MAX_FAILED_ATTEMPTS; i++) {
    await expect(auth.verify('0000')).rejects.toMatchObject({ code: ErrorCode.PIN_WRONG });
  }
  await expect(auth.verify('0000')).rejects.toMatchObject({ code: ErrorCode.PIN_LOCKED });
  // Đang bị khóa: nhập đúng cũng không được.
  await expect(auth.verify('1234')).rejects.toMatchObject({ code: ErrorCode.PIN_LOCKED });
  clock += LOCK_DURATION_MS;
  await expect(auth.verify('1234')).resolves.toBe(true);
});

test('TC-32 đổi PIN yêu cầu PIN cũ đúng', async () => {
  await auth.setPin('1234', '1234');
  await expect(auth.changePin('9999', '5678', '5678')).rejects.toMatchObject({ code: ErrorCode.PIN_WRONG });
  await auth.changePin('1234', '5678', '5678');
  await expect(auth.verify('5678')).resolves.toBe(true);
});
