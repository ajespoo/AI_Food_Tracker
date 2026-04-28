import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../App";

const MACROS = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fats", label: "Fats", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
  { key: "water_ml", label: "Water", unit: "ml" },
];

export default function GoalTrackerScreen() {
  const [goals, setGoals] = useState({});
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadGoals(); }, []);

  const loadGoals = async () => {
    try {
      const res = await api.get("/goals/macros");
      setGoals(res.data.goals);
      setForm(res.data.goals);
    } catch {}
  };

  const saveGoals = async () => {
    setSaving(true);
    try {
      const res = await api.put("/goals/macros", form);
      setGoals(res.data.goals);
      setEditing(false);
      Alert.alert("Saved", "Your goals have been updated");
    } catch {
      Alert.alert("Error", "Failed to save goals");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Daily Goals</Text>
          {!editing && (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          {MACROS.map(({ key, label, unit }) => (
            <View key={key} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              {editing ? (
                <TextInput
                  value={String(form[key] || "")}
                  onChangeText={(v) => setForm((p) => ({ ...p, [key]: parseFloat(v) || 0 }))}
                  keyboardType="decimal-pad"
                  style={styles.input}
                />
              ) : (
                <Text style={styles.rowValue}>{Math.round(goals[key] || 0)} {unit}</Text>
              )}
            </View>
          ))}

          {editing && (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={saveGoals}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Goals"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(false); setForm(goals); }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  editBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: "#dcfce7" },
  editBtnText: { color: "#16a34a", fontWeight: "600", fontSize: 13 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  rowLabel: { fontSize: 15, color: "#374151" },
  rowValue: { fontSize: 15, fontWeight: "600", color: "#111827" },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 15, width: 100, textAlign: "right" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  saveBtn: { flex: 1, backgroundColor: "#22c55e", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  cancelBtnText: { color: "#374151", fontSize: 15 },
});
