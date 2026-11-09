import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DecryptedAccount, DecryptedCategory } from '../types';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { copyToClipboardWithAutoClear } from '../services/clipboardService';

interface AccountListItemProps {
  account: DecryptedAccount;
  category?: DecryptedCategory;
  clipboardTimeout?: number;
  onPress: () => void;
  onToggleFavorite: () => void;
  onCopiedToast?: (message: string) => void;
}

export const AccountListItem: React.FC<AccountListItemProps> = ({
  account,
  category,
  clipboardTimeout = 30,
  onPress,
  onToggleFavorite,
  onCopiedToast,
}) => {
  const isPin = account.authType === 'pin';
  const secretToCopy = isPin ? (account.pin || account.password || '') : (account.password || '');

  const handleCopySecret = async () => {
    await copyToClipboardWithAutoClear(secretToCopy, clipboardTimeout);
    onCopiedToast?.(`${isPin ? 'PIN' : 'Password'} disalin! Dibersihkan dlm ${clipboardTimeout}d`);
  };

  const subtitle = account.username || account.email || 'Tanpa username/email';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.touchableArea}
        onPress={onPress}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            color={Colors.accent}
            name={
              (category?.icon as unknown as keyof typeof Ionicons.glyphMap) ||
              (isPin ? 'keypad-outline' : 'key-outline')
            }
            size={22}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.accountName}>
              {account.accountName}
            </Text>
            {isPin && (
              <View style={styles.pinBadge}>
                <Text style={styles.pinBadgeText}>PIN</Text>
              </View>
            )}
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
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
          style={styles.actionButton}
          onPress={handleCopySecret}
        >
          <Ionicons color={Colors.textSecondary} name="copy-outline" size={18} />
        </TouchableOpacity>

        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  touchableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
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
  pinBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pinBadgeText: {
    color: Colors.accent,
    fontSize: 9,
    fontWeight: Typography.weights.bold,
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
