import { Stack , Redirect } from 'expo-router';
import React from 'react';
import { useAuth } from '@/src/store/AuthContext';

const ADMIN_EMAIL = 'jonathan.valsaque@gmail.com';

export default function AdminLayout(): React.ReactElement {
  const { user } = useAuth();

  // Vérifier si l'utilisateur est admin
  if (user?.email !== ADMIN_EMAIL) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="themes" />
      <Stack.Screen name="questions" />
      <Stack.Screen name="import-export" />
      <Stack.Screen name="stats" />
    </Stack>
  );
}
