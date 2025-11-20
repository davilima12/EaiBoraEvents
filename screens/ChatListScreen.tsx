import React, { useState } from "react";
import { StyleSheet, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenFlatList } from "@/components/ScreenFlatList";
import { ChatPreviewCard } from "@/components/ChatPreviewCard";
import { EmptyState } from "@/components/EmptyState";
import { mockChats } from "@/utils/mockData";
import { Chat } from "@/types";
import { Spacing } from "@/constants/theme";

export default function ChatListScreen() {
  const navigation = useNavigation();
  const [chats, setChats] = useState<Chat[]>(mockChats);

  const handleChatPress = (chat: Chat) => {
    (navigation as any).navigate("ChatDetail", {
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
