import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Chat } from "@/types";

interface ChatPreviewCardProps {
  chat: Chat;
  onPress: () => void;
}

export function ChatPreviewCard({ chat, onPress }: ChatPreviewCardProps) {
  const { theme } = useTheme();

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <Pressable
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      onPress={onPress}
      android_ripple={{ color: theme.primary + "20" }}
    >
      <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
        <ThemedText style={styles.avatarText}>
          {chat.contactName[0]}
        </ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.name}>{chat.contactName}</ThemedText>
          <ThemedText style={[styles.timestamp, { color: theme.textSecondary }]}>
            {formatTimestamp(chat.timestamp)}
          </ThemedText>
        </View>

        <View style={styles.messageRow}>
          <ThemedText
            style={[
              styles.message,
              {
                color: chat.unreadCount > 0 ? theme.text : theme.textSecondary,
                fontWeight: chat.unreadCount > 0 ? "600" : "400",
              },
            ]}
            numberOfLines={1}
          >
            {chat.lastMessage}
          </ThemedText>
          {chat.unreadCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.badgeText}>{chat.unreadCount}</ThemedText>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: Spacing.lg,
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  message: {
    fontSize: 14,
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
