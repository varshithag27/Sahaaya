import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="medications" />
      <Stack.Screen name="appointments" />
      <Stack.Screen name="contacts" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}