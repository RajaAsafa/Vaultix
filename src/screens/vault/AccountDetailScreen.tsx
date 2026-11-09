import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, DecryptedPasswordHistory } from '../../types';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useVaultStore } from '../../store/vaultStore';
import { SettingsRepository } from '../../database/repositories/SettingsRepository';
import { copyToClipboardWithAutoClear } from '../../services/clipboardService';
import { checkPasswordStrength } from '../../security/generator';
import { VaultCard } from '../../components/VaultCard';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountDetail'>;

export const AccountDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { accountId } = route.params;

  const currentAccount = useVaultStore((s) => s.accounts.find((a) => a.id === accountId));
  const categories = useVaultStore((s) => s.categories);
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);
  const deleteAccount = useVaultStore((s) => s.deleteAccount);
  const getPasswordHistory = useVaultStore((s) => s.getPasswordHistory);
  const vek = useAuthStore((s) => s.vek);

  // Retain account snapshot during delete transition
  const cachedAccountRef = useRef(currentAccount);
  if (currentAccount) {
    cachedAccountRef.current = currentAccount;
  }
  const account = currentAccount ?? cachedAccountRef.current;

  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [historyList, setHistoryList] = useState<DecryptedPasswordHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [revealedHistories, setRevealedHistories] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [clipboardTimeout, setClipboardTimeout] = useState(30);

  useEffect(() => {
    SettingsRepository.getSettings()
      .then((s) => setClipboardTimeout(s.clipboard_timeout))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (account?.id && vek) {
      getPasswordHistory(account.id, vek)
        .then(setHistoryList)
        .catch(() => {});
    }
  }, [account?.id, account?.updatedAt, vek, getPasswordHistory]);

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
  const strength = checkPasswordStrength(account.password || '');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = async (text: string, label: string) => {
    await copyToClipboardWithAutoClear(text, clipboardTimeout);
    showToast(`${label} disalin! (Dibersihkan dlm ${clipboardTimeout}d)`);
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
            navigation.goBack();
            setTimeout(async () => {
              await deleteAccount(account.id);
            }, 100);
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

        {/* Credential Card: Password OR PIN */}
        {account.authType === 'pin' ? (
          <VaultCard>
            <Text style={styles.fieldLabel}>PIN KEAMANAN</Text>
            <View style={styles.fieldRow}>
              <Text style={[styles.fieldValue, !showPassword && styles.passwordMasked]}>
                {showPassword ? (account.pin || account.password) : '••••••••'}
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
                  onPress={() => handleCopy(account.pin || account.password || '', 'PIN')}
                >
                  <Ionicons color={Colors.accent} name="copy-outline" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          </VaultCard>
        ) : (
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
                  onPress={() => handleCopy(account.password || '', 'Password')}
                >
                  <Ionicons color={Colors.accent} name="copy-outline" size={20} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Strength info */}
            {account.password ? (
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
            ) : null}
          </VaultCard>
        )}

        {/* Password History Section */}
        {historyList.length > 0 && (
          <View style={styles.historySection}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.historyToggleHeader}
              onPress={() => setShowHistory(!showHistory)}
            >
              <View style={styles.historyTitleRow}>
                <Ionicons color={Colors.textSecondary} name="time-outline" size={18} />
                <Text style={styles.historyTitle}>
                  {account.authType === 'pin' ? 'Riwayat PIN Lama' : 'Riwayat Password Lama'} ({historyList.length})
                </Text>
              </View>
              <Ionicons
                color={Colors.textSecondary}
                name={showHistory ? 'chevron-up' : 'chevron-down'}
                size={18}
              />
            </TouchableOpacity>

            {showHistory && (
              <VaultCard style={styles.historyCard}>
                {historyList.map((hist, idx) => {
                  const isRevealed = !!revealedHistories[hist.id];
                  const dateStr = new Date(hist.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  return (
                    <View
                      key={hist.id}
                      style={[styles.historyRow, idx > 0 && styles.historyRowBorder]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyDate}>Diganti: {dateStr}</Text>
                        <Text style={[styles.historyPassword, !isRevealed && styles.passwordMasked]}>
                          {isRevealed ? hist.password : '••••••••••••'}
                        </Text>
                      </View>
                      <View style={styles.historyActions}>
                        <TouchableOpacity
                          style={styles.copyBtn}
                          onPress={() =>
                            setRevealedHistories((prev) => ({
                              ...prev,
                              [hist.id]: !prev[hist.id],
                            }))
                          }
                        >
                          <Ionicons
                            color={Colors.textSecondary}
                            name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.copyBtn}
                          onPress={() => handleCopy(hist.password, 'Password lama')}
                        >
                          <Ionicons color={Colors.accent} name="copy-outline" size={18} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </VaultCard>
            )}
          </View>
        )}

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
  historySection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  historyToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  historyTitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyCard: {
    marginTop: Spacing.xs,
    padding: Spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  historyRowBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  historyDate: {
    color: Colors.textMuted,
    fontSize: 10,
    marginBottom: 2,
  },
  historyPassword: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.sm,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
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
