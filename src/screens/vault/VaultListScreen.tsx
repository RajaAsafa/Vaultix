import React, { useState } from 'react';
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
import { VaultInput } from '../../components/VaultInput';
import { AccountListItem } from '../../components/AccountListItem';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'VaultTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const VaultListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const accounts = useVaultStore((s) => s.accounts);
  const categories = useVaultStore((s) => s.categories);
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

      {/* Search Input */}
      <View style={styles.searchContainer}>
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
        data={filteredAccounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const category = categories.find((c) => c.id === item.categoryId);
          return (
            <AccountListItem
              account={item}
              category={category}
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
