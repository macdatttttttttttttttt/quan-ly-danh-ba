// Màn hình 8 – Cài đặt: đổi mã PIN, khóa ngay, mở thùng rác.
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useServices } from '../ServicesContext';
import { Button, Field, styles } from '../ui/components';
import { colors } from '../ui/theme';
import { notify } from '../ui/dialogs';

export default function SettingsScreen({ navigation, onLock }) {
  const { auth } = useServices();
  const [pins, setPins] = useState({ old: '', next: '', confirm: '' });
  const [error, setError] = useState('');

  const set = (k) => (v) => { setPins((p) => ({ ...p, [k]: v.replace(/\D/g, '') })); setError(''); };

  async function changePin() {
    try {
      await auth.changePin(pins.old, pins.next, pins.confirm);
      setPins({ old: '', next: '', confirm: '' });
      notify('Đã đổi mã PIN');
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <Item icon="trash-outline" label="Thùng rác" onPress={() => navigation.navigate('Trash')} />
      <Item icon="lock-closed-outline" label="Khóa ứng dụng ngay" onPress={onLock} />

      <Text style={s.section}>ĐỔI MÃ PIN</Text>
      <View style={{ paddingHorizontal: 16 }}>
        <Field label="Mã PIN hiện tại" value={pins.old} onChangeText={set('old')} secureTextEntry keyboardType="number-pad" maxLength={4} />
        <Field label="Mã PIN mới (4 số)" value={pins.next} onChangeText={set('next')} secureTextEntry keyboardType="number-pad" maxLength={4} />
        <Field label="Nhập lại mã PIN mới" value={pins.confirm} onChangeText={set('confirm')} secureTextEntry keyboardType="number-pad" maxLength={4} />
        {error ? <Text style={[styles.error, { marginBottom: 12 }]}>{error}</Text> : null}
        <Button title="Đổi mã PIN" icon="key-outline" onPress={changePin} />
      </View>

      <Text style={s.about}>Ứng dụng Quản lý danh bạ điện thoại – BTL Kỹ nghệ phần mềm (INF722){'\n'}Phiên bản 1.0.0</Text>
    </ScrollView>
  );
}

function Item({ icon, label, onPress }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={[styles.rowTitle, { flex: 1, marginLeft: 12 }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  section: { marginTop: 24, marginBottom: 8, marginHorizontal: 16, color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  about: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 32 },
});
