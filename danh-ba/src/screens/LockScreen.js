// Màn hình 1 – Khóa ứng dụng: thiết lập PIN lần đầu hoặc nhập PIN để mở khóa (UC-07).
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useServices } from '../ServicesContext';
import { colors } from '../ui/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];
const PIN_LENGTH = 4;

/** mode: 'setup' (tạo PIN mới) hoặc 'unlock' (mở khóa). */
export default function LockScreen({ mode, onUnlocked }) {
  const { auth } = useServices();
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState(null); // PIN nhập lần 1 khi thiết lập
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const title =
    mode === 'setup'
      ? firstPin ? 'Nhập lại mã PIN để xác nhận' : 'Tạo mã PIN 4 số để bảo vệ danh bạ'
      : 'Nhập mã PIN để mở danh bạ';

  async function submit(value) {
    setBusy(true);
    try {
      if (mode === 'setup') {
        if (!firstPin) {
          setFirstPin(value);
          setMessage('');
        } else {
          await auth.setPin(firstPin, value);
          onUnlocked();
        }
      } else {
        await auth.verify(value);
        onUnlocked();
      }
    } catch (e) {
      setMessage(e.message);
      if (mode === 'setup') setFirstPin(null);
    } finally {
      setPin('');
      setBusy(false);
    }
  }

  function press(key) {
    if (busy) return;
    if (key === 'del') {
      setPin(pin.slice(0, -1));
    } else if (key && pin.length < PIN_LENGTH) {
      const next = pin + key;
      setPin(next);
      // Đủ 4 số thì tự xác nhận.
      if (next.length === PIN_LENGTH) submit(next);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <Ionicons name="lock-closed" size={48} color="#fff" />
      <Text style={s.appName}>Danh bạ</Text>
      <Text style={s.title}>{title}</Text>
      <View style={s.dots} testID="pin-dots">
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View key={i} style={[s.dot, i < pin.length && s.dotFilled]} />
        ))}
      </View>
      <Text style={s.message} testID="pin-message">{message}</Text>
      <View style={s.pad}>
        {KEYS.map((k, i) => (
          <Pressable
            key={i}
            onPress={() => press(k)}
            disabled={!k}
            testID={k ? `pin-key-${k}` : undefined}
            style={({ pressed }) => [s.key, !k && { opacity: 0 }, pressed && { backgroundColor: 'rgba(255,255,255,0.3)' }]}
          >
            {k === 'del' ? <Ionicons name="backspace-outline" size={26} color="#fff" /> : <Text style={s.keyText}>{k}</Text>}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', padding: 24 },
  appName: { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 8 },
  title: { color: '#E3F2FD', fontSize: 15, marginTop: 16, textAlign: 'center' },
  dots: { flexDirection: 'row', marginTop: 24 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff', marginHorizontal: 10 },
  dotFilled: { backgroundColor: '#fff' },
  message: { color: '#FFCDD2', minHeight: 40, marginTop: 12, textAlign: 'center' },
  pad: { flexDirection: 'row', flexWrap: 'wrap', width: 270, justifyContent: 'center' },
  key: { width: 72, height: 72, borderRadius: 36, margin: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  keyText: { color: '#fff', fontSize: 28, fontWeight: '500' },
});
