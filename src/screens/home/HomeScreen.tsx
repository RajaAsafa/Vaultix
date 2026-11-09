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
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../../types';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useVaultStore } from '../../store/vaultStore';
import { checkPasswordStrength } from '../../security/generator';
import { AccountListItem } from '../../components/AccountListItem';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const accounts = useVaultStore((s) => s.accounts);
  const categories = useVaultStore((s) => s.categories);
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);

  // Calculate statistics
  const totalAccounts = accounts.length;
  const totalCategories = categories.length;
  const favoriteAccounts = accounts.filter((a) => a.isFavorite);

  // Audit passwords for weak and duplicates
  let weakCount = 0;
  const passwordMap = new Map<string, number>();

  for (const acc of accounts) {
    const strength = checkPasswordStrength(acc.password);
    if (strength.level === 'Weak') {
      weakCount++;
    }
    passwordMap.set(acc.password, (passwordMap.get(acc.password) ?? 0) + 1);
  }

  let duplicateCount = 0;
  for (const count of passwordMap.values()) {
    if (count > 1) {
      duplicateCount += count;
    }
  }

  const recentAccounts = accounts.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>VAULTIX</Text>
            <Text style={styles.subtitle}>Ringkasan Brankas Digital</Text>
          </View>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => navigation.navigate('AddAccount')}
          >
            <Ionicons color={Colors.textPrimary} name="add" size={24} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.statCard}
            onPress={() => navigation.navigate('VaultTab')}
          >
            <Ionicons color={Colors.accent} name="key" size={24} />
            <Text style={styles.statNumber}>{totalAccounts}</Text>
            <Text style={styles.statLabel}>Total Akun</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.statCard}
            onPress={() => navigation.navigate('VaultTab')}
          >
            <Ionicons color={Colors.warning} name="star" size={24} />
            <Text style={styles.statNumber}>{favoriteAccounts.length}</Text>
            <Text style={styles.statLabel}>Favorit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.statCard}
            onPress={() => navigation.navigate('SecurityTab')}
          >
            <Ionicons color={Colors.error} name="warning" size={24} />
            <Text style={styles.statNumber}>{weakCount}</Text>
            <Text style={styles.statLabel}>Password Lemah</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.statCard}
            onPress={() => navigation.navigate('SecurityTab')}
          >
            <Ionicons color={Colors.warning} name="copy" size={24} />
            <Text style={styles.statNumber}>{duplicateCount}</Text>
            <Text style={styles.statLabel}>Duplikat</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Aksi Cepat</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => navigation.navigate('AddAccount')}
          >
            <Ionicons color={Colors.accent} name="add-circle-outline" size={20} />
            <Text style={styles.actionPillText}>Tambah Akun</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => navigation.navigate('GeneratorTab')}
          >
            <Ionicons color={Colors.accent} name="flash-outline" size={20} />
            <Text style={styles.actionPillText}>Generator</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionPill}
            onPress={() => navigation.navigate('SecurityTab')}
          >
            <Ionicons color={Colors.accent} name="shield-checkmark-outline" size={20} />
            <Text style={styles.actionPillText}>Audit Keamanan</Text>
          </TouchableOpacity>
        </View>

        {/* Recently Added Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Akun Terakhir Ditambahkan</Text>
          {accounts.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('VaultTab')}>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentAccounts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons color={Colors.textMuted} name="file-tray-outline" size={48} />
            <Text style={styles.emptyTitle}>Belum Ada Akun</Text>
            <Text style={styles.emptySubtitle}>
              Mulai amankan akun Anda dengan mengetuk tombol Tambah Akun.
            </Text>
          </View>
        ) : (
          recentAccounts.map((account) => {
            const category = categories.find((c) => c.id === account.categoryId);
            return (
              <AccountListItem
                key={account.id}
                account={account}
                category={category}
                onPress={() => navigation.navigate('AccountDetail', { accountId: account.id })}
                onToggleFavorite={() => toggleFavorite(account.id)}
              />
            );
          })
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
  scrollContent: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  appTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    marginTop: Spacing.sm,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  seeAllText: {
    color: Colors.accent,
    fontSize: Typography.sizes.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  actionPillText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
