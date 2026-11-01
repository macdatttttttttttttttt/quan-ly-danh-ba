// Màn hình 5 – Danh sách liên hệ yêu thích (UC-06).
import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useServices } from '../ServicesContext';
import { ContactRow, EmptyState, styles } from '../ui/components';

export default function FavoritesScreen({ navigation }) {
  const { contacts } = useServices();
  const [items, setItems] = useState([]);

  useFocusEffect(
    useCallback(() => {
      contacts.list({ favoritesOnly: true }).then(setItems);
    }, [contacts]),
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => (
          <ContactRow contact={item} onPress={() => navigation.navigate('ContactDetail', { id: item.id })} />
        )}
        ListEmptyComponent={<EmptyState icon="star-outline" text={'Chưa có liên hệ yêu thích.\nMở một liên hệ và bấm ☆ để thêm.'} />}
      />
    </View>
  );
}
