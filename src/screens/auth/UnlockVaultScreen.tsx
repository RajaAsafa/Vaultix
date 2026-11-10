import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { VaultInput } from '../../components/VaultInput';
import { VaultButton } from '../../components/VaultButton';
import { useAuthStore } from '../../store/authStore';
import { SettingsRepository } from '../../database/repositories/SettingsRepository';
import { isBiometricAuthenticationSupported } from '../../security/keyManager';

export const UnlockVaultScreen: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [localError, setLocalError] = useState('');

  // Anti-Brute Force states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const hasBiometricsRef = useRef(false);
  const cooldownRef = useRef(0);
  const isAuthenticatingRef = useRef(false);
  const needsPromptOnForegroundRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const unlockWithPassword = useAuthStore((s) => s.unlockWithPassword);
  const unlockWithBiometrics = useAuthStore((s) => s.unlockWithBiometrics);
  const errorMessage = useAuthStore((s) => s.errorMessage);
  const clearError = useAuthStore((s) => s.clearError);

  useEffect(() => {
    cooldownRef.current = cooldownSeconds;
  }, [cooldownSeconds]);

  const handleBiometricUnlock = useCallback(async () => {
    if (isAuthenticatingRef.current || cooldownRef.current > 0 || !hasBiometricsRef.current) {
      return;
    }

    isAuthenticatingRef.current = true;
    try {
      await unlockWithBiometrics();
    } finally {
      isAuthenticatingRef.current = false;
    }
  }, [unlockWithBiometrics]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          SecureStore.deleteItemAsync('vaultix_lockout_until').catch(() => {});
          setLocalError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let activeCooldown = 0;

      // Check persisted brute-force lockout
      try {
        const lockoutStr = await SecureStore.getItemAsync('vaultix_lockout_until');
        if (lockoutStr) {
          const lockoutUntil = parseInt(lockoutStr, 10);
          const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
          if (remaining > 0) {
            activeCooldown = remaining;
            if (mounted) {
              cooldownRef.current = remaining;
              setCooldownSeconds(remaining);
              setLocalError(`Keamanan aktif: Silakan tunggu ${remaining} detik`);
            }
          } else {
            await SecureStore.deleteItemAsync('vaultix_lockout_until').catch(() => {});
          }
        }
      } catch {}

      if (!mounted) return;

      try {
        const settings = await SettingsRepository.getSettings();
        if (!mounted) return;

        const canUseBiometrics =
          settings.biometric_enabled === 1 && isBiometricAuthenticationSupported();
        hasBiometricsRef.current = canUseBiometrics;
        setHasBiometrics(canUseBiometrics);

        // Auto trigger 1x only when active in foreground; defer if locking during background/close
        if (canUseBiometrics && activeCooldown === 0) {
          if (AppState.currentState === 'active') {
            handleBiometricUnlock();
          } else {
            needsPromptOnForegroundRef.current = true;
          }
        }
      } catch {
        if (mounted) {
          hasBiometricsRef.current = false;
          setHasBiometrics(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [handleBiometricUnlock]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'background') {
        needsPromptOnForegroundRef.current = true;
        return;
      }

      if (
        nextState === 'active' &&
        (prevState === 'background' || needsPromptOnForegroundRef.current)
      ) {
        needsPromptOnForegroundRef.current = false;
        if (hasBiometricsRef.current && cooldownRef.current === 0) {
          handleBiometricUnlock();
        }
      }
    });

    return () => subscription.remove();
  }, [handleBiometricUnlock]);

  const handlePasswordUnlock = async () => {
    if (cooldownSeconds > 0) {
      setLocalError(`Keamanan aktif: Silakan tunggu ${cooldownSeconds} detik`);
      return;
    }

    if (!password) {
      setLocalError('Masukkan Master Password Anda');
      return;
    }

    setLocalError('');
    setLoading(true);
    const success = await unlockWithPassword(password);
    setLoading(false);

    if (!success) {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);

      if (nextFailures >= 5) {
        const cooldown = nextFailures === 5 ? 30 : 60;
        setCooldownSeconds(cooldown);
        SecureStore.setItemAsync(
          'vaultix_lockout_until',
          (Date.now() + cooldown * 1000).toString()
        ).catch(() => {});
        setLocalError(
          `Terlalu banyak percobaan salah (${nextFailures}x). Sistem dijeda selama ${cooldown} detik.`
        );
      } else {
        setLocalError(
          `Master Password salah. Percobaan ${nextFailures}/5 sebelum jeda keamanan.`
        );
      }
    } else {
      setFailedAttempts(0);
      setCooldownSeconds(0);
      SecureStore.deleteItemAsync('vaultix_lockout_until').catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            accessibilityLabel="Logo Vaultix"
            source={require('../../../assets/icon.png')}
            style={styles.logoImage}
          />
        </View>

        <Text style={styles.title}>Vault Terkunci</Text>
        <Text style={styles.subtitle}>
          Masukkan Master Password Anda untuk membuka brankas
        </Text>

        <View style={styles.form}>
          <VaultInput
            editable={cooldownSeconds === 0}
            isPassword
            error={
              cooldownSeconds > 0
                ? `Keamanan aktif: Coba lagi dalam ${cooldownSeconds} detik`
                : localError || (errorMessage ?? undefined)
            }
            placeholder={cooldownSeconds > 0 ? 'Terkunci sementara...' : 'Masukkan Master Password'}
            value={password}
            onChangeText={(txt) => {
              if (localError) setLocalError('');
              if (errorMessage) clearError();
              setPassword(txt);
            }}
          />

          <VaultButton
            disabled={cooldownSeconds > 0}
            loading={loading}
            title={cooldownSeconds > 0 ? `Tunggu (${cooldownSeconds}s)` : 'Buka Vault'}
            variant="primary"
            onPress={handlePasswordUnlock}
          />

          {hasBiometrics && (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.biometricButton}
              onPress={handleBiometricUnlock}
            >
              <Ionicons color={Colors.accent} name="finger-print" size={28} />
              <Text style={styles.biometricText}>Buka dengan Biometrik</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  form: {
    width: '100%',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  biometricText: {
    color: Colors.accent,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});
