import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export type Post = {
  id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
  profiles: { username: string; display_name: string | null } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("bg-BG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostCard({ post, onChanged }: { post: Post; onChanged?: () => void }) {
  const { session } = useAuth();
  const isOwnPost = session?.user.id === post.author_id;

  async function handleReport() {
    if (!session) {
      Alert.alert("Трябва да влезете в профила си", "За да докладвате публикация, първо влезте в профила си.");
      return;
    }
    const { error } = await supabase
      .from("post_reports")
      .insert({ post_id: post.id, reporter_id: session.user.id });
    if (error) {
      Alert.alert("Грешка", error.message);
    } else {
      Alert.alert("Благодарим", "Публикацията беше докладвана за преглед.");
      onChanged?.();
    }
  }

  function handleDelete() {
    Alert.alert(
      "Изтриване на публикация",
      "Сигурни ли сте, че искате да изтриете тази публикация? Това не може да бъде отменено.",
      [
        { text: "Отказ", style: "cancel" },
        {
          text: "Изтрий",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("posts").delete().eq("id", post.id);
            if (error) {
              Alert.alert("Грешка", error.message);
            } else {
              onChanged?.();
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.author}>
        {post.profiles?.display_name || post.profiles?.username || "Потребител"}
      </Text>
      <Text style={styles.body}>{post.body}</Text>
      {post.image_url ? <Image source={{ uri: post.image_url }} style={styles.image} /> : null}
      <View style={styles.footer}>
        <Text style={styles.meta}>{formatDate(post.created_at)}</Text>
        <View style={styles.actions}>
          {isOwnPost ? (
            <TouchableOpacity onPress={handleDelete}>
              <Text style={styles.delete}>Изтрий</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleReport}>
              <Text style={styles.report}>Докладвай</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  author: { fontWeight: "600", marginBottom: 4 },
  body: { fontSize: 15, color: "#222", marginBottom: 8 },
  image: { width: "100%", height: 200, borderRadius: 8, marginBottom: 8 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  actions: { flexDirection: "row" },
  meta: { fontSize: 12, color: "#888" },
  report: { fontSize: 12, color: "#c0392b" },
  delete: { fontSize: 12, color: "#c0392b", fontWeight: "600" },
});
