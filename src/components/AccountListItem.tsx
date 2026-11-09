import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DecryptedAccount, DecryptedCategory } from '../types';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { copyToClipboardWithAutoClear } from '../services/clipboardService';

interface AccountListItemProps {
  account: DecryptedAccount;
  category?: DecryptedCategory;
  onPress: () => void;
  onToggleFavorite: () => void;
  onCopiedToast?: (message: string) => void;
}

export const AccountListItem: React.FC<AccountListItemProps> = ({
  account,
  category,
  onPress,
  onToggleFavorite,
  onCopiedToast,
}) => {
  const handleCopyPassword = async (e: unknown) => {
    // Prevent opening account detail when tapping copy icon
    await copyToClipboardWithAutoClear(account.password, 30);
    onCopiedToast?.('Password disalin! Otomatis dibersihkan dalam 30 detik.');
  };

  const subtitle = account.username || account.email || 'Tanpa username/email';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.container}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          color={Colors.accent}
          name={(category?.icon as unknown as keyof typeof Ionicons.glyphMap) || 'key-outline'}
          size={22}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.accountName}>
            {account.accountName}
          </Text>
          {category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{category.name}</Text>
            </View>
          )}
        </View>
        <Text numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.actionButton}
          onPress={handleCopyPassword}
        >
          <Ionicons color={Colors.textSecondary} name="copy-outline" size={18} />
        </TouchableOpacity>

        <TouchableOpacity
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.actionButton}
          onPress={onToggleFavorite}
        >
          <Ionicons
            color={account.isFavorite ? Colors.warning : Colors.textMuted}
            name={account.isFavorite ? 'star' : 'star-outline'}
            size={20}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  accountName: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    flexShrink: 1,
  },
  categoryBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  categoryText: {
    color: Colors.accent,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.xs,
  },
});
