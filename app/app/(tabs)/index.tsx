import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { NewsCard, type NewsArticle } from "@/components/NewsCard";
import { WeatherCard } from "@/components/WeatherCard";

export default function NewsScreen() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async (query: string) => {
    let request = supabase
      .from("news_articles")
      .select("id, title, url, source, summary, image_url, published_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(50);

    const cleaned = query.trim().replace(/[%,]/g, "");
    if (cleaned) {
      request = request.or(`title.ilike.%${cleaned}%,summary.ilike.%${cleaned}%`);
    }

    const { data, error } = await request;
    if (!error && data) setArticles(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(search);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load])
  );

  useEffect(() => {
    const timeout = setTimeout(() => load(search), 400);
    return () => clearTimeout(timeout);
  }, [search, load]);

  return (
    <FlatList
      data={articles}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NewsCard article={item} />}
      contentContainerStyle={{ paddingVertical: 8 }}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <>
          <WeatherCard />
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Търси в новините..."
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>
        </>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(search);
          }}
        />
      }
      ListEmptyComponent={
        !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {search.trim()
                ? "Няма новини, съответстващи на търсенето."
                : "Все още няма новини. Те се събират автоматично на всеки час."}
            </Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: 16, marginTop: 12, marginBottom: 4 },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  empty: { padding: 32, alignItems: "center" },
  emptyText: { color: "#888", textAlign: "center" },
});
