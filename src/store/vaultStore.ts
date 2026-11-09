import { create } from 'zustand';
import {
  DecryptedAccount,
  DecryptedCategory,
  AccountRecord,
  DecryptedPasswordHistory,
} from '../types';
import { AccountRepository } from '../database/repositories/AccountRepository';
import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { encryptAesGcm, decryptAesGcm } from '../security/cipher';

interface VaultState {
  accounts: DecryptedAccount[];
  categories: DecryptedCategory[];
  isLoading: boolean;
  searchQuery: string;
  selectedCategory: string | null;
  filterFavoritesOnly: boolean;

  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  setFilterFavoritesOnly: (enabled: boolean) => void;

  loadVaultData: (vek: Uint8Array) => Promise<void>;
  addAccount: (
    data: Omit<DecryptedAccount, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'>,
    vek: Uint8Array
  ) => Promise<void>;
  updateAccount: (account: DecryptedAccount, vek: Uint8Array) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  getPasswordHistory: (accountId: string, vek: Uint8Array) => Promise<DecryptedPasswordHistory[]>;

  clearMemory: () => void;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  accounts: [],
  categories: [],
  isLoading: false,
  searchQuery: '',
  selectedCategory: null,
  filterFavoritesOnly: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (catId) => set({ selectedCategory: catId }),
  setFilterFavoritesOnly: (enabled) => set({ filterFavoritesOnly: enabled }),

