// Màn hình 7 – Thùng rác: khôi phục hoặc xóa vĩnh viễn liên hệ (UC-04).
import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useServices } from '../ServicesContext';
import { ContactRow, EmptyState, styles } from '../ui/components';
import { colors } from '../ui/theme';
import { confirm, notify } from '../ui/dialogs';

export default function TrashScreen() {
  const { contacts } = useServices();
  const [items, setItems] = useState([]);

  const load = useCallback(() => contacts.listTrash().then(setItems), [contacts]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function restore(c) {
    try {
      await contacts.restore(c.id);
      load();
    } catch (e) {
      notify('Không khôi phục được', e.message);
    }
  }

  async function purge(c) {
    if (await confirm('Xóa vĩnh viễn', `Liên hệ "${c.fullName}" sẽ bị xóa hẳn và không thể khôi phục.`, 'Xóa vĩnh viễn')) {
      await contacts.deletePermanently(c.id);
      load();
    }
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => (
          <ContactRow
            contact={item}
            right={
              <View style={{ flexDirection: 'row' }}>
                <Pressable onPress={() => restore(item)} hitSlop={8} style={{ padding: 6 }} testID={`restore-${item.id}`}>
                  <Ionicons name="arrow-undo" size={22} color={colors.success} />
                </Pressable>
                <Pressable onPress={() => purge(item)} hitSlop={8} style={{ padding: 6 }}>
                  <Ionicons name="close-circle" size={22} color={colors.danger} />
                </Pressable>
              </View>
            }
          />
        )}
        ListEmptyComponent={<EmptyState icon="trash-outline" text="Thùng rác trống" />}
      />
    </View>
  );
}
