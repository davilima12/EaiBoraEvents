import React, { useState, useCallback } from "react";
import { StyleSheet, FlatList } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ScreenFlatList } from "@/components/ScreenFlatList";
import { ChatPreviewCard } from "@/components/ChatPreviewCard";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { database } from "@/services/database";
import { Chat } from "@/types";
import { Spacing } from "@/constants/theme";

export default function ChatListScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);

  const loadChats = useCallback(async () => {
    if (!user) return;
    try {
      const data = await database.getChats(user.id);
      setChats(data);
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

  if (chats.length === 0) {
    return (
      <EmptyState
        illustration={require("@/assets/images/illustrations/no_messages_illustration.png")}
        title="Nenhuma conversa"
        description="Comece a conversar com outras pessoas ou empresas sobre eventos."
      />
    );
  }

  return (
    <ScreenFlatList
      data={chats}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ChatPreviewCard chat={item} onPress={() => handleChatPress(item)} />
      )}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: Spacing.sm,
  },
});
