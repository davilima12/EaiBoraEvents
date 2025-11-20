import React from "react";
import { View, StyleSheet, Pressable, Image, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Event } from "@/types";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - Spacing.xl * 2;

interface EventCardProps {
  event: Event;
  onPress: () => void;
  onLike: () => void;
  onSave: () => void;
}

export function EventCard({ event, onPress, onLike, onSave }: EventCardProps) {
  const { theme } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const firstMedia = event.media?.[0] || { type: "image", uri: event.images[0] };

  return (
    <Pressable
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      onPress={onPress}
      android_ripple={{ color: theme.primary + "20" }}
    >
      {firstMedia.type === "video" ? (
        <VideoPlayer
          uri={firstMedia.uri}
          thumbnail={firstMedia.thumbnail}
          style={styles.image}
        />
      ) : (
        <Image
          source={{ uri: firstMedia.uri }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.businessInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.avatarText}>
                {event.businessName[0]}
              </ThemedText>
            </View>
            <View style={styles.businessDetails}>
              <ThemedText style={styles.businessName}>
                {event.businessName}
              </ThemedText>
              <View style={styles.distanceContainer}>
                <Feather name="map-pin" size={12} color={theme.textSecondary} />
                <ThemedText style={[styles.distance, { color: theme.textSecondary }]}>
                  {event.distance.toFixed(1)} km
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        <ThemedText style={styles.title}>{event.title}</ThemedText>
        
        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.metadataText, { color: theme.textSecondary }]}>
              {formatDate(event.date)}
            </ThemedText>
          </View>
        </View>

        <ThemedText
          style={[styles.description, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {event.description}
        </ThemedText>

        <View style={styles.actions}>
          <Pressable
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onLike();
            }}
          >
            <Feather
              name="heart"
              size={20}
              color={event.isLiked ? theme.accent : theme.textSecondary}
              fill={event.isLiked ? theme.accent : "transparent"}
            />
            <ThemedText style={[styles.actionText, { color: theme.textSecondary }]}>
              {event.likes}
            </ThemedText>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onSave();
            }}
          >
            <Feather
              name="bookmark"
              size={20}
              color={event.isSaved ? theme.success : theme.textSecondary}
              fill={event.isSaved ? theme.success : "transparent"}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    alignSelf: "center",
  },
  image: {
    width: "100%",
    height: 240,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  businessInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  businessDetails: {
    flex: 1,
  },
  businessName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distance: {
    fontSize: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  metadata: {
    marginBottom: Spacing.sm,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metadataText: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
  },
});
