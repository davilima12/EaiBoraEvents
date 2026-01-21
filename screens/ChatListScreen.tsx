import React, { useState, useCallback, useMemo } from "react";
import { StyleSheet, View, TextInput, Animated, Pressable, Alert, Platform } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { ScreenFlatList } from "@/components/ScreenFlatList";
import { ChatPreviewCard } from "@/components/ChatPreviewCard";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { database } from "@/services/database";
import { api } from "@/services/api";
import { Chat } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function ChatListScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadChats = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getChats();
      // Adapt API response to Chat type
      // Assuming API returns a list of chats with contact info and last message
      console.log('chats', data)
      const adaptedChats: Chat[] = data.map((chat: any) => ({
        id: chat.id?.toString() || Math.random().toString(), // Use chat ID or generate one
        contactId: chat.contact_id?.toString() || chat.user_id?.toString(), // Adjust based on actual API response
        contactName: chat.contact_name || chat.name || "Usuário",
        contactAvatar: chat.contact_avatar || chat.user_profile_picture,
        lastMessage: chat.last_message || chat.message || "",
        lastMessageTime: chat.updated_at || chat.created_at || new Date().toISOString(),
        unreadCount: chat.unread_count || 0,
        timestamp: chat.updated_at || chat.created_at || new Date().toISOString(), // Add timestamp
        isBusinessContact: false, // Default to false or derive from data if available
      }));
      setChats(adaptedChats);
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  const handleChatPress = (chat: Chat) => {
    (navigation as any).navigate("ChatDetail", {
      chatId: chat.id,
      contactId: chat.contactId,
      contactName: chat.contactName,
    });
  };

  const handleDeleteChat = (chatId: string) => {
    Alert.alert(
      "Excluir conversa?",
      "Essa ação vai apagar o chat da caixa de entrada e o histórico de conversas.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await database.deleteChat(chatId);
              setChats((prev) => prev.filter((c) => c.id !== chatId));
            } catch (error) {
              console.error("Error deleting chat:", error);
            }
          },
        },
      ]
    );
  };

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    return chats.filter((c) =>
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chats, searchQuery]);

  const SearchHeader = () => (
    <View style={[styles.searchContainer, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="search" size={18} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Buscar"
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Feather name="x" size={18} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    chatId: string
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.rightActionsContainer}>
        <Pressable
          style={styles.deleteButton}
          onPress={() => handleDeleteChat(chatId)}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <Feather name="trash-2" size={24} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
      </View>
    );
  };

  if (chats.length === 0) {
    return (
      <>
        <SearchHeader />
        <EmptyState
          illustration={require("@/assets/images/illustrations/no_messages_illustration.png")}
          title="Nenhuma conversa"
          description="Comece a conversar com outras pessoas ou empresas sobre eventos."
        />
      </>
    );
  }

  return (
    <ScreenFlatList
      data={filteredChats}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={SearchHeader}
      ListEmptyComponent={
        searchQuery.trim() ? (
          <View style={styles.emptySearchContainer}>
            <ThemedText style={[styles.emptySearchText, { color: theme.textSecondary }]}>
              Nenhuma conversa encontrada
            </ThemedText>
          </View>
        ) : null
      }
      renderItem={({ item, index }) => (
        <View>
          <Swipeable
            renderRightActions={(progress, dragX) =>
              renderRightActions(progress, dragX, item.id)
            }
            containerStyle={styles.swipeableContainer}
          >
            <ChatPreviewCard
              chat={item}
              onPress={() => handleChatPress(item)}
              containerStyle={styles.chatCard}
            />
          </Swipeable>
          {index < filteredChats.length - 1 && (
            <View style={[styles.separator, { backgroundColor: theme.backgroundTertiary }]} />
          )}
        </View>
      )}
      contentContainerStyle={[
        styles.listContent,
        filteredChats.length === 0 && styles.listContentEmpty,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  emptySearchContainer: {
    paddingVertical: Spacing.xl * 2,
    alignItems: "center",
  },
  emptySearchText: {
    fontSize: 15,
    fontWeight: "400",
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 36,
    borderRadius: 10,
    gap: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  swipeableContainer: {
    backgroundColor: "transparent",
  },
  chatCard: {
    backgroundColor: "transparent",
    borderRadius: 0,
  },
  separator: {
    height: 0.5,
    marginLeft: 72,
  },
  rightActionsContainer: {
    width: 80,
    height: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingRight: Spacing.md,
  },
  deleteButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
