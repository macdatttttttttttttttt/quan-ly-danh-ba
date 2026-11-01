// Ghép tầng dữ liệu SQLite với tầng nghiệp vụ và cung cấp cho các màn hình.
import { createContext, useContext, useMemo } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { SqliteContactRepository } from './db/SqliteContactRepository';
import { SqliteGroupRepository } from './db/SqliteGroupRepository';
import { SqliteSettingsRepository } from './db/SqliteSettingsRepository';
import { ContactService } from './services/ContactService';
import { GroupService } from './services/GroupService';
import { AuthService } from './services/AuthService';

const ServicesContext = createContext(null);

const sha256 = (text) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
const makeSalt = () => Crypto.randomUUID();

export function ServicesProvider({ children }) {
  const db = useSQLiteContext();
  const services = useMemo(
    () => ({
      contacts: new ContactService(new SqliteContactRepository(db)),
      groups: new GroupService(new SqliteGroupRepository(db)),
      auth: new AuthService(new SqliteSettingsRepository(db), sha256, makeSalt),
    }),
    [db],
  );
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices() {
  return useContext(ServicesContext);
}
