import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { SetupMasterPasswordScreen } from '../screens/auth/SetupMasterPasswordScreen';
import { UnlockVaultScreen } from '../screens/auth/UnlockVaultScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC<{ initialRoute?: keyof AuthStackParamList }> = ({
  initialRoute = 'Onboarding',
}) => {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen component={OnboardingScreen} name="Onboarding" />
      <Stack.Screen component={SetupMasterPasswordScreen} name="SetupMasterPassword" />
      <Stack.Screen component={UnlockVaultScreen} name="UnlockVault" />
    </Stack.Navigator>
  );
};
