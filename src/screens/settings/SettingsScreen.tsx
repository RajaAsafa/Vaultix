import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useVaultStore } from '../../store/vaultStore';
import { SettingsRepository } from '../../database/repositories/SettingsRepository';
import { enableBiometricUnlock, disableBiometricUnlock } from '../../security/keyManager';
import { VaultCard } from '../../components/VaultCard';

export const SettingsScreen: React.FC = () => {
  const vek = useAuthStore((s) => s.vek);
  const lockVault = useAuthStore((s) => s.lockVault);
  const clearMemory = useVaultStore((s) => s.clearMemory);

  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLockDuration, setAutoLockDuration] = useState(60);
  const [clipboardTimeout, setClipboardTimeout] = useState(30);

  useEffect(() => {
    (async () => {
      const settings = await SettingsRepository.getSettings();
      setBiometricEnabled(settings.biometric_enabled === 1);
      setAutoLockDuration(settings.auto_lock_duration);
      setClipboardTimeout(settings.clipboard_timeout);
    })();
  }, []);

  const handleToggleBiometric = async (value: boolean) => {
    if (value) {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        Alert.alert(
          'Tidak Didukung',
          'Perangkat Anda belum mengonfigurasi sidik jari atau biometrik.'
        );
        return;
      }

      if (!vek) {
        Alert.alert('Error', 'Vault harus dalam keadaan terbuka untuk mengaktifkan biometrik.');
        return;
      }

      try {
        const auth = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Konfirmasi biometrik untuk Vaultix',
        });

        if (auth.success) {
          await enableBiometricUnlock(vek);
          await SettingsRepository.updateSettings({ biometric_enabled: 1 });
          setBiometricEnabled(true);
        }
      } catch (err: unknown) {
        Alert.alert('Gagal', 'Gagal mengaktifkan biometrik: ' + (err instanceof Error ? err.message : ''));
      }
    } else {
      await disableBiometricUnlock();
      await SettingsRepository.updateSettings({ biometric_enabled: 0 });
      setBiometricEnabled(false);
    }
  };

  const handleSelectAutoLock = () => {
    Alert.alert(
      'Durasi Auto Lock',
      'Pilih batas waktu penguncian otomatis:',
      [
        { text: 'Segera', onPress: () => updateAutoLock(0) },
        { text: '30 Detik', onPress: () => updateAutoLock(30) },
        { text: '1 Menit', onPress: () => updateAutoLock(60) },
        { text: '5 Menit', onPress: () => updateAutoLock(300) },
        { text: '10 Menit', onPress: () => updateAutoLock(600) },
        { text: 'Batal', style: 'cancel' },
      ]
    );
  };

  const updateAutoLock = async (sec: number) => {
    setAutoLockDuration(sec);
    await SettingsRepository.updateSettings({ auto_lock_duration: sec });
  };

  const handleManualLock = () => {
    clearMemory();
    lockVault();
  };

  const formatAutoLock = (sec: number) => {
    if (sec === 0) return 'Segera saat keluar';
    if (sec < 60) return `${sec} Detik`;
    return `${sec / 60} Menit`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pengaturan</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Security Section */}
        <Text style={styles.sectionTitle}>Keamanan</Text>
        <VaultCard>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingName}>Buka dengan Biometrik</Text>
              <Text style={styles.settingDesc}>Gunakan sidik jari atau wajah</Text>
            </View>
            <Switch
              thumbColor={biometricEnabled ? Colors.accent : Colors.textMuted}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} onPress={handleSelectAutoLock}>
            <View style={styles.settingText}>
              <Text style={styles.settingName}>Auto Lock</Text>
              <Text style={styles.settingDesc}>Kunci otomatis setelah tidak aktif</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.valueText}>{formatAutoLock(autoLockDuration)}</Text>
              <Ionicons color={Colors.textSecondary} name="chevron-forward" size={18} />
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={styles.settingName}>Bersihkan Clipboard</Text>
              <Text style={styles.settingDesc}>Hapus teks tersalin otomatis</Text>
            </View>
            <Text style={styles.valueText}>{clipboardTimeout} Detik</Text>
          </View>
        </VaultCard>

        {/* Lock Vault Now */}
        <TouchableOpacity style={styles.lockButton} onPress={handleManualLock}>
          <Ionicons color={Colors.warning} name="lock-closed" size={20} />
          <Text style={styles.lockButtonText}>Kunci Vault Sekarang</Text>
        </TouchableOpacity>

        {/* About Section */}
        <Text style={styles.sectionTitle}>Tentang Aplikasi</Text>
        <VaultCard>
          <View style={styles.settingRow}>
            <Text style={styles.settingName}>Nama Aplikasi</Text>
            <Text style={styles.valueText}>Vaultix</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingName}>Versi PRD</Text>
            <Text style={styles.valueText}>1.2 (Offline Safe)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingName}>Arsitektur</Text>
            <Text style={styles.valueText}>Local-First SQLite</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingName}>Enkripsi</Text>
            <Text style={styles.valueText}>AES-256-GCM + Argon2id</Text>
          </View>
        </VaultCard>
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
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  settingText: {
    flex: 1,
  },
  settingName: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  settingDesc: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    color: Colors.accent,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  lockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.warning,
    gap: Spacing.xs,
    marginVertical: Spacing.md,
  },
  lockButtonText: {
    color: Colors.warning,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});
