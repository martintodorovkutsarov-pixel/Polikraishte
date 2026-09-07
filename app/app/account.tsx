import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function AccountScreen() {
  const { profile, session, signOut, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.back();
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Изтриване на профила",
      "Това ще изтрие завинаги профила ви, всички ваши публикации и снимки. Действието не може да бъде отменено. Сигурни ли сте?",
      [
        { text: "Отказ", style: "cancel" },
        {
          text: "Изтрий профила",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const { error } = await deleteAccount();
            setDeleting(false);
            if (error) {
              Alert.alert("Грешка", error);
            } else {
              Alert.alert("Готово", "Профилът ви беше изтрит.");
              router.back();
            }
          },
        },
      ]
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.info}>Не сте влезли в профил.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Потребителско име</Text>
        <Text style={styles.value}>{profile?.username ?? "—"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Имейл</Text>
        <Text style={styles.value}>{session.user.email}</Text>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Изход</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.dangerTitle}>Опасна зона</Text>
      <Text style={styles.dangerHint}>
        Изтриването е окончателно — премахва профила, всички ваши публикации и качени снимки.
      </Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}
        disabled={deleting}
      >
        <Text style={styles.deleteButtonText}>
          {deleting ? "Изтриване…" : "Изтрий профила"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  info: { fontSize: 16, color: "#666", textAlign: "center", marginTop: 40 },
  section: { marginBottom: 20 },
  label: { fontSize: 12, color: "#888", marginBottom: 4, textTransform: "uppercase" },
  value: { fontSize: 17, color: "#222", fontWeight: "500" },
  signOutButton: {
    backgroundColor: "#eef4f0",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  signOutText: { color: "#2c7a4b", fontWeight: "600", fontSize: 16 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#ddd",
    marginVertical: 32,
  },
  dangerTitle: { fontSize: 15, fontWeight: "700", color: "#c0392b", marginBottom: 6 },
  dangerHint: { fontSize: 13, color: "#888", marginBottom: 14, lineHeight: 18 },
  deleteButton: {
    borderWidth: 1,
    borderColor: "#c0392b",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  deleteButtonText: { color: "#c0392b", fontWeight: "700", fontSize: 16 },
});
