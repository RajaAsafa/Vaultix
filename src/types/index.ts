/**
 * Core Type Definitions for Vaultix
 * Strict constraint: No website URL field.
 */

export interface AccountRecord {
  id: string;
  account_name_encrypted: Uint8Array;
  username_encrypted: Uint8Array | null;
  email_encrypted: Uint8Array | null;
  password_encrypted: Uint8Array;
  category_id: string | null;
  notes_encrypted: Uint8Array | null;
  is_favorite: number; // 0 or 1
  created_at: string;  // ISO 8601
  updated_at: string;  // ISO 8601
}

export interface DecryptedAccount {
  id: string;
  accountName: string;
  username?: string;
  email?: string;
  password: string;
  categoryId?: string | null;
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRecord {
  id: string;
  name_encrypted: Uint8Array;
  icon: string;
  created_at: string;
}

export interface DecryptedCategory {
  id: string;
  name: string;
  icon: string;
  createdAt: string;
}

export interface ReminderRecord {
  id: string;
  account_id: string;
  reminder_date: string;
  is_enabled: number; // 0 or 1
}

export interface SettingsRecord {
  id: number;
  auto_lock_duration: number; // in seconds (0 = Immediately, 30, 60, 300, 600)
  biometric_enabled: number;   // 0 or 1
  theme: string;               // 'dark'
  clipboard_timeout: number;   // in seconds (default 30)
}

export interface SecurityMetadataRecord {
  id: number;
  kdf_salt: Uint8Array;
  kdf_algorithm: string;
  kdf_params: string;          // JSON string: { memory, iterations, parallelism }
  wrapped_vek: Uint8Array;     // AES-256-GCM wrapped VEK: [12B IV][16B Tag][Ciphertext]
  created_at: string;
  updated_at: string;
}

export type VaultStatus = 'loading' | 'uninitialized' | 'locked' | 'unlocked';

export type PasswordStrengthLevel = 'Weak' | 'Medium' | 'Strong' | 'Very Strong';

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  level: PasswordStrengthLevel;
  feedback: string[];
}

// Navigation Param Lists
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  AddAccount: { categoryId?: string } | undefined;
  EditAccount: { accountId: string };
  AccountDetail: { accountId: string };
  ManageCategories: undefined;
  SecurityDashboard: undefined;
  BackupRestore: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  SetupMasterPassword: undefined;
  UnlockVault: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  VaultTab: undefined;
  GeneratorTab: undefined;
  SecurityTab: undefined;
  SettingsTab: undefined;
};
