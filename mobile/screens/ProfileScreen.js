import React, { useState, useContext } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext, api } from "../App";

export default function ProfileScreen() {
  const { user, logout, updateUser } = useContext(AuthContext);
  const [form, setForm] = useState({ name: user?.name || "", phone_number: user?.phone_number || "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.patch("/auth/profile", form);
      updateUser(res.data.user);
      Alert.alert("Saved", "Profile updated");
    } catch {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name || user?.email || "U")[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || "User"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.badge, user?.subscription_status === "active" ? styles.premiumBadge : styles.freeBadge]}>
            <Text style={[styles.badgeText, user?.subscription_status === "active" ? styles.premiumText : styles.freeText]}>
              {user?.subscription_status === "active" ? `${user?.subscription_plan} Premium` : "Free Plan"}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={form.name}
              onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput value={user?.email} editable={false} style={[styles.input, styles.disabled]} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              value={form.phone_number}
              onChangeText={(v) => setForm((p) => ({ ...p, phone_number: v }))}
              style={styles.input}
              placeholder="+1 555 000 0000"
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Changes"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16 },
  avatarContainer: { alignItems: "center", marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: "700", color: "#16a34a" },
  name: { fontSize: 20, fontWeight: "700", color: "#111827" },
  email: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  badge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  premiumBadge: { backgroundColor: "#fef9c3" },
  freeBadge: { backgroundColor: "#f1f5f9" },
  badgeText: { fontSize: 12, fontWeight: "600" },
  premiumText: { color: "#854d0e" },
  freeText: { color: "#6b7280" },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 12 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: "#111827" },
  disabled: { backgroundColor: "#f9fafb", color: "#9ca3af" },
  saveBtn: { backgroundColor: "#22c55e", paddingVertical: 14, borderRadius: 14, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  logoutBtn: { borderWidth: 1, borderColor: "#fecaca", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  logoutText: { color: "#ef4444", fontWeight: "600", fontSize: 15 },
});
