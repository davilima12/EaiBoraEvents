import React from "react";
import { View, StyleSheet, Pressable, Platform, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Chat } from "@/types";

interface ChatPreviewCardProps {
  chat: Chat;
  onPress: () => void;
  containerStyle?: any;
}

export function ChatPreviewCard({ chat, onPress, containerStyle }: ChatPreviewCardProps) {
  const { theme } = useTheme();

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const hasUnread = chat.unreadCount > 0;

  return (
    <Pressable
      style={[styles.container, { backgroundColor: theme.backgroundRoot }, containerStyle]}
      onPress={onPress}
      android_ripple={{ color: theme.primary + "10" }}
    >
      <View style={styles.avatarContainer}>
        {chat.contactAvatar ? (
          <Image
            source={{ uri: chat.contactAvatar }}
            style={styles.avatarImage}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.avatarText}>
              {chat.contactName[0]?.toUpperCase() || "?"}
            </ThemedText>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText 
            style={[
              styles.name, 
              { 
                color: hasUnread ? theme.text : theme.text,
                fontWeight: hasUnread ? "600" : "400",
              }
            ]}
            numberOfLines={1}
          >
            {chat.contactName}
          </ThemedText>
          <ThemedText 
            style={[
              styles.timestamp, 
              { 
                color: theme.textSecondary,
                fontWeight: hasUnread ? "600" : "400",
              }
            ]}
          >
            {formatTimestamp(chat.lastMessageTime || chat.timestamp)}
          </ThemedText>
        </View>

        <View style={styles.messageRow}>
          <ThemedText
            style={[
              styles.message,
              {
                color: hasUnread ? theme.text : theme.textSecondary,
                fontWeight: hasUnread ? "500" : "400",
              },
            ]}
            numberOfLines={1}
          >
            {chat.lastMessage || "Sem mensagens"}
          </ThemedText>
          {hasUnread && (
            <View style={[styles.badge, { backgroundColor: "#0095F6" }]}>
              <ThemedText style={styles.badgeText}>
                {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 2,
    alignItems: "center",
    minHeight: 72,
  },
  avatarContainer: {
    position: "relative",
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EFEFEF",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    flex: 1,
    marginRight: Spacing.sm,
  },
  timestamp: {
    fontSize: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  message: {
    fontSize: 14,
    flex: 1,
    lineHeight: 18,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: "#0095F6",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});
