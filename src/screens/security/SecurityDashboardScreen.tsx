import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useVaultStore } from '../../store/vaultStore';
import { checkPasswordStrength } from '../../security/generator';
import { VaultCard } from '../../components/VaultCard';

export const SecurityDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const accounts = useVaultStore((s) => s.accounts);

  // Group accounts by strength & duplicate
  let weakAccounts = [];
  let mediumAccounts = [];
  let strongAccounts = [];

  const passwordUsageMap = new Map<string, string[]>();

  for (const acc of accounts) {
    const analysis = checkPasswordStrength(acc.password);
    if (analysis.level === 'Weak') {
      weakAccounts.push(acc);
    } else if (analysis.level === 'Medium') {
      mediumAccounts.push(acc);
    } else {
      strongAccounts.push(acc);
    }

    const currentList = passwordUsageMap.get(acc.password) ?? [];
    currentList.push(acc.id);
    passwordUsageMap.set(acc.password, currentList);
  }

  const duplicateAccounts = accounts.filter(
    (acc) => (passwordUsageMap.get(acc.password)?.length ?? 0) > 1
  );

  const securityScore = accounts.length > 0
    ? Math.round(
        ((strongAccounts.length * 100 + mediumAccounts.length * 50) /
          (accounts.length * 100)) *
          100 -
          (duplicateAccounts.length > 0 ? 15 : 0)
      )
    : 100;

  const boundedScore = Math.max(0, Math.min(100, securityScore));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Security Dashboard</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Overall Security Score Card */}
        <VaultCard style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{boundedScore}%</Text>
            <Text style={styles.scoreLabel}>Skor Keamanan</Text>
          </View>
          <Text style={styles.scoreStatus}>
            {boundedScore >= 80
              ? 'Keamanan Brankas Sangat Baik'
              : boundedScore >= 50
              ? 'Perlu Beberapa Peningkatan'
              : 'Perhatian: Ada Kerentanan'}
          </Text>
        </VaultCard>

        {/* Breakdown Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons color={Colors.error} name="alert-circle" size={24} />
            <Text style={styles.statCount}>{weakAccounts.length}</Text>
            <Text style={styles.statLabel}>Password Lemah</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons color={Colors.warning} name="copy" size={24} />
            <Text style={styles.statCount}>{duplicateAccounts.length}</Text>
            <Text style={styles.statLabel}>Password Duplikat</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons color={Colors.warning} name="shield-half" size={24} />
            <Text style={styles.statCount}>{mediumAccounts.length}</Text>
            <Text style={styles.statLabel}>Sedang</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons color={Colors.success} name="shield-checkmark" size={24} />
            <Text style={styles.statCount}>{strongAccounts.length}</Text>
            <Text style={styles.statLabel}>Kuat / Sangat Kuat</Text>
          </View>
        </View>

        {/* Recommendations */}
        <Text style={styles.sectionTitle}>Rekomendasi Keamanan</Text>
        <VaultCard>
          <View style={styles.recItem}>
            <Ionicons color={Colors.accent} name="key-outline" size={20} />
            <Text style={styles.recText}>
              Ganti password yang lemah menjadi minimal 16 karakter dengan kombinasi acak.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.recItem}>
            <Ionicons color={Colors.warning} name="git-branch-outline" size={20} />
            <Text style={styles.recText}>
              Hindari memakai password yang sama di lebih dari satu layanan digital.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.recItem}>
            <Ionicons color={Colors.success} name="refresh-circle-outline" size={20} />
            <Text style={styles.recText}>
              Periksa dan perbarui akun penting Anda secara berkala untuk menjaga keamanan.
            </Text>
          </View>
        </VaultCard>

        {/* Accounts Requiring Review */}
        {weakAccounts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Akun Memerlukan Perhatian Segera</Text>
            {weakAccounts.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                activeOpacity={0.7}
                style={styles.reviewItem}
                onPress={() => navigation.navigate('AccountDetail', { accountId: acc.id })}
              >
                <View style={styles.reviewIconCircle}>
                  <Ionicons color={Colors.error} name="warning" size={20} />
                </View>
                <View style={styles.reviewContent}>
                  <Text style={styles.reviewTitle}>{acc.accountName}</Text>
                  <Text style={styles.reviewSubtitle}>
                    {acc.username || acc.email || 'Tanpa username'}
                  </Text>
                </View>
                <Ionicons color={Colors.textSecondary} name="chevron-forward" size={18} />
              </TouchableOpacity>
            ))}
          </>
        )}
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  scoreCircle: {
    width: 110,
    height: 110,
    borderRadius: BorderRadius.full,
    borderWidth: 4,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  scoreNumber: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  scoreLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  scoreStatus: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statCount: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.xs,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  recText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  reviewIconCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(228, 91, 99, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  reviewContent: {
    flex: 1,
  },
  reviewTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  reviewSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
});
