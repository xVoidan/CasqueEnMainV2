import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/src/store/AuthContext';

export default function TabLayout(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.email === 'jonathan.valsaque@gmail.com';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(0, 0, 0, 0.9)',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 85 : 60 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 25 : insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={100}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          ) : (
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 1)']}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          )
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="training"
        options={{
          title: 'Entraînement',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons
                name={focused ? 'fitness' : 'fitness-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Classement',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons
                name={focused ? 'trophy' : 'trophy-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Onglet Admin - Caché si l'utilisateur n'est pas admin */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin ? undefined : null, // Cache l'onglet si pas admin
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Cache l'ancienne page explore */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Cache cette route de la navigation
        }}
      />
    </Tabs>
  );
}
