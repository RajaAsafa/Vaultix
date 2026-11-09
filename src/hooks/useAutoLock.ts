import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useVaultStore } from '../store/vaultStore';

export function useAutoLock(): void {
  const status = useAuthStore((s) => s.status);
  const lockVault = useAuthStore((s) => s.lockVault);
  const clearMemory = useVaultStore((s) => s.clearMemory);
  const appState = useRef<AppStateStatus>((AppState.currentState ?? 'active') as AppStateStatus);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // If moving from active to background/inactive, lock vault immediately
      if (
        appState.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        if (status === 'unlocked') {
          clearMemory();
          lockVault();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [status, lockVault, clearMemory]);
}
