import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { SettingsRepository } from '../database/repositories/SettingsRepository';

export function useAutoLock(): void {
  const status = useAuthStore((s) => s.status);
  const lockVault = useAuthStore((s) => s.lockVault);

  const appState = useRef<AppStateStatus>((AppState.currentState ?? 'active') as AppStateStatus);
  const backgroundTimestamp = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      const prevState = appState.current;
      appState.current = nextAppState;

      if (status !== 'unlocked') {
        return;
      }

      const settings = await SettingsRepository.getSettings().catch(() => null);
      const autoLockSeconds = settings?.auto_lock_duration ?? 60;

      // When app moves to background (handles active -> inactive -> background on Android)
      if (/active|inactive/.test(prevState) && nextAppState === 'background') {
        if (autoLockSeconds === 0) {
          // 0 = Lock Immediately
          lockVault();
        } else if (backgroundTimestamp.current === null) {
          // Record background timestamp
          backgroundTimestamp.current = Date.now();
        }
      }

      // When app returns to active from background
      if (/background|inactive/.test(prevState) && nextAppState === 'active') {
        if (backgroundTimestamp.current !== null) {
          const elapsed = (Date.now() - backgroundTimestamp.current) / 1000;
          if (elapsed >= autoLockSeconds) {
            lockVault();
          }
          backgroundTimestamp.current = null;
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [status, lockVault]);
}
