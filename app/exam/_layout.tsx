import { Stack } from 'expo-router';

export default function ExamLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="selection"
        options={{
          title: 'Sélection Examen',
        }}
      />
      <Stack.Screen
        name="session"
        options={{
          title: 'Session Examen',
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="results"
        options={{
          title: 'Résultats',
        }}
      />
    </Stack>
  );
}
