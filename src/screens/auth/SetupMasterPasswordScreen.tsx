import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { VaultInput } from '../../components/VaultInput';
import { VaultButton } from '../../components/VaultButton';
import { useAuthStore } from '../../store/authStore';
import { checkPasswordStrength } from '../../security/generator';

type Props = NativeStackScreenProps<AuthStackParamList, 'SetupMasterPassword'>;

export const SetupMasterPasswordScreen: React.FC<Props> = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Inline red errors instead of popups
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [setupError, setSetupError] = useState('');

  const setupVault = useAuthStore((s) => s.setupVault);

  const strength = checkPasswordStrength(password);

  const getStrengthColor = () => {
    switch (strength.level) {
      case 'Very Strong':
      case 'Strong':
        return Colors.success;
      case 'Medium':
        return Colors.warning;
      case 'Weak':
      default:
        return Colors.error;
    }
  };

  const handleCreate = async () => {
    let hasError = false;

    if (password.length < 8) {
      setPasswordError('Master Password harus minimal 8 karakter');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (password !== confirmPassword) {
      setConfirmError('Konfirmasi password tidak cocok');
      hasError = true;
    } else {
      setConfirmError('');
    }

    if (hasError) return;

    try {
      setLoading(true);
      setSetupError('');
      await setupVault(password);
    } catch (err: unknown) {
      setSetupError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat brankas.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Ionicons color={Colors.accent} name="key" size={40} />
            <Text style={styles.title}>Buat Master Password</Text>
            <Text style={styles.subtitle}>
              Kunci utama ini digunakan untuk mengenkripsi seluruh brankas Anda. Pastikan Anda mengingatnya dengan baik.
            </Text>
          </View>

          <View style={styles.alertBox}>
            <Ionicons color={Colors.warning} name="warning-outline" size={20} />
            <Text style={styles.alertText}>
              Tidak ada server pemulihan! Jika Anda lupa Master Password, data di dalam Vault tidak dapat dipulihkan.
            </Text>
          </View>

          {setupError ? (
            <View style={styles.errorBox}>
              <Ionicons color={Colors.error} name="alert-circle" size={18} />
              <Text style={styles.errorBoxText}>{setupError}</Text>
            </View>
          ) : null}

          <VaultInput
            isPassword
            error={passwordError}
            label="Master Password"
            placeholder="Minimal 8 karakter"
            value={password}
            onChangeText={(txt) => {
              setPassword(txt);
              if (passwordError) setPasswordError('');
            }}
          />

          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBarBg}>
                <View
                  style={[
                    styles.strengthBarFill,
                    {
                      width: `${(strength.score / 4) * 100}%`,
                      backgroundColor: getStrengthColor(),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                Kekuatan: {strength.label}
              </Text>
            </View>
          )}

          <VaultInput
            isPassword
            error={confirmError}
            label="Konfirmasi Master Password"
            placeholder="Ulangi Master Password"
            value={confirmPassword}
            onChangeText={(txt) => {
              setConfirmPassword(txt);
              if (confirmError) setConfirmError('');
            }}
          />

          <View style={styles.buttonContainer}>
            <VaultButton
              loading={loading}
              title="Kunci & Buka Vault"
              variant="primary"
              onPress={handleCreate}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 182, 77, 0.1)',
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  alertText: {
    flex: 1,
    color: Colors.warning,
    fontSize: Typography.sizes.xs,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(228, 91, 99, 0.12)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorBoxText: {
    flex: 1,
    color: Colors.error,
    fontSize: Typography.sizes.sm,
  },
  strengthContainer: {
    marginBottom: Spacing.md,
  },
  strengthBarBg: {
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: 4,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  strengthText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  buttonContainer: {
    marginTop: Spacing.md,
  },
});
