// Màn hình 2 – Danh sách liên hệ theo A–Z, tìm kiếm (UC-01, UC-05).
// Dùng lại cho danh sách liên hệ của một nhóm (route.params.groupId).
import { useCallback, useState } from 'react';
import { SectionList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useServices } from '../ServicesContext';
import { ContactService } from '../services/ContactService';
import { ContactRow, EmptyState, Fab, SearchBar, styles } from '../ui/components';

export default function ContactListScreen({ navigation, route }) {
  const { contacts } = useServices();
  const groupId = route.params?.groupId ?? null;
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    setItems(await contacts.list({ keyword, groupId }));
  }, [contacts, keyword, groupId]);

  // Tải lại mỗi khi màn hình được hiển thị hoặc từ khóa thay đổi.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sections = ContactService.toSections(items);

  return (
    <View style={styles.screen}>
      <SearchBar value={keyword} onChangeText={setKeyword} />
      <Text style={{ marginHorizontal: 16, marginBottom: 4, color: '#6B7280', fontSize: 12 }} testID="contact-count">
        {items.length} liên hệ
      </Text>
      <SectionList
        sections={sections}
        keyExtractor={(c) => String(c.id)}
        renderSectionHeader={({ section }) => <Text style={styles.sectionHeader}>{section.title}</Text>}
        renderItem={({ item }) => (
          <ContactRow contact={item} onPress={() => navigation.navigate('ContactDetail', { id: item.id })} />
        )}
        ListEmptyComponent={
          <EmptyState text={keyword ? `Không tìm thấy liên hệ phù hợp với "${keyword}"` : 'Chưa có liên hệ nào.\nBấm + để thêm mới.'} />
        }
        contentContainerStyle={{ paddingBottom: 96 }}
        stickySectionHeadersEnabled
      />
      <Fab testID="add-contact" onPress={() => navigation.navigate('ContactForm', { groupId })} />
    </View>
  );
}
