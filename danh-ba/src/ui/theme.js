export const colors = {
  primary: '#1565C0',
  primaryLight: '#E3F2FD',
  danger: '#C62828',
  success: '#2E7D32',
  star: '#F9A825',
  text: '#1A1A1A',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  background: '#F5F7FA',
  card: '#FFFFFF',
};

const AVATAR_COLORS = ['#1565C0', '#2E7D32', '#AD1457', '#6A1B9A', '#EF6C00', '#00838F', '#4E342E', '#283593'];

export function avatarColor(id) {
  return AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];
}
