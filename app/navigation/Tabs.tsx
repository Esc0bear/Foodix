import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

// Écrans
import HomeScreen from '../screens/HomeScreen';
import SavedScreen from '../screens/SavedScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Types de navigation
export type RootTabParamList = {
  Home: undefined;
  Saved: undefined;
  Discover: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  RecipeDetail: { recipeId: string };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Composant d'icône pour les onglets (texte simple pour l'instant)
 */
function TabIcon({ 
  iconName, 
  color, 
  size = 20,
  focused = false
}: { 
  iconName: string; 
  color: string; 
  size?: number;
  focused?: boolean;
}) {
  const getIconText = (name: string) => {
    switch (name) {
      case 'Home':
        return focused ? '✨' : '🏠';
      case 'Saved':
        return '📖';
      case 'Discover':
        return '🧭';
      case 'Settings':
        return '👤';
      default:
        return '🏠';
    }
  };

  return (
    <Text style={{ fontSize: size, color }}>
      {getIconText(iconName)}
    </Text>
  );
}

/**
 * Navigateur d'onglets
 */
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          return <TabIcon iconName={route.name} color={color} size={size} focused={focused} />;
        },
        tabBarActiveTintColor: '#6B21A8', // primary.700
        tabBarInactiveTintColor: '#9CA3AF', // gray.400
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 3,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          tabBarLabel: 'Saved',
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Navigateur principal avec stack
 */
export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomColor: '#E5E7EB',
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#000000',
        },
        headerTintColor: '#6B21A8',
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RecipeDetail"
        component={RecipeDetailScreen}
        options={{
          title: 'Détails de la recette',
          headerBackTitle: 'Retour',
        }}
      />
    </Stack.Navigator>
  );
}
