import { create } from 'zustand';
import { VaultStatus } from '../types';
import {
  isVaultInitialized,
  setupInitialVault,
  unlockVaultWithPassword,
  unlockVaultWithBiometrics,
} from '../security/keyManager';
import { CategoryRepository } from '../database/repositories/CategoryRepository';
import { runMigrations } from '../database/migrations';

interface AuthState {
  status: VaultStatus;
  vek: Uint8Array | null;
  errorMessage: string | null;

  initCheck: () => Promise<void>;
  setupVault: (masterPassword: string) => Promise<void>;
  unlockWithPassword: (masterPassword: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  lockVault: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  vek: null,
  errorMessage: null,

  initCheck: async () => {
    try {
      await runMigrations();
      const initialized = await isVaultInitialized();
      set({
        status: initialized ? 'locked' : 'uninitialized',
        errorMessage: null,
      });
    } catch (err: unknown) {
      set({
        status: 'uninitialized',
        errorMessage: err instanceof Error ? err.message : 'Database initialization error',
      });
    }
  },

  setupVault: async (masterPassword: string) => {
    try {
      set({ status: 'loading', errorMessage: null });
      const { vek } = await setupInitialVault(masterPassword);

      // Seed default categories with the new VEK
      await CategoryRepository.seedDefaultCategories(vek);

      set({
        status: 'unlocked',
        vek,
        errorMessage: null,
      });
    } catch (err: unknown) {
      set({
        status: 'uninitialized',
        errorMessage: err instanceof Error ? err.message : 'Setup failed',
      });
      throw err;
    }
  },

  unlockWithPassword: async (masterPassword: string): Promise<boolean> => {
    try {
      set({ errorMessage: null });
      const vek = await unlockVaultWithPassword(masterPassword);
      set({
        status: 'unlocked',
        vek,
        errorMessage: null,
      });
      return true;
    } catch (err: unknown) {
      set({
        errorMessage: err instanceof Error ? err.message : 'Password salah',
      });
      return false;
    }
  },

  unlockWithBiometrics: async (): Promise<boolean> => {
    try {
      set({ errorMessage: null });
      const vek = await unlockVaultWithBiometrics();
      set({
        status: 'unlocked',
        vek,
        errorMessage: null,
      });
      return true;
    } catch (err: unknown) {
      set({
        errorMessage: err instanceof Error ? err.message : 'Autentikasi biometrik gagal',
      });
      return false;
    }
  },

  lockVault: () => {
    // In-memory zeroing of VEK buffer for security
    set((state) => {
      if (state.vek) {
        state.vek.fill(0);
      }
      return {
        status: 'locked',
        vek: null,
        errorMessage: null,
      };
    });
  },

  clearError: () => set({ errorMessage: null }),
}));
