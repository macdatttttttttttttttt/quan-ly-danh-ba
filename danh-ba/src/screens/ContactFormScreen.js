// Màn hình 4 – Thêm / sửa liên hệ, kiểm tra dữ liệu nhập (UC-02, UC-03).
import { useEffect, useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useServices } from '../ServicesContext';
import { BusinessError } from '../services/errors';
import { Button, Field, styles } from '../ui/components';
import { colors } from '../ui/theme';
import { notify } from '../ui/dialogs';

const EMPTY = { fullName: '', phone: '', email: '', address: '', note: '', groupId: null };

export default function ContactFormScreen({ navigation, route }) {
  const { contacts, groups } = useServices();
  const id = route.params?.id ?? null;
  const [form, setForm] = useState({ ...EMPTY, groupId: route.params?.groupId ?? null });
  const [errors, setErrors] = useState({});
  const [groupList, setGroupList] = useState([]);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: id ? 'Sửa liên hệ' : 'Thêm liên hệ' });
  }, [navigation, id]);

  useEffect(() => {
    groups.list().then(setGroupList);
    if (id) {
      contacts.getById(id).then((c) =>
        setForm({
          fullName: c.fullName, phone: c.phone, email: c.email ?? '', address: c.address ?? '',
          note: c.note ?? '', groupId: c.groupId,
        }),
      );
    }
  }, [id, contacts, groups]);

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function save() {
    setSaving(true);
    try {
      if (id) await contacts.update(id, form);
      else await contacts.create(form);
      navigation.goBack();
    } catch (e) {
      if (e instanceof BusinessError && Object.keys(e.fieldErrors).length) setErrors(e.fieldErrors);
      else notify('Không lưu được liên hệ', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Field label="Họ và tên" required value={form.fullName} onChangeText={set('fullName')} error={errors.fullName}
          placeholder="VD: Nguyễn Văn An" maxLength={100} testID="input-name" />
        <Field label="Số điện thoại" required value={form.phone} onChangeText={set('phone')} error={errors.phone}
          placeholder="VD: 0912 345 678" keyboardType="phone-pad" testID="input-phone" />
        <Field label="Email" value={form.email} onChangeText={set('email')} error={errors.email}
          placeholder="VD: an@gmail.com" keyboardType="email-address" autoCapitalize="none" testID="input-email" />
        <Field label="Địa chỉ" value={form.address} onChangeText={set('address')} placeholder="VD: Lê Chân, Hải Phòng" />
        <Field label="Ghi chú" value={form.note} onChangeText={set('note')} error={errors.note}
          multiline numberOfLines={3} maxLength={500} style={[styles.input, { minHeight: 72, textAlignVertical: 'top' }]} />

        <Text style={styles.label}>Nhóm</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
          <Chip label="Chưa phân nhóm" active={form.groupId == null} onPress={() => set('groupId')(null)} />
          {groupList.map((g) => (
            <Chip key={g.id} label={g.name} active={form.groupId === g.id} onPress={() => set('groupId')(g.id)} />
          ))}
        </View>

        <Button title={saving ? 'Đang lưu...' : 'Lưu'} icon="checkmark" onPress={save} disabled={saving} testID="save-contact" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8,
        borderWidth: 1, borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primaryLight : colors.card,
      }}
    >
      <Text style={{ color: active ? colors.primary : colors.text }}>{label}</Text>
    </Pressable>
  );
}
