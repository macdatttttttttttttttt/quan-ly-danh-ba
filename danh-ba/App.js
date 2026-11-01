// Điểm vào ứng dụng: mở CSDL SQLite, kiểm tra khóa PIN, dựng điều hướng.
import { Suspense, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { DATABASE_NAME, migrate } from './src/db/schema';
import { ServicesProvider, useServices } from './src/ServicesContext';
import { colors } from './src/ui/theme';
import LockScreen from './src/screens/LockScreen';
import ContactListScreen from './src/screens/ContactListScreen';
import ContactDetailScreen from './src/screens/ContactDetailScreen';
import ContactFormScreen from './src/screens/ContactFormScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TrashScreen from './src/screens/TrashScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = { Contacts: 'person', Favorites: 'star', Groups: 'people', Settings: 'settings' };

function Tabs({ onLock }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarIcon: ({ color, size }) => <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Contacts" component={ContactListScreen} options={{ title: 'Danh bạ' }} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Yêu thích' }} />
      <Tab.Screen name="Groups" component={GroupsScreen} options={{ title: 'Nhóm' }} />
      <Tab.Screen name="Settings" options={{ title: 'Cài đặt' }}>
        {(props) => <SettingsScreen {...props} onLock={onLock} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function Root() {
  const { auth } = useServices();
  const [state, setState] = useState('loading'); // loading | setup | locked | unlocked
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    auth.hasPin().then((has) => setState(has ? 'locked' : 'setup'));
  }, [auth]);

  // Tự khóa lại khi ứng dụng chuyển xuống nền.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current === 'active' && next === 'background') {
        setState((s) => (s === 'unlocked' ? 'locked' : s));
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  if (state === 'loading') return <Loading />;
  if (state !== 'unlocked') {
    return <LockScreen key={state} mode={state === 'setup' ? 'setup' : 'unlock'} onUnlocked={() => setState('unlocked')} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
        <Stack.Screen name="Home" options={{ headerShown: false }}>
          {() => <Tabs onLock={() => setState('locked')} />}
        </Stack.Screen>
        <Stack.Screen name="ContactDetail" component={ContactDetailScreen} options={{ title: 'Chi tiết liên hệ' }} />
        <Stack.Screen name="ContactForm" component={ContactFormScreen} options={{ title: 'Thêm liên hệ' }} />
        <Stack.Screen name="GroupContacts" component={ContactListScreen} options={({ route }) => ({ title: route.params.title })} />
        <Stack.Screen name="Trash" component={TrashScreen} options={{ title: 'Thùng rác' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Suspense fallback={<Loading />}>
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate} useSuspense>
          <ServicesProvider>
            <Root />
          </ServicesProvider>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}
