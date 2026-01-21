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
      
      // Mesclar com mensagens existentes, preservando temporárias que ainda não foram confirmadas
      setMessages((prev) => {
        // Identificar mensagens temporárias que ainda não foram confirmadas
        const tempMessages = prev.filter(m => m.tempId);
        
        // Se não há temporárias, apenas usar os dados do servidor
        if (tempMessages.length === 0) {
          return data;
        }
        
        // Mesclar: usar dados do servidor, mas adicionar temporárias não confirmadas
        const serverIds = new Set(data.map((m: Message) => String(m.id)));
        const unconfirmedTemps = tempMessages.filter(temp => {
          // Verificar se já existe mensagem real correspondente
          const exists = data.some((m: Message) => {
            const tempMsg = (temp.message || '').trim();
            const realMsg = (m.message || '').trim();
            return (
              tempMsg === realMsg &&
              Number(temp.sender_id) === Number(m.sender_id) &&
              Math.abs(new Date(temp.created_at).getTime() - new Date(m.created_at).getTime()) < 30000
            );
          });
          return !exists;
        });
        
        // Retornar dados do servidor + temporárias não confirmadas, ordenadas por data
        const merged = [...data, ...unconfirmedTemps].sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        return merged;
      });
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, [user, contactId]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages])
  );

  // Scroll para o início quando as mensagens são carregadas
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 100);
    }
  }, [messages.length]);

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
        
        // Verificar duplicatas PRIMEIRO antes de processar
        // Verificar por ID exato
        if (data.id && prev.some(m => String(m.id) === String(data.id) && !m.tempId)) {
          return prev; // Já existe, não adicionar
        }
        
        // Se é uma mensagem enviada pelo usuário atual, substituir mensagem temporária
        if (Number(data.sender_id) === Number(user?.id)) {
          // Buscar mensagem temporária correspondente (mesmo texto e sender)
          const tempMessageIndex = prev.findIndex(m => {
            if (!m.tempId || Number(m.sender_id) !== Number(data.sender_id)) return false;
            
            // Comparar mensagens normalizadas
            const tempMsg = (m.message || '').trim();
            const newMsg = (data.message || '').trim();
            
            if (tempMsg !== newMsg) return false;
            
            // Verificar se foi enviada há menos de 20 segundos (janela de tempo maior)
            const timeDiff = Math.abs(
              new Date(data.created_at).getTime() - new Date(m.created_at).getTime()
            );
            return timeDiff < 20000;
          });
          
          if (tempMessageIndex !== -1) {
            // Substituir mensagem temporária pela real
            return prev.map((m, index) => {
              if (index === tempMessageIndex) {
                return { ...data, status: 'sent' as const, tempId: false };
              }
              // Remover outras temporárias duplicadas do mesmo texto
              if (m.tempId && 
                  Number(m.sender_id) === Number(data.sender_id) &&
                  (m.message || '').trim() === (data.message || '').trim() &&
                  index !== tempMessageIndex) {
                return null; // Marcar para remoção
              }
              return m;
            }).filter(m => m !== null) as Message[];
          }
          
          // Se não encontrou temporária, verificar se já existe mensagem real (evitar duplicatas)
          const existsReal = prev.some(m => {
            if (m.tempId) return false; // Ignorar temporárias
            
            // Verificar por ID ou por conteúdo e tempo muito próximo
            if (String(m.id) === String(data.id)) return true;
            
            // Comparar mensagens normalizadas
            const existingMsg = (m.message || '').trim();
            const newMsg = (data.message || '').trim();
            
            if (existingMsg !== newMsg) return false;
            
            // Se o remetente é o mesmo e a mensagem foi enviada há menos de 5 segundos, é duplicata
            return (
              Number(m.sender_id) === Number(data.sender_id) && 
              Math.abs(new Date(m.created_at).getTime() - new Date(data.created_at).getTime()) < 5000
            );
          });
          
          if (existsReal) return prev;
          
          // Se não encontrou temporária nem mensagem real correspondente, adicionar a mensagem real
          return [...prev, { ...data, status: 'sent' as const, tempId: false }];
        }
        
        // Para mensagens recebidas, verificar duplicatas
        const existsReceived = prev.some(m => {
          if (m.tempId) return false; // Ignorar temporárias
          
          // Verificar por ID exato
          if (String(m.id) === String(data.id)) return true;
          
          // Verificar por conteúdo e tempo muito próximo
          if (m.message === data.message && 
              Number(m.sender_id) === Number(data.sender_id) && 
              Math.abs(new Date(m.created_at).getTime() - new Date(data.created_at).getTime()) < 2000) {
            return true;
          }
          
          return false;
        });
        
        if (existsReceived) return prev;
        
        return [...prev, { ...data, status: 'sent' as const, tempId: false }];
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
      // Se for reenvio, substituir a mensagem com erro anterior
      if (messageId) {
        return prev.map(m => 
          m.id === messageId 
            ? tempMessage 
            : m
        );
      }
      
      // Verificar se já não existe uma mensagem temporária igual (evitar duplicatas)
      const alreadyExists = prev.some(m => 
        m.tempId && 
        m.message === textToSend && 
        m.sender_id === tempMessage.sender_id &&
        Math.abs(new Date(m.created_at).getTime() - new Date(tempMessage.created_at).getTime()) < 1000
      );
      
      if (alreadyExists) {
        return prev; // Não adicionar se já existe uma temporária igual
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
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
            }
          }}
          onLayout={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
            }
          }}
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
                    {showTime && (
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
                        {item.status === 'sending' && (
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
