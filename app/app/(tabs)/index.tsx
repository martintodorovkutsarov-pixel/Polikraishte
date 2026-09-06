import { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { NewsCard, type NewsArticle } from "@/components/NewsCard";

export default function NewsScreen() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("news_articles")
      .select("id, title, url, source, summary, image_url, published_at")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(50);
    if (!error && data) setArticles(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <FlatList
      data={articles}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <NewsCard article={item} />}
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
              Все още няма новини. Те се събират автоматично на всеки час.
            </Text>
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  empty: { padding: 32, alignItems: "center" },
  emptyText: { color: "#888", textAlign: "center" },
});