  loadVaultData: async (vek: Uint8Array) => {
    set({ isLoading: true });
    try {
      const [accountRecords, categoryList] = await Promise.all([
        AccountRepository.getAll(),
        CategoryRepository.getDecryptedCategories(vek),
      ]);

      const decryptedAccounts: DecryptedAccount[] = [];

      for (const record of accountRecords) {
        try {
          const accountName = await decryptAesGcm(new Uint8Array(record.account_name_encrypted), vek);
          const password = await decryptAesGcm(new Uint8Array(record.password_encrypted), vek);

          const username = record.username_encrypted
            ? await decryptAesGcm(new Uint8Array(record.username_encrypted), vek)
            : undefined;

          const email = record.email_encrypted
            ? await decryptAesGcm(new Uint8Array(record.email_encrypted), vek)
            : undefined;

          const notes = record.notes_encrypted
            ? await decryptAesGcm(new Uint8Array(record.notes_encrypted), vek)
            : undefined;

          const pin = record.pin_encrypted
            ? await decryptAesGcm(new Uint8Array(record.pin_encrypted), vek)
            : undefined;

          const authType = (record.auth_type === 'pin' ? 'pin' : 'password') as 'password' | 'pin';

          decryptedAccounts.push({
            id: record.id,
            accountName,
            authType,
            username,
            email,
            password,
            pin: pin || (authType === 'pin' ? password : undefined),
            categoryId: record.category_id,
            notes,
            isFavorite: record.is_favorite === 1,
            createdAt: record.created_at,
            updatedAt: record.updated_at,
          });
        } catch {
          // If decryption fails for single item, skip or mark corrupted
          continue;
        }
      }

      set({
        accounts: decryptedAccounts,
        categories: categoryList,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  addAccount: async (data, vek) => {
    const id = 'acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const now = new Date().toISOString();

    const authType = data.authType || (data.pin && !data.password ? 'pin' : 'password');
    const secret = authType === 'pin' ? (data.pin || '') : (data.password || '');

    const accountNameEncrypted = await encryptAesGcm(data.accountName, vek);
    const passwordEncrypted = await encryptAesGcm(secret, vek);
    const pinEncrypted = data.pin ? await encryptAesGcm(data.pin, vek) : (authType === 'pin' ? passwordEncrypted : null);
    const usernameEncrypted = data.username ? await encryptAesGcm(data.username, vek) : null;
    const emailEncrypted = data.email ? await encryptAesGcm(data.email, vek) : null;
    const notesEncrypted = data.notes ? await encryptAesGcm(data.notes, vek) : null;

    const record: AccountRecord = {
      id,
      account_name_encrypted: accountNameEncrypted,
      username_encrypted: usernameEncrypted,
      email_encrypted: emailEncrypted,
      password_encrypted: passwordEncrypted,
      pin_encrypted: pinEncrypted,
      auth_type: authType,
      category_id: data.categoryId || null,
      notes_encrypted: notesEncrypted,
      is_favorite: 0,
      created_at: now,
      updated_at: now,
    };

    await AccountRepository.create(record);

    const newDecrypted: DecryptedAccount = {
      id,
      accountName: data.accountName,
      authType,
      username: data.username,
      email: data.email,
      password: authType === 'password' ? data.password : undefined,
      pin: authType === 'pin' ? data.pin : undefined,
      categoryId: data.categoryId,
      notes: data.notes,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      accounts: [newDecrypted, ...state.accounts],
    }));
  },

  updateAccount: async (account, vek) => {
    const now = new Date().toISOString();
    const authType = account.authType || (account.pin && !account.password ? 'pin' : 'password');
    const secret = authType === 'pin' ? (account.pin || '') : (account.password || '');

    // Check if secret changed, if so save old secret to history
    const existing = get().accounts.find((a) => a.id === account.id);
    const existingSecret = existing?.authType === 'pin' ? existing?.pin : existing?.password;
    if (existing && existingSecret && existingSecret !== secret) {
      try {
        const oldEncrypted = await encryptAesGcm(existingSecret, vek);
        await AccountRepository.addPasswordHistory(account.id, oldEncrypted);
      } catch {
        // history save shouldn't block primary update
      }
    }

    const accountNameEncrypted = await encryptAesGcm(account.accountName, vek);
    const passwordEncrypted = await encryptAesGcm(secret, vek);
    const pinEncrypted = account.pin ? await encryptAesGcm(account.pin, vek) : (authType === 'pin' ? passwordEncrypted : null);
    const usernameEncrypted = account.username ? await encryptAesGcm(account.username, vek) : null;
    const emailEncrypted = account.email ? await encryptAesGcm(account.email, vek) : null;
    const notesEncrypted = account.notes ? await encryptAesGcm(account.notes, vek) : null;

    const record: AccountRecord = {
      id: account.id,
      account_name_encrypted: accountNameEncrypted,
      username_encrypted: usernameEncrypted,
      email_encrypted: emailEncrypted,
      password_encrypted: passwordEncrypted,
      pin_encrypted: pinEncrypted,
      auth_type: authType,
      category_id: account.categoryId || null,
      notes_encrypted: notesEncrypted,
      is_favorite: account.isFavorite ? 1 : 0,
      created_at: account.createdAt,
      updated_at: now,
    };

    await AccountRepository.update(record);

    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === account.id ? { ...account, authType, updatedAt: now } : acc
      ),
    }));
  },

  getPasswordHistory: async (accountId: string, vek: Uint8Array): Promise<DecryptedPasswordHistory[]> => {
    try {
      const records = await AccountRepository.getPasswordHistory(accountId);
      const decryptedList: DecryptedPasswordHistory[] = [];
      for (const r of records) {
        try {
          const pw = await decryptAesGcm(new Uint8Array(r.password_encrypted), vek);
          decryptedList.push({
            id: r.id,
            accountId: r.account_id,
            password: pw,
            createdAt: r.created_at,
          });
        } catch {
          continue;
        }
      }
      return decryptedList;
    } catch {
      return [];
    }
  },

  deleteAccount: async (id) => {
    await AccountRepository.delete(id);
    set((state) => ({
      accounts: state.accounts.filter((acc) => acc.id !== id),
    }));
  },

  toggleFavorite: async (id) => {
    const account = get().accounts.find((acc) => acc.id === id);
    if (!account) return;

    const nextState = !account.isFavorite;
    await AccountRepository.toggleFavorite(id, nextState);

    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, isFavorite: nextState } : acc
      ),
    }));
  },

  clearMemory: () => {
    set({
      accounts: [],
      categories: [],
      searchQuery: '',
      selectedCategory: null,
      filterFavoritesOnly: false,
    });
  },
}));
