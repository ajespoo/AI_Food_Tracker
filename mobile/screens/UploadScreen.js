import React, { useState, useContext } from "react";
import {
  View, Text, TouchableOpacity, Image, TextInput, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { api } from "../App";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function UploadScreen() {
  const [image, setImage] = useState(null);
  const [mealType, setMealType] = useState("snack");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("camera"); // camera | manual

  const [manual, setManual] = useState({ food_name: "", calories: "", protein: "", carbs: "", fats: "" });

  const pickImage = async (source) => {
    const opts = { mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 };
    const res = source === "camera"
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled) setImage(res.assets[0]);
  };

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", { uri: image.uri, type: "image/jpeg", name: "food.jpg" });
      form.append("meal_type", mealType);
      const res = await api.post("/food/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(res.data.nutrition);
      Alert.alert("Logged!", `${res.data.food.food_name} — ${Math.round(res.data.food.calories)} kcal`);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const logManual = async () => {
    if (!manual.food_name || !manual.calories) {
      Alert.alert("Required", "Food name and calories are required");
      return;
    }
    setLoading(true);
    try {
      await api.post("/food/log", { ...manual, meal_type: mealType, source: "manual" });
      Alert.alert("Logged!", `${manual.food_name} added`);
      setManual({ food_name: "", calories: "", protein: "", carbs: "", fats: "" });
    } catch {
      Alert.alert("Error", "Failed to log food");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Log Food</Text>

        <View style={styles.tabs}>
          {["camera", "manual"].map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "camera" ? "📷 AI Scan" : "✏️ Manual"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.mealRow}>
          {MEAL_TYPES.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.mealChip, mealType === m && styles.mealChipActive]}
              onPress={() => setMealType(m)}
            >
              <Text style={[styles.mealChipText, mealType === m && styles.mealChipTextActive]}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === "camera" && (
          <>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.preview} />
            ) : (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.btn} onPress={() => pickImage("camera")}>
                <Text style={styles.btnText}>📷 Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btn} onPress={() => pickImage("gallery")}>
                <Text style={styles.btnText}>🖼 Gallery</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.analyzeBtn, (!image || loading) && styles.disabled]}
              onPress={analyzeImage}
              disabled={!image || loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeBtnText}>Analyze with AI</Text>}
            </TouchableOpacity>
          </>
        )}

        {tab === "manual" && (
          <>
            {[["food_name", "Food name", false], ["calories", "Calories (kcal)", true], ["protein", "Protein (g)", true], ["carbs", "Carbs (g)", true], ["fats", "Fats (g)", true]].map(([key, placeholder, numeric]) => (
              <TextInput
                key={key}
                value={manual[key]}
                onChangeText={(v) => setManual((p) => ({ ...p, [key]: v }))}
                placeholder={placeholder}
                keyboardType={numeric ? "decimal-pad" : "default"}
                style={styles.input}
                placeholderTextColor="#9ca3af"
              />
            ))}
            <TouchableOpacity style={[styles.analyzeBtn, loading && styles.disabled]} onPress={logManual} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeBtnText}>Log Food</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 16 },
  tabs: { flexDirection: "row", backgroundColor: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  tabTextActive: { color: "#16a34a", fontWeight: "700" },
  mealRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  mealChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#e5e7eb" },
  mealChipActive: { backgroundColor: "#dcfce7", borderColor: "#22c55e" },
  mealChipText: { fontSize: 12, color: "#6b7280" },
  mealChipTextActive: { color: "#16a34a", fontWeight: "600" },
  preview: { width: "100%", height: 220, borderRadius: 16, marginBottom: 12 },
  placeholder: { width: "100%", height: 160, borderRadius: 16, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  placeholderText: { color: "#9ca3af" },
  buttonRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  btn: { flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, alignItems: "center" },
  btnText: { fontSize: 14, color: "#374151" },
  analyzeBtn: { backgroundColor: "#22c55e", paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  analyzeBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  disabled: { opacity: 0.5 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111827", marginBottom: 10, backgroundColor: "#fff" },
});
