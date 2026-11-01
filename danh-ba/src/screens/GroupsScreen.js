// Màn hình 6 – Quản lý nhóm liên hệ: thêm, đổi tên, xóa nhóm (UC-09).
import { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useServices } from '../ServicesContext';
import { Button, EmptyState, Fab, styles } from '../ui/components';
import { colors } from '../ui/theme';
import { confirm } from '../ui/dialogs';

export default function GroupsScreen({ navigation }) {
  const { groups } = useServices();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // { id?, name }
  const [error, setError] = useState('');

  const load = useCallback(() => groups.list().then(setItems), [groups]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    try {
      if (editing.id) await groups.rename(editing.id, editing.name);
      else await groups.create(editing.name);
      setEditing(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(g) {
    const ok = await confirm(
      'Xóa nhóm',
      `Xóa nhóm "${g.name}"? ${g.contactCount} liên hệ trong nhóm sẽ được giữ lại và chuyển về "Chưa phân nhóm".`,
      'Xóa',
    );
    if (ok) {
      await groups.remove(g.id);
      load();
    }
  }

  function openEditor(g) {
    setError('');
    setEditing(g ? { id: g.id, name: g.name } : { name: '' });
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(g) => String(g.id)}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => navigation.navigate('GroupContacts', { groupId: item.id, title: item.name })}>
            <View style={s.icon}><Ionicons name="people" size={22} color={colors.primary} /></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.rowSub}>{item.contactCount} liên hệ</Text>
            </View>
            <Pressable onPress={() => openEditor(item)} hitSlop={8} style={{ padding: 6 }}>
              <Ionicons name="pencil" size={20} color={colors.textMuted} />
            </Pressable>
            <Pressable onPress={() => remove(item)} hitSlop={8} style={{ padding: 6 }}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </Pressable>
        )}
        ListEmptyComponent={<EmptyState icon="folder-open-outline" text="Chưa có nhóm nào" />}
        contentContainerStyle={{ paddingBottom: 96 }}
      />
      <Fab onPress={() => openEditor(null)} icon="add" testID="add-group" />

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={s.backdrop}>
          <View style={s.dialog}>
            <Text style={s.dialogTitle}>{editing?.id ? 'Đổi tên nhóm' : 'Thêm nhóm mới'}</Text>
            <TextInput
              style={[styles.input, error && { borderColor: colors.danger }]}
              value={editing?.name ?? ''}
              onChangeText={(name) => { setEditing((g) => ({ ...g, name })); setError(''); }}
              placeholder="Tên nhóm"
              maxLength={50}
              autoFocus
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <View style={{ flex: 1, marginRight: 8 }}><Button title="Hủy" variant="outline" onPress={() => setEditing(null)} /></View>
              <View style={{ flex: 1 }}><Button title="Lưu" onPress={save} /></View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: colors.card, borderRadius: 12, padding: 20 },
  dialogTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: colors.text },
});
