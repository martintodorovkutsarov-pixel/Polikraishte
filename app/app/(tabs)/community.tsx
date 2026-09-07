import { useCallback, useState } from "react";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { PostCard, type Post } from "@/components/PostCard";

export default function CommunityScreen() {
  const { session, profile, signOut, deleteAccount } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, body, image_url, created_at, author_id, profiles(username, display_name)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setPosts(data as unknown as Post[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function handleNewPost() {
    if (!session) {
      router.push("/auth");
    } else {
      router.push("/post/new");
    }
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
            }
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        {session ? (
          <View style={styles.accountLinks}>
            <TouchableOpacity onPress={signOut}>
              <Text style={styles.headerLink}>Изход ({profile?.username})</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteAccount} disabled={deleting}>
              <Text style={styles.deleteAccountLink}>
                {deleting ? "Изтриване…" : "Изтрий профила"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => router.push("/auth")}>
            <Text style={styles.headerLink}>Вход / Регистрация</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.newButton} onPress={handleNewPost}>
          <Text style={styles.newButtonText}>+ Нова публикация</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} onChanged={load} />}
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Все още няма публикации. Бъдете първите, които ще споделят нещо!
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    backgroundColor: "#fafafa",
  },
  accountLinks: { flexDirection: "column" },
  headerLink: { color: "#2c7a4b", fontWeight: "500" },
  deleteAccountLink: { color: "#c0392b", fontSize: 11, marginTop: 3 },
  newButton: { backgroundColor: "#2c7a4b", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  newButtonText: { color: "#fff", fontWeight: "600" },
  empty: { padding: 32, alignItems: "center" },
  emptyText: { color: "#888", textAlign: "center" },
});
