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
import { useVaultStore } from '../../store/vaultStore';
import { copyToClipboardWithAutoClear } from '../../services/clipboardService';
import { checkPasswordStrength } from '../../security/generator';
import { VaultCard } from '../../components/VaultCard';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountDetail'>;

export const AccountDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { accountId } = route.params;

  const account = useVaultStore((s) => s.accounts.find((a) => a.id === accountId));
  const categories = useVaultStore((s) => s.categories);
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);
  const deleteAccount = useVaultStore((s) => s.deleteAccount);

  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!account) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons color={Colors.textPrimary} name="arrow-back" size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundText}>Akun tidak ditemukan atau telah dihapus.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const category = categories.find((c) => c.id === account.categoryId);
  const strength = checkPasswordStrength(account.password);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = async (text: string, label: string) => {
    await copyToClipboardWithAutoClear(text, 30);
    showToast(`${label} disalin! (Otomatis dibersihkan dlm 30d)`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Hapus Akun',
      `Apakah Anda yakin ingin menghapus akun "${account.accountName}"? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount(account.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons color={Colors.textPrimary} name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {account.accountName}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => toggleFavorite(account.id)}
          >
            <Ionicons
              color={account.isFavorite ? Colors.warning : Colors.textSecondary}
              name={account.isFavorite ? 'star' : 'star-outline'}
              size={22}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('EditAccount', { accountId: account.id })}
          >
            <Ionicons color={Colors.accent} name="create-outline" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Header Badge */}
        <View style={styles.profileBox}>
          <View style={styles.largeIconCircle}>
            <Ionicons
              color={Colors.accent}
              name={(category?.icon as unknown as keyof typeof Ionicons.glyphMap) || 'key'}
              size={36}
            />
          </View>
          <Text style={styles.profileTitle}>{account.accountName}</Text>
          {category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{category.name}</Text>
            </View>
          )}
        </View>

        {/* Username / ID */}
        {account.username && (
          <VaultCard>
            <Text style={styles.fieldLabel}>Username / ID</Text>
            <View style={styles.fieldRow}>
              <Text selectable style={styles.fieldValue}>
                {account.username}
              </Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => handleCopy(account.username!, 'Username')}
              >
                <Ionicons color={Colors.accent} name="copy-outline" size={20} />
              </TouchableOpacity>
            </View>
          </VaultCard>
        )}

        {/* Email */}
        {account.email && (
          <VaultCard>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.fieldRow}>
              <Text selectable style={styles.fieldValue}>
                {account.email}
              </Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => handleCopy(account.email!, 'Email')}
              >
                <Ionicons color={Colors.accent} name="copy-outline" size={20} />
              </TouchableOpacity>
            </View>
          </VaultCard>
        )}

        {/* Password */}
        <VaultCard>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldValue, !showPassword && styles.passwordMasked]}>
              {showPassword ? account.password : '••••••••••••••••'}
            </Text>
            <View style={styles.passwordActions}>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  color={Colors.textSecondary}
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => handleCopy(account.password, 'Password')}
              >
                <Ionicons color={Colors.accent} name="copy-outline" size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Strength info */}
          <View style={styles.strengthRow}>
            <Text style={styles.strengthLabel}>Kekuatan: </Text>
            <Text
              style={{
                color:
                  strength.level === 'Very Strong' || strength.level === 'Strong'
                    ? Colors.success
                    : strength.level === 'Medium'
                    ? Colors.warning
                    : Colors.error,
                fontWeight: Typography.weights.semibold,
                fontSize: Typography.sizes.xs,
              }}
            >
              {strength.level}
            </Text>
          </View>
        </VaultCard>

        {/* Notes */}
        {account.notes && (
          <VaultCard>
            <Text style={styles.fieldLabel}>Catatan Tambahan</Text>
            <Text selectable style={styles.notesText}>
              {account.notes}
            </Text>
          </VaultCard>
        )}

        {/* Metadata info */}
        <View style={styles.metaBox}>
          <Text style={styles.metaText}>
            Dibuat: {new Date(account.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.metaText}>
            Diperbarui: {new Date(account.updatedAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Delete Action */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons color={Colors.error} name="trash-outline" size={20} />
          <Text style={styles.deleteText}>Hapus Akun Ini</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toast}>
          <Ionicons color={Colors.success} name="checkmark-circle" size={18} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
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
  headerBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    maxWidth: 200,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  profileBox: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  largeIconCircle: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  profileTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  categoryBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  categoryBadgeText: {
    color: Colors.accent,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    marginBottom: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldValue: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    flex: 1,
  },
  passwordMasked: {
    letterSpacing: 3,
    fontSize: Typography.sizes.lg,
  },
  passwordActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  copyBtn: {
    padding: Spacing.xs,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  strengthLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  notesText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
  metaBox: {
    alignItems: 'center',
    marginVertical: Spacing.md,
    gap: 4,
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(228, 91, 99, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  deleteText: {
    color: Colors.error,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    color: Colors.textSecondary,
  },
  toast: {
    position: 'absolute',
    bottom: Spacing.xl,
    alignSelf: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  toastText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
});
