import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList, RootStackParamList } from '../../types';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useVaultStore } from '../../store/vaultStore';
import { SettingsRepository } from '../../database/repositories/SettingsRepository';
import { checkPasswordStrength } from '../../security/generator';
import { VaultInput } from '../../components/VaultInput';
import { AccountListItem } from '../../components/AccountListItem';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'VaultTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type SortMode = 'newest' | 'az' | 'za' | 'weakest';

export const VaultListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const accounts = useVaultStore((s) => s.accounts);
  const categories = useVaultStore((s) => s.categories);
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [showSortBar, setShowSortBar] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [clipboardTimeout, setClipboardTimeout] = useState(30);

  useEffect(() => {
    SettingsRepository.getSettings()
      .then((s) => setClipboardTimeout(s.clipboard_timeout))
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // In-memory search & filter
  const filteredAccounts = accounts.filter((account) => {
    // Favorites filter
    if (favoritesOnly && !account.isFavorite) {
      return false;
    }

    // Category filter
    if (selectedCategory && account.categoryId !== selectedCategory) {
      return false;
    }

    // Text search filter (Account Name, Username, Email) - NO URL!
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchName = account.accountName.toLowerCase().includes(q);
      const matchUsername = account.username?.toLowerCase().includes(q) ?? false;
      const matchEmail = account.email?.toLowerCase().includes(q) ?? false;

      return matchName || matchUsername || matchEmail;
    }

    return true;
  });

  // Dynamic In-Memory Sorting
  const sortedAccounts = useMemo(() => {
    return [...filteredAccounts].sort((a, b) => {
      switch (sortMode) {
        case 'az':
          return a.accountName.localeCompare(b.accountName);
        case 'za':
          return b.accountName.localeCompare(a.accountName);
        case 'weakest': {
          const scoreA = checkPasswordStrength(a.password).score;
          const scoreB = checkPasswordStrength(b.password).score;
          return scoreA - scoreB;
        }
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [filteredAccounts, sortMode]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Vault</Text>
        <TouchableOpacity
          style={styles.addIconBtn}
          onPress={() => navigation.navigate('AddAccount')}
        >
          <Ionicons color={Colors.textPrimary} name="add" size={24} />
        </TouchableOpacity>
      </View>

      {/* Search Input & Sort Button */}
      <View style={styles.searchRow}>
        <View style={{ flex: 1 }}>
          <VaultInput
            placeholder="Cari nama akun, username, email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftAction={
              <Ionicons color={Colors.textMuted} name="search-outline" size={20} />
            }
            rightAction={
              searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons color={Colors.textSecondary} name="close-circle" size={18} />
                </TouchableOpacity>
              ) : null
            }
          />
        </View>

        <TouchableOpacity
          style={[styles.sortToggleBtn, showSortBar && styles.sortToggleBtnActive]}
          onPress={() => setShowSortBar(!showSortBar)}
        >
          <Ionicons
            color={showSortBar ? Colors.accent : Colors.textSecondary}
            name="swap-vertical"
            size={20}
          />
        </TouchableOpacity>
      </View>

      {/* Quick Sort Bar */}
      {showSortBar && (
        <View style={styles.sortBar}>
          <Text style={styles.sortBarLabel}>Urutkan:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(
              [
                { id: 'newest', label: 'Terbaru' },
                { id: 'az', label: 'Abjad A-Z' },
                { id: 'za', label: 'Abjad Z-A' },
                { id: 'weakest', label: 'Password Terlemah' },
              ] as const
            ).map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.sortPill, sortMode === s.id && styles.sortPillActive]}
                onPress={() => setSortMode(s.id)}
              >
                <Text
                  style={[styles.sortPillText, sortMode === s.id && styles.sortPillTextActive]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Category & Filter Pills */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.filterScroll}
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[
              styles.filterPill,
              favoritesOnly && styles.filterPillActive,
            ]}
            onPress={() => setFavoritesOnly(!favoritesOnly)}
          >
            <Ionicons
              color={favoritesOnly ? Colors.warning : Colors.textSecondary}
              name={favoritesOnly ? 'star' : 'star-outline'}
              size={14}
            />
            <Text
              style={[
                styles.filterText,
                favoritesOnly && styles.filterTextActive,
              ]}
            >
              Favorit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterPill,
              selectedCategory === null && !favoritesOnly && styles.filterPillActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === null && !favoritesOnly && styles.filterTextActive,
              ]}
            >
              Semua
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.filterPill,
                selectedCategory === cat.id && styles.filterPillActive,
              ]}
              onPress={() =>
                setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
              }
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === cat.id && styles.filterTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Accounts List */}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={sortedAccounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const category = categories.find((c) => c.id === item.categoryId);
          return (
            <AccountListItem
              account={item}
              category={category}
              clipboardTimeout={clipboardTimeout}
              onCopiedToast={showToast}
              onPress={() => navigation.navigate('AccountDetail', { accountId: item.id })}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons color={Colors.textMuted} name="search-outline" size={48} />
            <Text style={styles.emptyText}>Tidak ada akun yang cocok</Text>
          </View>
        }
      />

      {/* Temporary Toast feedback */}
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
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  addIconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  sortToggleBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  sortToggleBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.secondary,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sortBarLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    marginRight: 4,
  },
  sortPill: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  sortPillActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.accent,
  },
  sortPillText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
  },
  sortPillTextActive: {
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
  },
  filterRow: {
    marginBottom: Spacing.sm,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  filterPillActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.accent,
  },
  filterText: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  filterTextActive: {
    color: Colors.textPrimary,
    fontWeight: Typography.weights.semibold,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.sm,
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
