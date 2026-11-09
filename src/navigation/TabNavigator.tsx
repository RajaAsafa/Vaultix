import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { Colors } from '../constants/theme';
import { HomeScreen } from '../screens/home/HomeScreen';
import { VaultListScreen } from '../screens/vault/VaultListScreen';
import { GeneratorScreen } from '../screens/generator/GeneratorScreen';
import { SecurityDashboardScreen } from '../screens/security/SecurityDashboardScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tab.Screen
        component={HomeScreen}
        name="HomeTab"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="home-outline" size={size} />
          ),
        }}
      />
      <Tab.Screen
        component={VaultListScreen}
        name="VaultTab"
        options={{
          tabBarLabel: 'Vault',
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="shield-outline" size={size} />
          ),
        }}
      />
      <Tab.Screen
        component={GeneratorScreen}
        name="GeneratorTab"
        options={{
          tabBarLabel: 'Generator',
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="flash-outline" size={size} />
          ),
        }}
      />
      <Tab.Screen
        component={SecurityDashboardScreen}
        name="SecurityTab"
        options={{
          tabBarLabel: 'Security',
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="analytics-outline" size={size} />
          ),
        }}
      />
      <Tab.Screen
        component={SettingsScreen}
        name="SettingsTab"
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons color={color} name="settings-outline" size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
