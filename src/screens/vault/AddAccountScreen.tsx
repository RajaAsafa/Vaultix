import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { VaultInput } from '../../components/VaultInput';
import { VaultButton } from '../../components/VaultButton';
import { useVaultStore } from '../../store/vaultStore';
import { useAuthStore } from '../../store/authStore';
import {
  generatePassword,
  generatePin,
  checkPasswordStrength,
} from '../../security/generator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddAccount'>;

export const AddAccountScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialCategoryId = route.params?.categoryId;

  const [authType, setAuthType] = useState<'password' | 'pin'>('password');
  const [accountName, setAccountName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId ?? null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Inline red errors instead of popups
  const [accountNameError, setAccountNameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pinError, setPinError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const categories = useVaultStore((s) => s.categories);
  const addAccount = useVaultStore((s) => s.addAccount);
  const vek = useAuthStore((s) => s.vek);

  const strength = checkPasswordStrength(password);

  const handleGeneratePassword = () => {
    const generated = generatePassword({
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeAmbiguous: false,
    });
    setPassword(generated);
    if (passwordError) setPasswordError('');
  };

  const handleGeneratePin = () => {
    const generated = generatePin(6);
    setPin(generated);
    if (pinError) setPinError('');
  };

  const handleSave = async () => {
    let hasError = false;

    if (!accountName.trim()) {
      setAccountNameError('Nama Akun / Layanan wajib diisi');
      hasError = true;
    } else {
      setAccountNameError('');
    }

    if (authType === 'password') {
      if (!password || password.trim().length === 0) {
        setPasswordError('Password akun wajib diisi');
        hasError = true;
      } else {
        setPasswordError('');
      }
    } else {
      if (!pin || pin.trim().length === 0) {
        setPinError('PIN akun wajib diisi');
        hasError = true;
      } else if (pin.trim().length < 4) {
        setPinError('PIN minimal 4 digit angka');
        hasError = true;
      } else {
        setPinError('');
      }
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Format email tidak valid (contoh: user@mail.com)');
      hasError = true;
    } else {
      setEmailError('');
    }

    if (hasError) return;

    if (!vek) {
      setSubmitError('Sesi enkripsi tidak valid. Silakan kunci dan buka kembali.');
      return;
    }

    try {
      setLoading(true);
      setSubmitError('');
      await addAccount(
        {
          accountName: accountName.trim(),
          authType,
          username: username.trim() || undefined,
          email: email.trim() || undefined,
          password: authType === 'password' ? password : pin.trim(),
          pin: authType === 'pin' ? pin.trim() : undefined,
          categoryId,
          notes: notes.trim() || undefined,
        },
        vek
      );
      navigation.goBack();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal menyimpan akun');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons color={Colors.textPrimary} name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Akun</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {submitError ? (
            <View style={styles.errorBanner}>
              <Ionicons color={Colors.error} name="alert-circle" size={18} />
              <Text style={styles.errorBannerText}>{submitError}</Text>
            </View>
          ) : null}

          {/* Account Name */}
          <VaultInput
            error={accountNameError}
            label="Nama Layanan / Akun *"
            placeholder="contoh: Google, Steam, Discord"
            value={accountName}
            onChangeText={(txt) => {
              setAccountName(txt);
              if (accountNameError) setAccountNameError('');
            }}
          />

          {/* Username / ID */}
          <VaultInput
            label="Username / ID Akun (Opsional)"
            placeholder="contoh: gamer_id, user123"
            value={username}
            onChangeText={setUsername}
          />

          {/* Email */}
          <VaultInput
            autoCapitalize="none"
            error={emailError}
            keyboardType="email-address"
            label="Email (Opsional)"
            placeholder="contoh: user@mail.com"
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              if (emailError) setEmailError('');
            }}
          />

          {/* Security Credential Type Selector */}
          <Text style={styles.categoryLabel}>Tipe Keamanan</Text>
          <View style={styles.authTypeRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.authTypeTab,
                authType === 'password' && styles.authTypeTabActive,
              ]}
              onPress={() => {
                setAuthType('password');
                setPasswordError('');
                setPinError('');
              }}
            >
              <Ionicons
                color={authType === 'password' ? Colors.accent : Colors.textSecondary}
                name="key-outline"
                size={18}
              />
              <Text
                style={[
                  styles.authTypeText,
                  authType === 'password' && styles.authTypeTextActive,
                ]}
              >
                Password
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.authTypeTab,
                authType === 'pin' && styles.authTypeTabActive,
              ]}
              onPress={() => {
                setAuthType('pin');
                setPasswordError('');
                setPinError('');
              }}
            >
              <Ionicons
                color={authType === 'pin' ? Colors.accent : Colors.textSecondary}
                name="keypad-outline"
                size={18}
              />
              <Text
                style={[
                  styles.authTypeText,
                  authType === 'pin' && styles.authTypeTextActive,
                ]}
              >
                PIN
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conditional Credential Input */}
          {authType === 'password' ? (
            <>
              <VaultInput
                isPassword
                error={passwordError}
                label="Password *"
                placeholder="Masukkan atau buat password"
                rightAction={
                  <TouchableOpacity
                    style={styles.generateBtn}
                    onPress={handleGeneratePassword}
                  >
                    <Ionicons color={Colors.accent} name="flash" size={18} />
                    <Text style={styles.generateBtnText}>Acak</Text>
                  </TouchableOpacity>
                }
                value={password}
                onChangeText={(txt) => {
                  setPassword(txt);
                  if (passwordError) setPasswordError('');
                }}
              />

              {password.length > 0 && (
                <View style={styles.strengthBox}>
                  <Text style={styles.strengthLabel}>
                    Kekuatan:{' '}
                    <Text
                      style={{
                        color:
                          strength.level === 'Very Strong' || strength.level === 'Strong'
                            ? Colors.success
                            : strength.level === 'Medium'
                            ? Colors.warning
                            : Colors.error,
                      }}
                    >
                      {strength.level}
                    </Text>
                  </Text>
                </View>
              )}
            </>
          ) : (
            <VaultInput
              isPassword
              error={pinError}
              keyboardType="numeric"
              label="PIN Keamanan *"
              placeholder="Masukkan 4-8 digit angka PIN"
              rightAction={
                <TouchableOpacity
                  style={styles.generateBtn}
                  onPress={handleGeneratePin}
                >
                  <Ionicons color={Colors.accent} name="flash" size={18} />
                  <Text style={styles.generateBtnText}>Acak PIN</Text>
                </TouchableOpacity>
              }
              value={pin}
              onChangeText={(txt) => {
                setPin(txt);
                if (pinError) setPinError('');
              }}
            />
          )}

          {/* Category Picker */}
          <Text style={styles.categoryLabel}>Pilih Kategori (Opsional)</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryPill,
                    isSelected && styles.categoryPillActive,
                  ]}
                  onPress={() => setCategoryId(isSelected ? null : cat.id)}
                >
                  <Ionicons
                    color={isSelected ? Colors.accent : Colors.textSecondary}
                    name={(cat.icon as unknown as keyof typeof Ionicons.glyphMap) || 'grid-outline'}
                    size={16}
                  />
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Notes (Tinggi dan lega saat keyboard aktif) */}
          <VaultInput
            multiline
            label="Catatan Tambahan (Opsional)"
            numberOfLines={4}
            placeholder="Informasi pemulihan, pin, atau pertanyaan keamanan"
            style={{ height: 90, textAlignVertical: 'top' }}
            value={notes}
            onChangeText={setNotes}
          />

          <View style={styles.actionContainer}>
            <VaultButton
              loading={loading}
              title="Simpan Akun"
              variant="primary"
              onPress={handleSave}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 150, // Ruang lega agar note tidak tenggelam saat keyboard muncul
  },
  errorBanner: {
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
  errorBannerText: {
    flex: 1,
    color: Colors.error,
    fontSize: Typography.sizes.sm,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 4,
    marginLeft: Spacing.xs,
  },
  generateBtnText: {
    color: Colors.accent,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  strengthBox: {
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
  },
  strengthLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  authTypeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  authTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  authTypeTabActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.secondary,
  },
  authTypeText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  authTypeTextActive: {
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
  categoryLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  categoryPillActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.accent,
  },
  categoryPillText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  categoryPillTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
  actionContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});
