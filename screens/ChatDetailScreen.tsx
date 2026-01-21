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
  id: number | string;
  message: string;
  sender_id: number;
  recipient_id: number;
  created_at: string;
  user_profile_picture?: string;
  status?: 'sending' | 'sent' | 'error';
  tempId?: boolean; // Indica se é uma mensagem temporária (optimistic update)
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
        // Ensure id exists, create one if not
        if (!data.id) {
          data.id = Date.now() + Math.random();
        }
        
        // Se é uma mensagem enviada pelo usuário atual, marcar como enviada
        // e substituir a mensagem temporária (optimistic update)
        if (Number(data.sender_id) === Number(user?.id)) {
          // Buscar mensagem temporária correspondente (mesmo texto e tempo próximo)
          const tempMessageIndex = prev.findIndex(m => 
            m.tempId && 
            m.message === data.message && 
            Math.abs(new Date(data.created_at).getTime() - new Date(m.created_at).getTime()) < 10000
          );
          
          if (tempMessageIndex !== -1) {
            // Substituir mensagem temporária pela real
            const newMessages = [...prev];
            newMessages[tempMessageIndex] = { ...data, status: 'sent' as const };
            return newMessages;
          }
          
          // Se não encontrou temporária, verificar se já existe
          const exists = prev.some(m => 
            m.id === data.id || 
            (!m.tempId && m.message === data.message && 
             m.sender_id === data.sender_id && 
             Math.abs(new Date(m.created_at).getTime() - new Date(data.created_at).getTime()) < 2000)
          );
          if (exists) return prev;
          
          // Adicionar nova mensagem
          return [...prev, { ...data, status: 'sent' as const }];
        }
        
        // Para mensagens recebidas, apenas verificar duplicatas
        const exists = prev.some(m => 
          m.id === data.id || 
          (m.message === data.message && 
           m.sender_id === data.sender_id && 
           Math.abs(new Date(m.created_at).getTime() - new Date(data.created_at).getTime()) < 1000)
        );
        if (exists) return prev;
        
        return [...prev, { ...data, status: 'sent' as const }];
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

  const handleSend = async (messageTextOrEvent?: string | any, messageId?: number | string) => {
    // Se for chamado do botão de enviar (event) ou reenvio (string)
    let textToSend: string;
    if (typeof messageTextOrEvent === 'string') {
      textToSend = messageTextOrEvent;
    } else {
      textToSend = inputText.trim();
    }
    
    if (!textToSend || !user) return;

    // Se for reenvio, não limpar o input
    if (typeof messageTextOrEvent !== 'string') {
      setInputText(""); // Clear immediately
    }

    // Optimistic update - adicionar mensagem imediatamente
    const tempId = messageId || `temp_${Date.now()}_${Math.random()}`;
    const tempMessage: Message = {
      id: tempId,
      message: textToSend,
      sender_id: Number(user.id),
      recipient_id: Number(contactId),
      created_at: new Date().toISOString(),
      status: 'sending',
      tempId: true,
    };

    // Adicionar mensagem imediatamente
    setMessages((prev) => {
      // Se for reenvio, remover a mensagem com erro anterior
      if (messageId) {
        return prev.map(m => 
          m.id === messageId 
            ? tempMessage 
            : m
        );
      }
      return [...prev, tempMessage];
    });

    // Scroll para o final
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      await api.sendMessage(Number(contactId), textToSend);
      
      // Se enviou com sucesso, a mensagem será atualizada pelo Pusher
      // Mas marcar como enviada imediatamente para feedback visual
      setMessages((prev) => 
        prev.map(m => 
          m.id === tempId 
            ? { ...m, status: 'sent' as const, tempId: false }
            : m
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Marcar mensagem como erro
      setMessages((prev) => 
        prev.map(m => 
          m.id === tempId 
            ? { ...m, status: 'error' as const }
            : m
        )
      );
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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatFullTime = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
    
    if (isToday) {
      return "Hoje";
    }
    
    if (isYesterday) {
      return "Ontem";
    }
    
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays < 7) {
      const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
      return days[date.getDay()];
    }
    
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
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
          keyExtractor={(item, index) => (item.id ? item.id.toString() : `msg-${index}`)}
          contentContainerStyle={[
            styles.messagesContainer,
            { 
              paddingTop: Spacing.lg, 
              paddingBottom: Spacing.md,
              backgroundColor: theme.backgroundRoot,
            },
          ]}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item, index }) => {
            const isSent = Number(item.sender_id) === Number(user?.id);
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
            
            const isSameSender = prevMessage && Number(prevMessage.sender_id) === Number(item.sender_id);
            const isSameSenderNext = nextMessage && Number(nextMessage.sender_id) === Number(item.sender_id);
            
            const timeDiff = prevMessage ? 
              new Date(item.created_at).getTime() - new Date(prevMessage.created_at).getTime() : 
              999999;
            const showTime = !prevMessage || timeDiff > 300000; // 5 minutos
            const showDateSeparator = !prevMessage || timeDiff > 3600000; // 1 hora
            
            const marginTop = isSameSender ? 2 : Spacing.xs + 2;
            
            return (
              <View key={item.id || index}>
                {showDateSeparator && (
                  <View style={styles.dateSeparator}>
                    <View style={[styles.dateLine, { backgroundColor: theme.backgroundTertiary }]} />
                    <ThemedText style={[styles.dateText, { color: theme.textSecondary }]}>
                      {formatFullTime(item.created_at)}
                    </ThemedText>
                    <View style={[styles.dateLine, { backgroundColor: theme.backgroundTertiary }]} />
                  </View>
                )}
                <View
                  style={[
                    styles.messageWrapper,
                    isSent ? styles.sentWrapper : styles.receivedWrapper,
                    { marginTop },
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      isSent
                        ? [
                            styles.sentBubble, 
                            { 
                              backgroundColor: item.status === 'error' ? "#FF3B30" : "#0095F6",
                              opacity: item.status === 'sending' ? 0.7 : 1,
                            }
                          ]
                        : [styles.receivedBubble, { backgroundColor: "#EFEFEF" }],
                      isSameSenderNext && styles.messageBubbleConsecutive,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.messageText,
                        { color: isSent ? "#FFFFFF" : "#000000" },
                      ]}
                    >
                      {item.message}
                    </ThemedText>
                  </View>
                  <View style={styles.messageFooter}>
                    {(showTime || !isSameSenderNext) && (
                      <ThemedText
                        style={[
                          styles.messageTime,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {formatTime(item.created_at)}
                      </ThemedText>
                    )}
                    {isSent && (
                      <View style={styles.messageStatus}>
                        {(item.status === 'sending' || item.status === undefined) && (
                          <Feather name="clock" size={12} color={theme.textSecondary} style={styles.statusIcon} />
                        )}
                        {(item.status === 'sent' || (!item.status && !item.tempId)) && (
                          <Feather name="check" size={12} color={theme.textSecondary} style={styles.statusIcon} />
                        )}
                        {item.status === 'error' && (
                          <Pressable
                            onPress={() => handleSend(item.message, item.id)}
                            style={styles.retryButton}
                          >
                            <Feather name="alert-circle" size={12} color="#FF3B30" style={styles.statusIcon} />
                            <ThemedText style={styles.retryText}>Tentar novamente</ThemedText>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />

        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={[styles.typingBubble, { backgroundColor: "#EFEFEF" }]}>
              <View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
              <View style={[styles.typingDot, styles.typingDotDelay1, { backgroundColor: theme.textSecondary }]} />
              <View style={[styles.typingDot, styles.typingDotDelay2, { backgroundColor: theme.textSecondary }]} />
            </View>
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
            {inputText.trim() && (
              <Pressable
                style={[
                  styles.sendButton,
                  { backgroundColor: "#0095F6" },
                ]}
                onPress={handleSend}
              >
                <Feather name="send" size={16} color="#FFFFFF" />
              </Pressable>
            )}
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
    paddingHorizontal: Spacing.md,
    flexGrow: 1,
  },
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  dateLine: {
    flex: 1,
    height: 1,
  },
  dateText: {
    fontSize: 11,
    marginHorizontal: Spacing.sm,
    fontWeight: "500",
  },
  messageWrapper: {
    marginBottom: Spacing.xs,
    maxWidth: "78%",
  },
  sentWrapper: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  receivedWrapper: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 4,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  messageBubbleConsecutive: {
    marginBottom: 2,
  },
  sentBubble: {
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    marginHorizontal: Spacing.xs + 2,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: "400",
    opacity: 0.6,
    marginRight: Spacing.xs,
  },
  messageStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    marginLeft: Spacing.xs / 2,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  retryText: {
    fontSize: 10,
    color: "#FF3B30",
    marginLeft: Spacing.xs / 2,
    fontWeight: "500",
  },
  inputContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    gap: Spacing.sm,
    minHeight: 44,
    maxHeight: 100,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === "ios" ? Spacing.xs : 4,
    maxHeight: 80,
    lineHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#0095F6",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  typingContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
    paddingLeft: Spacing.lg + Spacing.md,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    maxWidth: 60,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
    opacity: 0.4,
  },
  typingDotDelay1: {
    opacity: 0.6,
  },
  typingDotDelay2: {
    opacity: 0.8,
  },
});
