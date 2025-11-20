import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { mockMessages } from "@/utils/mockData";
import { Message } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function ChatDetailScreen({ route }: any) {
  const { contactId, contactName } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>(mockMessages.c1 || []);
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId: "c1",
      senderId: "current",
      text: inputText,
      timestamp: new Date().toISOString(),
      isSent: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={messages}
        inverted
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messagesContainer,
          { paddingTop: Spacing.xl },
        ]}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.isSent
                ? [styles.sentBubble, { backgroundColor: theme.primary }]
                : [styles.receivedBubble, { backgroundColor: theme.backgroundSecondary }],
            ]}
          >
            <ThemedText
              style={[
                styles.messageText,
                { color: item.isSent ? "#FFFFFF" : theme.text },
              ]}
            >
              {item.text}
            </ThemedText>
            <ThemedText
              style={[
                styles.messageTime,
                { color: item.isSent ? "#FFFFFF80" : theme.textSecondary },
              ]}
            >
              {formatTime(item.timestamp)}
            </ThemedText>
          </View>
        )}
      />

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: insets.bottom + Spacing.sm,
          },
        ]}
      >
        <View style={[styles.inputBar, { backgroundColor: theme.backgroundSecondary }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Mensagem..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <Pressable
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? theme.primary : theme.backgroundTertiary },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Feather name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  sentBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    marginBottom: 2,
  },
  messageTime: {
    fontSize: 11,
    alignSelf: "flex-end",
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.1)",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
});
