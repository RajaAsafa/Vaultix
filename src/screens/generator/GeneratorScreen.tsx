import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import {
  generatePassword,
  checkPasswordStrength,
  GeneratorOptions,
  DEFAULT_GENERATOR_OPTIONS,
} from '../../security/generator';
import { copyToClipboardWithAutoClear } from '../../services/clipboardService';
import { VaultCard } from '../../components/VaultCard';
import { VaultButton } from '../../components/VaultButton';

export const GeneratorScreen: React.FC = () => {
  const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_GENERATOR_OPTIONS);
  const [password, setPassword] = useState(() => generatePassword(DEFAULT_GENERATOR_OPTIONS));
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const strength = checkPasswordStrength(password);

  const handleRegenerate = () => {
    const next = generatePassword(options);
    setPassword(next);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = async () => {
    await copyToClipboardWithAutoClear(password, 30);
    showToast('Password disalin! (Otomatis dibersihkan dlm 30d)');
  };

  const adjustLength = (delta: number) => {
    const nextLen = Math.max(8, Math.min(64, options.length + delta));
    const nextOpts = { ...options, length: nextLen };
    setOptions(nextOpts);
    setPassword(generatePassword(nextOpts));
  };

  const toggleOption = (key: keyof Omit<GeneratorOptions, 'length'>) => {
    const nextOpts = { ...options, [key]: !options[key] };
    setOptions(nextOpts);
    setPassword(generatePassword(nextOpts));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Password Generator</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Output Box */}
        <VaultCard style={styles.outputCard}>
          <Text selectable numberOfLines={3} style={styles.passwordText}>
            {password}
          </Text>

          <View style={styles.outputActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleRegenerate}>
              <Ionicons color={Colors.accent} name="refresh" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleCopy}>
              <Ionicons color={Colors.accent} name="copy-outline" size={24} />
            </TouchableOpacity>
          </View>

          {/* Strength Indicator */}
          <View style={styles.strengthRow}>
            <View style={styles.strengthBarBg}>
              <View
                style={[
                  styles.strengthBarFill,
                  {
                    width: `${(strength.score / 4) * 100}%`,
                    backgroundColor:
                      strength.level === 'Very Strong' || strength.level === 'Strong'
                        ? Colors.success
                        : strength.level === 'Medium'
                        ? Colors.warning
                        : Colors.error,
                  },
                ]}
              />
            </View>
            <Text style={styles.strengthLabel}>{strength.level}</Text>
          </View>
        </VaultCard>

        {/* Length Control */}
        <VaultCard>
          <View style={styles.optionRow}>
            <View>
              <Text style={styles.optionTitle}>Panjang Password</Text>
              <Text style={styles.optionSubtitle}>{options.length} Karakter</Text>
            </View>
            <View style={styles.lengthStepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustLength(-1)}
              >
                <Ionicons color={Colors.textPrimary} name="remove" size={20} />
              </TouchableOpacity>
              <Text style={styles.lengthValue}>{options.length}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => adjustLength(1)}
              >
                <Ionicons color={Colors.textPrimary} name="add" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </VaultCard>

        {/* Options */}
        <VaultCard>
          <View style={styles.optionRow}>
            <Text style={styles.optionTitle}>Huruf Besar (A-Z)</Text>
            <Switch
              thumbColor={options.includeUppercase ? Colors.accent : Colors.textMuted}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              value={options.includeUppercase}
              onValueChange={() => toggleOption('includeUppercase')}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.optionRow}>
            <Text style={styles.optionTitle}>Huruf Kecil (a-z)</Text>
            <Switch
              thumbColor={options.includeLowercase ? Colors.accent : Colors.textMuted}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              value={options.includeLowercase}
              onValueChange={() => toggleOption('includeLowercase')}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.optionRow}>
            <Text style={styles.optionTitle}>Angka (0-9)</Text>
            <Switch
              thumbColor={options.includeNumbers ? Colors.accent : Colors.textMuted}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              value={options.includeNumbers}
              onValueChange={() => toggleOption('includeNumbers')}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.optionRow}>
            <Text style={styles.optionTitle}>Simbol Khusus (!@#$...)</Text>
            <Switch
              thumbColor={options.includeSymbols ? Colors.accent : Colors.textMuted}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              value={options.includeSymbols}
              onValueChange={() => toggleOption('includeSymbols')}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.optionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>Hindari Karakter Ambigu</Text>
              <Text style={styles.optionSubtitle}>Kecualikan O, 0, I, l, 1, |, B, 8</Text>
            </View>
            <Switch
              thumbColor={options.excludeAmbiguous ? Colors.accent : Colors.textMuted}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              value={options.excludeAmbiguous}
              onValueChange={() => toggleOption('excludeAmbiguous')}
            />
          </View>
        </VaultCard>

        <VaultButton
          icon={<Ionicons color={Colors.textPrimary} name="copy-outline" size={20} />}
          style={{ marginTop: Spacing.sm }}
          title="Salin Password"
          variant="primary"
          onPress={handleCopy}
        />
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
  outputCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  passwordText: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.sm,
  },
  outputActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  strengthBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  strengthLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  optionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  optionSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  lengthStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
  },
  stepBtn: {
    padding: Spacing.sm,
  },
  lengthValue: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    minWidth: 32,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
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
