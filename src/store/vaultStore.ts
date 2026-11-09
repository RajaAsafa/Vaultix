import { create } from 'zustand';
import { DecryptedAccount, DecryptedCategory, AccountRecord } from '../types';
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

          decryptedAccounts.push({
            id: record.id,
            accountName,
            username,
            email,
            password,
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

    const accountNameEncrypted = await encryptAesGcm(data.accountName, vek);
    const passwordEncrypted = await encryptAesGcm(data.password, vek);
    const usernameEncrypted = data.username ? await encryptAesGcm(data.username, vek) : null;
    const emailEncrypted = data.email ? await encryptAesGcm(data.email, vek) : null;
    const notesEncrypted = data.notes ? await encryptAesGcm(data.notes, vek) : null;

    const record: AccountRecord = {
      id,
      account_name_encrypted: accountNameEncrypted,
      username_encrypted: usernameEncrypted,
      email_encrypted: emailEncrypted,
      password_encrypted: passwordEncrypted,
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
      username: data.username,
      email: data.email,
      password: data.password,
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

    const accountNameEncrypted = await encryptAesGcm(account.accountName, vek);
    const passwordEncrypted = await encryptAesGcm(account.password, vek);
    const usernameEncrypted = account.username ? await encryptAesGcm(account.username, vek) : null;
    const emailEncrypted = account.email ? await encryptAesGcm(account.email, vek) : null;
    const notesEncrypted = account.notes ? await encryptAesGcm(account.notes, vek) : null;

    const record: AccountRecord = {
      id: account.id,
      account_name_encrypted: accountNameEncrypted,
      username_encrypted: usernameEncrypted,
      email_encrypted: emailEncrypted,
      password_encrypted: passwordEncrypted,
      category_id: account.categoryId || null,
      notes_encrypted: notesEncrypted,
      is_favorite: account.isFavorite ? 1 : 0,
      created_at: account.createdAt,
      updated_at: now,
    };

    await AccountRepository.update(record);

    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === account.id ? { ...account, updatedAt: now } : acc
      ),
    }));
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
