import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { VaultButton } from '../../components/VaultButton';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons color={Colors.accent} name="shield-checkmark" size={64} />
        </View>

        <Text style={styles.title}>VAULTIX</Text>
        <Text style={styles.tagline}>Your Digital Safe.</Text>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons color={Colors.success} name="lock-closed" size={24} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Enkripsi Tingkat Militer</Text>
              <Text style={styles.featureDesc}>
                Dilindungi AES-256-GCM dan KDF Argon2id langsung di perangkat Anda.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons color={Colors.accent} name="cloud-offline" size={24} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>100% Offline & Local-First</Text>
              <Text style={styles.featureDesc}>
                Tidak ada server eksternal atau database cloud. Data Anda tetap milik Anda.
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons color={Colors.warning} name="finger-print" size={24} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Biometrik & Keystore</Text>
              <Text style={styles.featureDesc}>
                Buka brankas secara instan dan aman dengan sidik jari atau pengenalan wajah.
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <VaultButton
          title="Mulai Buat Vault"
          variant="primary"
          onPress={() => navigation.navigate('SetupMasterPassword')}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.display,
    fontWeight: Typography.weights.bold,
    letterSpacing: 2,
  },
  tagline: {
    color: Colors.accent,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xl,
  },
  features: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  featureDesc: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    marginTop: 2,
    lineHeight: 18,
  },
  footer: {
    paddingVertical: Spacing.lg,
  },
});
