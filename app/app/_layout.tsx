import { Stack } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" options={{ headerShown: true, title: "Профил", presentation: "modal" }} />
        <Stack.Screen
          name="post/new"
          options={{ headerShown: true, title: "Нова публикация", presentation: "modal" }}
        />
      </Stack>
    </AuthProvider>
  );
}
