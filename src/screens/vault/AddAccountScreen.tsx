import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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
import { generatePassword, checkPasswordStrength } from '../../security/generator';

type Props = NativeStackScreenProps<RootStackParamList, 'AddAccount'>;

export const AddAccountScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialCategoryId = route.params?.categoryId;

  const [accountName, setAccountName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId ?? null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

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
  };

  const handleSave = async () => {
    if (!accountName.trim()) {
      Alert.alert('Perhatian', 'Nama Akun wajib diisi.');
      return;
    }
    if (!password) {
      Alert.alert('Perhatian', 'Password wajib diisi.');
      return;
    }
    if (!vek) {
      Alert.alert('Error', 'Sesi enkripsi tidak valid. Silakan buka kunci kembali.');
      return;
    }

    try {
      setLoading(true);
      await addAccount(
        {
          accountName: accountName.trim(),
          username: username.trim() || undefined,
          email: email.trim() || undefined,
          password,
          categoryId,
          notes: notes.trim() || undefined,
        },
        vek
      );
      navigation.goBack();
    } catch (err: unknown) {
      Alert.alert('Gagal', err instanceof Error ? err.message : 'Gagal menyimpan akun');
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Name */}
        <VaultInput
          label="Nama Layanan / Akun *"
          placeholder="contoh: Google, Steam, Discord"
          value={accountName}
          onChangeText={setAccountName}
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
          keyboardType="email-address"
          label="Email (Opsional)"
          placeholder="contoh: user@mail.com"
          value={email}
          onChangeText={setEmail}
        />

        {/* Password */}
        <VaultInput
          isPassword
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
          onChangeText={setPassword}
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

        {/* Notes */}
        <VaultInput
          multiline
          label="Catatan Tambahan (Opsional)"
          numberOfLines={3}
          placeholder="Informasi pemulihan, pin, atau pertanyaan keamanan"
          style={{ height: 80, textAlignVertical: 'top' }}
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
