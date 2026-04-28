import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../App";

const SUGGESTIONS = [
  "What's a high-protein breakfast?",
  "How many calories are in a banana?",
  "Give me a 1500 calorie meal plan",
  "What foods are high in fiber?",
];

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: "0", role: "assistant", text: "Hi! I'm your AI nutrition coach. Ask me anything about food, recipes, or your goals." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const flatRef = React.useRef();

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now().toString(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.text }));
      history.push({ role: "user", content: text });
      const res = await api.post("/food/chat", { messages: history });
      const reply = { id: (Date.now() + 1).toString(), role: "assistant", text: res.data.reply };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", text: "Sorry, I had trouble responding. Try again!" }]);
    } finally {
      setLoading(false);
    }

    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={80}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Nutrition Coach</Text>
        </View>

        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.bubbleText, item.role === "user" && styles.userText]}>{item.text}</Text>
            </View>
          )}
          ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 12 }} color="#22c55e" /> : null}
        />

        {messages.length <= 1 && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <TouchableOpacity key={s} onPress={() => sendMessage(s)} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about nutrition..."
            style={styles.input}
            placeholderTextColor="#9ca3af"
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            multiline
          />
          <TouchableOpacity
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff" },
  title: { fontSize: 17, fontWeight: "700", color: "#111827" },
  list: { padding: 12 },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 16, marginBottom: 8 },
  aiBubble: { backgroundColor: "#fff", alignSelf: "flex-start", borderBottomLeftRadius: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  userBubble: { backgroundColor: "#22c55e", alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: "#1f2937", lineHeight: 20 },
  userText: { color: "#fff" },
  suggestions: { flexDirection: "row", flexWrap: "wrap", padding: 8, gap: 6 },
  chip: { backgroundColor: "#dcfce7", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipText: { fontSize: 12, color: "#15803d" },
  inputRow: { flexDirection: "row", padding: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb", gap: 8, alignItems: "flex-end" },
  input: { flex: 1, backgroundColor: "#f1f5f9", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: "#111827", maxHeight: 100 },
  sendBtn: { width: 42, height: 42, backgroundColor: "#22c55e", borderRadius: 21, alignItems: "center", justifyContent: "center" },
  sendBtnText: { color: "#fff", fontSize: 20, fontWeight: "700", lineHeight: 22 },
});
