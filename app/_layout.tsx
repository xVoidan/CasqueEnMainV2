import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import 'react-native-reanimated';

import { queryClient } from '@/src/services/queryClient';
import { AuthProvider, useAuth } from '@/src/store/AuthContext';
import { ThemeProvider } from '@/src/store/ThemeContext';
import { ErrorBoundary } from '@/src/components/error/ErrorBoundary';
import { OfflineNotice } from '@/src/components/network/OfflineNotice';

function RootLayoutNav(): React.ReactElement {
  const { user, isGuest, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Gérer les deep links pour la confirmation d'email
  useEffect(() => {
    const handleDeepLink = (url: string): void => {
      if (url.includes('type=signup') || url.includes('type=email') || url.includes('type=recovery')) {
        // Email confirmé avec succès, rediriger vers l'écran de confirmation
        router.replace('/(auth)/email-confirmed');
      }
    };

    // Écouter les deep links
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Vérifier si l'app a été ouverte avec un deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
      return url;
    }).catch((err) => {
      console.error('Error getting initial URL:', err);
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    // Ne pas rediriger si on est sur la page de confirmation
    if (segments[1] === 'email-confirmed') {
      return;
    }

    if (!user && !isGuest && !inAuthGroup) {
      // Rediriger vers login si non connecté
      router.replace('/(auth)/login');
    } else if ((user || isGuest) && inAuthGroup && segments[1] !== 'email-confirmed') {
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <OfflineNotice />
            <RootLayoutNav />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
