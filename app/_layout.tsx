import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#222',
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          contentStyle: { backgroundColor: '#f2f4f7' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'Income Strategy Visualizer' }}
        />
      </Stack>
    </>
  );
}
