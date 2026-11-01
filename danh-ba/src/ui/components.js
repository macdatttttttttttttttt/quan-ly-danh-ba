// Các thành phần giao diện dùng chung.
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, avatarColor } from './theme';

export function Avatar({ id, name, size = 44 }) {
  const initials = String(name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(id) }]}>
      <Text style={{ color: '#fff', fontWeight: '600', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export function ContactRow({ contact, onPress, right }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]} testID={`contact-${contact.id}`}>
      <Avatar id={contact.id} name={contact.fullName} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{contact.fullName}</Text>
        <Text style={styles.rowSub}>{contact.phone}{contact.groupName ? `  ·  ${contact.groupName}` : ''}</Text>
      </View>
      {right ?? (contact.isFavorite ? <Ionicons name="star" size={18} color={colors.star} /> : null)}
    </Pressable>
  );
}

export function SearchBar({ value, onChangeText, placeholder = 'Tìm theo tên hoặc số điện thoại' }) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        testID="search-input"
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Field({ label, error, required, ...inputProps }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
      </Text>
      <TextInput
        style={[styles.input, error && { borderColor: colors.danger }]}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', icon, disabled, testID }) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : colors.card;
  const fg = variant === 'outline' ? colors.primary : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        variant === 'outline' && { borderWidth: 1, borderColor: colors.primary },
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 6 }} /> : null}
      <Text style={{ color: fg, fontWeight: '600', fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}

export function Fab({ onPress, icon = 'add', testID }) {
  return (
    <Pressable onPress={onPress} style={styles.fab} testID={testID}>
      <Ionicons name={icon} size={28} color="#fff" />
    </Pressable>
  );
}

export function EmptyState({ icon = 'people-outline', text }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={56} color={colors.border} />
      <Text style={{ color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  rowTitle: { fontSize: 16, color: colors.text, fontWeight: '500' },
  rowSub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  sectionHeader: {
    paddingHorizontal: 16, paddingVertical: 4, backgroundColor: colors.background,
    color: colors.primary, fontWeight: '700',
  },
  search: {
    flexDirection: 'row', alignItems: 'center', margin: 12, paddingHorizontal: 12, height: 42,
    backgroundColor: colors.card, borderRadius: 21, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: colors.text, outlineStyle: 'none' },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 4, fontWeight: '500' },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text,
  },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8,
  },
  fab: {
    position: 'absolute', right: 20, bottom: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
});
