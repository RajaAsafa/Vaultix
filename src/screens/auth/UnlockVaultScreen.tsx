import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { VaultInput } from '../../components/VaultInput';
import { VaultButton } from '../../components/VaultButton';
import { useAuthStore } from '../../store/authStore';

export const UnlockVaultScreen: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  const unlockWithPassword = useAuthStore((s) => s.unlockWithPassword);
  const unlockWithBiometrics = useAuthStore((s) => s.unlockWithBiometrics);
  const errorMessage = useAuthStore((s) => s.errorMessage);
  const clearError = useAuthStore((s) => s.clearError);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(compatible && enrolled);

      // Auto trigger biometric prompt if available
      if (compatible && enrolled) {
        handleBiometricUnlock();
      }
    })();
  }, []);

  const handlePasswordUnlock = async () => {
    if (!password) {
      Alert.alert('Perhatian', 'Masukkan Master Password Anda');
      return;
    }

    setLoading(true);
    const success = await unlockWithPassword(password);
    setLoading(false);

    if (!success) {
      Alert.alert('Gagal', 'Master Password salah. Silakan coba lagi.');
    }
  };

  const handleBiometricUnlock = async () => {
    try {
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Buka Vaultix dengan Biometrik',
        fallbackLabel: 'Gunakan Master Password',
      });

      if (authResult.success) {
        await unlockWithBiometrics();
      }
    } catch {
      // Biometric failed or cancelled, user can use password
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons color={Colors.accent} name="lock-closed" size={56} />
        </View>

        <Text style={styles.title}>Vault Terkunci</Text>
        <Text style={styles.subtitle}>
          Masukkan Master Password Anda untuk membuka brankas
        </Text>

        <View style={styles.form}>
          <VaultInput
            isPassword
            error={errorMessage ?? undefined}
            placeholder="Masukkan Master Password"
            value={password}
            onChangeText={(txt) => {
              if (errorMessage) clearError();
              setPassword(txt);
            }}
          />

          <VaultButton
            loading={loading}
            title="Buka Vault"
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
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
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
