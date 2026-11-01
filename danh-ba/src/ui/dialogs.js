// Hộp thoại xác nhận / thông báo chạy được cả trên điện thoại và trình duyệt
// (Alert của React Native không hiển thị trên web).
import { Alert, Platform } from 'react-native';

export function confirm(title, message, okText = 'Đồng ý') {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) },
      { text: okText, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function notify(title, message = '') {
  if (Platform.OS === 'web') window.alert(message ? `${title}\n\n${message}` : title);
  else Alert.alert(title, message);
}
