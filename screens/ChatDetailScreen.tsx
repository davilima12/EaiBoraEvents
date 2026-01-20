import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Pusher from "pusher-js";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Spacing, BorderRadius } from "@/constants/theme";

// Initialize Pusher
// Replace with your actual Pusher credentials
const pusher = new Pusher("2aa594e7028a72e6ea80", {
  cluster: "us2",
});

interface Message {
  id: number;
  message: string;
  sender_id: number;
  recipient_id: number;
  created_at: string;
  user_profile_picture?: string;
}

export default function ChatDetailScreen({ route }: any) {
  const { contactId, contactName } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    if (!user || !contactId) return;

    try {
      const data = await api.getMessages(Number(contactId));
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, [user, contactId]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages])
  );

  useEffect(() => {
    if (!user || !contactId) return;

    const smallerId = Math.min(Number(user.id), Number(contactId));
    const largerId = Math.max(Number(user.id), Number(contactId));
    const channelName = `my-channel.${smallerId}${largerId}`;
    const typingChannelName = `typing-event.${smallerId}${largerId}`;

    const channel = pusher.subscribe(channelName);
    const typingChannel = pusher.subscribe(typingChannelName);

    channel.bind("my-event", (data: any) => {
      setMessages((prev) => {
        // Avoid duplicates if possible (basic check)
        const exists = prev.some(m => m.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
    });

    typingChannel.bind("typing-event", (data: any) => {
      if (data.sender_id === Number(contactId)) {
        setIsTyping(true);
        // Clear typing status after a few seconds of no events
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      typingChannel.unbind_all();
      typingChannel.unsubscribe();
    };
  }, [user, contactId]);

  const handleSend = async () => {
    if (!inputText.trim() || !user) return;

    const textToSend = inputText;
    setInputText(""); // Clear immediately

    try {
      // Optimistic update (optional, but good for UX)
      // We need a temp ID
      const tempId = Date.now();
      const tempMessage: Message = {
        id: tempId,
        message: textToSend,
        sender_id: Number(user.id),
        recipient_id: Number(contactId),
        created_at: new Date().toISOString(),
      };

      // setMessages((prev) => [...prev, tempMessage]); 
      // Commented out optimistic update to avoid complexity with duplicates for now, 
      // relying on Pusher event which is fast.

      await api.sendMessage(Number(contactId), textToSend);
    } catch (error) {
      console.error("Error sending message:", error);
      // Restore text if failed?
    }
  };

  const handleTyping = (text: string) => {
    setInputText(text);

    if (!user) return;

    // Debounce typing event
    // We don't want to send an event on every keystroke, but maybe every few seconds
    // or just once when starting.

    // Simple approach: Send if not sent recently? 
    // Or just fire and let backend/receiver handle it. 
    // The user code sends it on `broadcastTyping`.

    // Let's send it.
    api.sendTyping(Number(contactId)).catch(console.error);
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.messagesContainer,
            { paddingTop: Spacing.xl },
          ]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isSent = Number(item.sender_id) === Number(user?.id);
            return (
              <View
                style={[
                  styles.messageBubble,
                  isSent
                    ? [styles.sentBubble, { backgroundColor: theme.primary }]
                    : [styles.receivedBubble, { backgroundColor: theme.backgroundSecondary }],
                ]}
              >
                <ThemedText
                  style={[
                    styles.messageText,
                    { color: isSent ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {item.message}
                </ThemedText>
                <ThemedText
                  style={[
                    styles.messageTime,
                    { color: isSent ? "#FFFFFF80" : theme.textSecondary },
                  ]}
                >
                  {formatTime(item.created_at)}
                </ThemedText>
              </View>
            );
          }}
        />

        {isTyping && (
          <View style={styles.typingContainer}>
            <ThemedText style={[styles.typingText, { color: theme.textSecondary }]}>
              Digitando...
            </ThemedText>
          </View>
        )}

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
              onChangeText={handleTyping}
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
      </KeyboardAvoidingView>
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
  typingContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  }
});
