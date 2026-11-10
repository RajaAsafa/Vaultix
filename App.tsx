import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus, Image, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { RootNavigator } from './src/navigation/RootNavigator';
import { BorderRadius, Colors } from './src/constants/theme';

const VaultixNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.accent,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    notification: Colors.accent,
  },
};

export default function App() {
  usePreventScreenCapture();
  const [isAppActive, setIsAppActive] = useState<boolean>(
    () => (AppState.currentState ?? 'active') === 'active'
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      setIsAppActive(nextState === 'active');
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <NavigationContainer theme={VaultixNavigationTheme}>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
        {!isAppActive && (
          <View style={[StyleSheet.absoluteFill, styles.privacyOverlay]}>
            <View style={styles.privacyLogoBox}>
              <Image
                accessibilityLabel="Logo Vaultix"
                source={require('./assets/icon.png')}
                style={styles.privacyLogo}
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  privacyOverlay: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  privacyLogoBox: {
    width: 110,
    height: 110,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  privacyLogo: {
    width: '100%',
    height: '100%',
  },
});
