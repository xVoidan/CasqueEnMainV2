import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';

export default function App(): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        {/* Navigation will be added here */}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
