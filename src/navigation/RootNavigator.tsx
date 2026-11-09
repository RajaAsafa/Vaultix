import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Colors } from '../constants/theme';
import { useAuthStore } from '../store/authStore';
import { useVaultStore } from '../store/vaultStore';
import { useAutoLock } from '../hooks/useAutoLock';
import { TabNavigator } from './TabNavigator';
import { AuthNavigator } from './AuthNavigator';
import { UnlockVaultScreen } from '../screens/auth/UnlockVaultScreen';
import { AddAccountScreen } from '../screens/vault/AddAccountScreen';
import { EditAccountScreen } from '../screens/vault/EditAccountScreen';
import { AccountDetailScreen } from '../screens/vault/AccountDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const status = useAuthStore((s) => s.status);
  const vek = useAuthStore((s) => s.vek);
  const initCheck = useAuthStore((s) => s.initCheck);
  const loadVaultData = useVaultStore((s) => s.loadVaultData);

  // Hook for monitoring auto-lock when app moves to background
  useAutoLock();

  useEffect(() => {
    initCheck();
  }, [initCheck]);

  // When vault transitions to 'unlocked', load and decrypt data into memory
  useEffect(() => {
    if (status === 'unlocked' && vek) {
      loadVaultData(vek);
    }
  }, [status, vek, loadVaultData]);

  if (status === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  if (status === 'uninitialized') {
    return <AuthNavigator initialRoute="Onboarding" />;
  }

  if (status === 'locked') {
    return <UnlockVaultScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen component={TabNavigator} name="Main" />
      <Stack.Screen
        component={AddAccountScreen}
        name="AddAccount"
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        component={EditAccountScreen}
        name="EditAccount"
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen component={AccountDetailScreen} name="AccountDetail" />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
