import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import 'react-native-reanimated';

import { queryClient } from '@/src/services/queryClient';
import { AuthProvider, useAuth } from '@/src/store/AuthContext';

function RootLayoutNav(): React.ReactElement {
  const { user, isGuest, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !isGuest && !inAuthGroup) {
      // Rediriger vers login si non connecté
      router.replace('/(auth)/login');
    } else if ((user || isGuest) && inAuthGroup) {
      // Rediriger vers home si connecté
      router.replace('/(tabs)');
    }
  }, [user, isGuest, loading, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

export default function RootLayout(): React.ReactElement | null {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootLayoutNav />
      </AuthProvider>
    </QueryClientProvider>
  );
}
