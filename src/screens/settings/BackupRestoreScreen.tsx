import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Typography } from '../../constants/theme';
import { VaultInput } from '../../components/VaultInput';
import { VaultButton } from '../../components/VaultButton';
import { VaultCard } from '../../components/VaultCard';
import { BackupService } from '../../services/backupService';
import { useAuthStore } from '../../store/authStore';
import { useVaultStore } from '../../store/vaultStore';

export const BackupRestoreScreen: React.FC = () => {
  const navigation = useNavigation();
  const vek = useAuthStore((s) => s.vek);
  const loadVaultData = useVaultStore((s) => s.loadVaultData);

  // Export state
  const [exportPassword, setExportPassword] = useState('');
  const [exportError, setExportError] = useState('');
  const [exportSuccess, setExportSuccess] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Import state
  const [importPassword, setImportPassword] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    if (!exportPassword) {
      setExportError('Masukkan Master Password untuk membuat file cadangan');
      return;
    }

    try {
      setIsExporting(true);
      setExportError('');
      setExportSuccess('');

      await BackupService.exportBackup(exportPassword);
      setExportSuccess('File cadangan berhasil dibuat! Silakan simpan melalui menu share.');
      setExportPassword('');
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Gagal membuat file cadangan');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importPassword) {
      setImportError('Masukkan Master Password file cadangan untuk memulihkan');
      return;
    }

    try {
      setIsImporting(true);
      setImportError('');
      setImportSuccess('');

      const res = await BackupService.importBackup(importPassword);
      setImportSuccess(`Berhasil memulihkan ${res.accountsCount} akun ke dalam brankas!`);
      setImportPassword('');

      // Reload vault data if unlocked
      if (vek) {
        await loadVaultData(vek);
      }
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Gagal memulihkan file cadangan');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons color={Colors.textPrimary} name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Backup & Restore</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Export Section */}
          <Text style={styles.sectionTitle}>Ekspor Cadangan (.vaultix)</Text>
          <VaultCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons color={Colors.accent} name="cloud-upload-outline" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Simpan Data Cadangan</Text>
                <Text style={styles.cardDesc}>
                  Seluruh akun, kategori, dan riwayat password akan dienkripsi dengan Master Password ke dalam file .vaultix.
                </Text>
              </View>
            </View>

            <VaultInput
              isPassword
              error={exportError}
              label="Konfirmasi Master Password"
              placeholder="Masukkan Master Password Anda"
              value={exportPassword}
              onChangeText={(txt) => {
                setExportPassword(txt);
                if (exportError) setExportError('');
              }}
            />

            {exportSuccess ? (
              <View style={styles.successBanner}>
                <Ionicons color={Colors.success} name="checkmark-circle" size={18} />
                <Text style={styles.successText}>{exportSuccess}</Text>
              </View>
            ) : null}

            <VaultButton
              loading={isExporting}
              title="Buat File Cadangan (.vaultix)"
              variant="primary"
              onPress={handleExport}
            />
          </VaultCard>

          {/* Import Section */}
          <Text style={styles.sectionTitle}>Pulihkan dari File Cadangan</Text>
          <VaultCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { borderColor: Colors.warning }]}>
                <Ionicons color={Colors.warning} name="cloud-download-outline" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Pulihkan Data Brankas</Text>
                <Text style={styles.cardDesc}>
                  Pilih file .vaultix yang tersimpan di HP, Google Drive, atau kartu SD untuk dipulihkan kembali ke brankas.
                </Text>
              </View>
            </View>

            <VaultInput
              isPassword
              error={importError}
              label="Master Password File Cadangan"
              placeholder="Masukkan Master Password file ini"
              value={importPassword}
              onChangeText={(txt) => {
                setImportPassword(txt);
                if (importError) setImportError('');
              }}
            />

            {importSuccess ? (
              <View style={styles.successBanner}>
                <Ionicons color={Colors.success} name="checkmark-circle" size={18} />
                <Text style={styles.successText}>{importSuccess}</Text>
              </View>
            ) : null}

            <View style={styles.warningBox}>
              <Ionicons color={Colors.warning} name="alert-circle-outline" size={16} />
              <Text style={styles.warningBoxText}>
                Pemulihan akan menggantikan data yang ada saat ini dengan isi file cadangan.
              </Text>
            </View>

            <VaultButton
              loading={isImporting}
              title="Pilih File .vaultix & Pulihkan"
              variant="secondary"
              onPress={handleImport}
            />
          </VaultCard>
        </ScrollView>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: 4,
  },
  cardDesc: {
    color: Colors.textMuted,
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: Colors.success,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  successText: {
    color: Colors.success,
    fontSize: Typography.sizes.xs,
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  warningBoxText: {
    color: Colors.warning,
    fontSize: Typography.sizes.xs,
    flex: 1,
    lineHeight: 16,
  },
});
