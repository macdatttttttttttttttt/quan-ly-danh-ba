// Màn hình 3 – Chi tiết liên hệ: gọi, nhắn tin, email, yêu thích, sửa, xóa (UC-03, UC-04, UC-06, UC-08).
import { useCallback, useLayoutEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useServices } from '../ServicesContext';
import { Avatar, Button, styles } from '../ui/components';
import { colors } from '../ui/theme';
import { confirm, notify } from '../ui/dialogs';

export default function ContactDetailScreen({ navigation, route }) {
  const { contacts } = useServices();
  const { id } = route.params;
  const [c, setC] = useState(null);

  useFocusEffect(
    useCallback(() => {
      contacts.getById(id).then(setC).catch(() => navigation.goBack());
    }, [contacts, id, navigation]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        c ? (
          <Pressable onPress={() => navigation.navigate('ContactForm', { id })} hitSlop={10} testID="edit-contact">
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </Pressable>
        ) : null,
    });
  }, [navigation, c, id]);

  if (!c) return <View style={styles.screen} />;

  async function open(url) {
    try {
      await Linking.openURL(url);
    } catch {
      notify('Không thực hiện được', 'Thiết bị không hỗ trợ thao tác này');
    }
  }

  async function toggleFavorite() {
    const fav = await contacts.toggleFavorite(id);
    setC({ ...c, isFavorite: fav });
  }

  async function remove() {
    if (await confirm('Xóa liên hệ', `Chuyển "${c.fullName}" vào thùng rác?`, 'Xóa')) {
      await contacts.moveToTrash(id);
      navigation.goBack();
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={s.header}>
        <Avatar id={c.id} name={c.fullName} size={88} />
        <Text style={s.name} testID="detail-name">{c.fullName}</Text>
        {c.groupName ? <Text style={s.group}>{c.groupName}</Text> : null}
      </View>

      <View style={s.actions}>
        <Action icon="call" label="Gọi" onPress={() => open(`tel:${c.phone}`)} testID="action-call" />
        <Action icon="chatbubble" label="Nhắn tin" onPress={() => open(`sms:${c.phone}`)} />
        <Action icon="mail" label="Email" disabled={!c.email} onPress={() => open(`mailto:${c.email}`)} />
        <Action
          icon={c.isFavorite ? 'star' : 'star-outline'}
          label={c.isFavorite ? 'Bỏ thích' : 'Yêu thích'}
          color={colors.star}
          onPress={toggleFavorite}
          testID="action-favorite"
        />
      </View>

      <View style={s.card}>
        <Info icon="call-outline" label="Điện thoại" value={c.phone} />
        <Info icon="mail-outline" label="Email" value={c.email} />
        <Info icon="location-outline" label="Địa chỉ" value={c.address} />
        <Info icon="document-text-outline" label="Ghi chú" value={c.note} />
      </View>

      <View style={{ marginHorizontal: 16, marginTop: 24 }}>
        <Button title="Xóa liên hệ" variant="danger" icon="trash-outline" onPress={remove} testID="delete-contact" />
      </View>
    </ScrollView>
  );
}

function Action({ icon, label, onPress, disabled, color = colors.primary, testID }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[s.action, disabled && { opacity: 0.35 }]} testID={testID}>
      <View style={s.actionIcon}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={s.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function Info({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={s.info}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>{label}</Text>
        <Text style={{ fontSize: 16, color: colors.text, marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 24, backgroundColor: colors.card },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 12 },
  group: { marginTop: 4, color: colors.primary, backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10, overflow: 'hidden' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.card, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  action: { alignItems: 'center', width: 76 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, color: colors.text, marginTop: 6 },
  card: { backgroundColor: colors.card, marginTop: 12 },
  info: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});
