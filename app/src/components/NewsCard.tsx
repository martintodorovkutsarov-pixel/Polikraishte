import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";

export type NewsArticle = {
  id: string;
  title: string;
  url: string;
  source: string | null;
  summary: string | null;
  image_url: string | null;
  published_at: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("bg-BG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <Pressable style={styles.card} onPress={() => Linking.openURL(article.url)}>
      {article.image_url ? (
        <Image source={{ uri: article.image_url }} style={styles.image} />
      ) : null}
      <View style={styles.body}>
        <Text style={styles.title}>{article.title}</Text>
        {article.summary ? (
          <Text style={styles.summary} numberOfLines={3}>
            {article.summary}
          </Text>
        ) : null}
        <Text style={styles.meta}>
          {article.source ?? "Новина"}
          {article.published_at ? ` · ${formatDate(article.published_at)}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: { width: "100%", height: 160 },
  body: { padding: 14 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  summary: { fontSize: 14, color: "#444", marginBottom: 6 },
  meta: { fontSize: 12, color: "#888" },
});
