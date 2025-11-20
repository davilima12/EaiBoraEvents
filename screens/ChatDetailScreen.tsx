import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, TextInput, Pressable, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { database } from "@/services/database";
import { Message } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function ChatDetailScreen({ route }: any) {
  const { chatId, contactId, contactName } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId || null);

  const loadMessages = useCallback(async () => {
    if (!user || !contactId) return;
    
    try {
      let chatIdToUse = currentChatId;
      if (!chatIdToUse) {
        chatIdToUse = await database.getOrCreateChat(user.id, contactId);
        setCurrentChatId(chatIdToUse);
      }
      
      const data = await database.getMessages(chatIdToUse);
      setMessages(data);
      
      await database.markMessagesAsRead(chatIdToUse, user.id);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, [user, contactId, currentChatId]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages])
  );

  const handleSend = async () => {
    if (!inputText.trim() || !user || !currentChatId) return;

    try {
      const newMessage = await database.sendMessage(currentChatId, user.id, inputText);
      setMessages((prev) => [...prev, newMessage]);
      setInputText("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
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
