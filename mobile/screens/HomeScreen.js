import React, { useState, useEffect, useContext } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext, api } from "../App";
import { format } from "date-fns";

const COLORS = { calories: "#f97316", protein: "#3b82f6", carbs: "#eab308", fats: "#ef4444" };

function MacroBar({ label, consumed, goal, color }) {
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroValue}>{Math.round(consumed)}/{Math.round(goal)}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const [progress, setProgress] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");

  const load = async () => {
    try {
      const res = await api.get(`/goals/progress?date=${today}`);
      setProgress(res.data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const consumed = progress?.consumed || {};
  const goals = progress?.goals || {};
  const calPct = goals.calories ? Math.min(consumed.calories / goals.calories, 1) : 0;
  const remaining = Math.max((goals.calories || 0) - (consumed.calories || 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name || "there"} 👋</Text>
          <Text style={styles.date}>{format(new Date(), "EEEE, MMM d")}</Text>
        </View>

        <View style={styles.calCard}>
          <View style={styles.calRow}>
            <View>
              <Text style={styles.calLabel}>Consumed</Text>
              <Text style={styles.calNum}>{Math.round(consumed.calories || 0)}</Text>
            </View>
            <View style={styles.calMiddle}>
              <Text style={styles.calSmall}>kcal</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.calLabel}>Remaining</Text>
              <Text style={styles.calNum}>{Math.round(remaining)}</Text>
            </View>
          </View>
          <View style={styles.ringBg}>
            <View style={[styles.ringFill, { width: `${calPct * 100}%` }]} />
          </View>
          <Text style={styles.goalLabel}>Goal: {Math.round(goals.calories || 0)} kcal</Text>
        </View>

        <View style={styles.macroCard}>
          <Text style={styles.sectionTitle}>Macros</Text>
          {Object.entries(COLORS).map(([key, color]) => (
            <MacroBar
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              consumed={consumed[key] || 0}
              goal={goals[key] || 0}
              color={color}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 20, paddingBottom: 10 },
  greeting: { fontSize: 22, fontWeight: "700", color: "#111827" },
  date: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  calCard: { margin: 16, backgroundColor: "#16a34a", borderRadius: 20, padding: 20 },
  calRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  calLabel: { fontSize: 12, color: "#bbf7d0" },
  calNum: { fontSize: 32, fontWeight: "800", color: "#fff" },
  calMiddle: { alignItems: "center" },
  calSmall: { fontSize: 16, color: "#bbf7d0" },
  ringBg: { height: 10, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 5, marginTop: 16, overflow: "hidden" },
  ringFill: { height: 10, backgroundColor: "#fff", borderRadius: 5 },
  goalLabel: { fontSize: 12, color: "#bbf7d0", marginTop: 6 },
  macroCard: { margin: 16, marginTop: 0, backgroundColor: "#fff", borderRadius: 20, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 12 },
  macroRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  macroLabel: { width: 60, fontSize: 12, color: "#6b7280" },
  barBg: { flex: 1, height: 8, backgroundColor: "#f1f5f9", borderRadius: 4, overflow: "hidden", marginHorizontal: 8 },
  barFill: { height: 8, borderRadius: 4 },
  macroValue: { width: 70, fontSize: 11, color: "#374151", textAlign: "right" },
});
