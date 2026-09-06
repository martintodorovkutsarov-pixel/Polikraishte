import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function NewPostScreen() {
  const { session } = useAuth();
  const [body, setBody] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Нужен е достъп", "Разрешете достъп до снимките, за да добавите изображение.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  }

  async function handleSubmit() {
    if (!session) return;
    if (body.trim().length === 0) {
      Alert.alert("Празна публикация", "Напишете нещо, преди да публикувате.");
      return;
    }

    setBusy(true);
    try {
      let image_url: string | null = null;

      if (imageBase64) {
        const path = `${session.user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, decode(imageBase64), { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        image_url = supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
      }

      const { error: insertError } = await supabase.from("posts").insert({
        author_id: session.user.id,
        body: body.trim(),
        image_url,
      });
      if (insertError) throw insertError;

      router.back();
    } catch (err: any) {
      Alert.alert("Грешка", err.message ?? "Нещо се обърка.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TextInput
        style={styles.textArea}
        placeholder="Какво искате да споделите със селото?"
        multiline
        value={body}
        onChangeText={setBody}
        maxLength={2000}
      />

      {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

      <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
        <Text style={styles.secondaryButtonText}>
          {imageUri ? "Смени снимката" : "Добави снимка"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? "Публикуване..." : "Публикувай"}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: "top",
  },
  preview: { width: "100%", height: 200, borderRadius: 8, marginTop: 12 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#2c7a4b",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  secondaryButtonText: { color: "#2c7a4b", fontWeight: "600" },
  button: {
    backgroundColor: "#2c7a4b",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
