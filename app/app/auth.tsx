import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setBusy(true);
    const result =
      mode === "signIn" ? await signIn(email, password) : await signUp(email, password, username);
    setBusy(false);

    if (result.error) {
      Alert.alert("Грешка", result.error);
      return;
    }
    if (mode === "signUp") {
      Alert.alert("Готово", "Проверете имейла си, за да потвърдите профила.");
    }
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>{mode === "signIn" ? "Вход" : "Регистрация"}</Text>

      {mode === "signUp" ? (
        <TextInput
          style={styles.input}
          placeholder="Потребителско име"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Имейл"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Парола"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={busy}>
        <Text style={styles.buttonText}>
          {busy ? "Моля, изчакайте..." : mode === "signIn" ? "Влез" : "Регистрирай се"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}>
        <Text style={styles.switchText}>
          {mode === "signIn" ? "Нямате профил? Регистрирайте се" : "Вече имате профил? Влезте"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 24, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2c7a4b",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  switchText: { color: "#2c7a4b", textAlign: "center", marginTop: 16 },
});
