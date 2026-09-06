import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { PostCard, type Post } from "@/components/PostCard";

export default function CommunityScreen() {
  const { session, profile, signOut } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Reload every time this tab comes into focus (e.g. returning from the
  // "new post" screen, or switching back from the News tab) — not just once
  // when the app first launches.
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

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        {session ? (
          <TouchableOpacity onPress={signOut}>
            <Text style={styles.headerLink}>Изход ({profile?.username})</Text>
          </TouchableOpacity>
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
        renderItem={({ item }) => <PostCard post={item} onReported={load} />}
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
  headerLink: { color: "#2c7a4b", fontWeight: "500" },
  newButton: { backgroundColor: "#2c7a4b", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  newButtonText: { color: "#fff", fontWeight: "600" },
  empty: { padding: 32, alignItems: "center" },
  emptyText: { color: "#888", textAlign: "center" },
});
