import React from "react";
import { View, StyleSheet, Pressable, Image, Dimensions, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Event } from "@/types";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - Spacing.md * 2; // aumenta largura do card

interface EventCardProps {
  event: Event;
  onPress: () => void;
  onLike: () => void;
  onSave: () => void;
  onComment: () => void;
  onBusinessPress?: () => void;
  onVideoPress?: () => void;
  isVisible?: boolean;
}

export function EventCard({ event, onPress, onLike, onSave, onComment, onBusinessPress, onVideoPress, isVisible = true }: EventCardProps) {
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

  const [activeIndex, setActiveIndex] = React.useState(0);

  const mediaItems = event.media && event.media.length > 0
    ? event.media
    : event.images.map(uri => ({ type: "image", uri } as const));

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveIndex(roundIndex);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
      <View style={styles.mediaContainer}>
        <FlatList
          data={mediaItems}
          keyExtractor={(item, index) => `${item.uri}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => (
            <View style={{ width: CARD_WIDTH, height: 500 }}>
              {item.type === "video" ? (
                <Pressable onPress={onVideoPress} style={styles.mediaItem}>
                  <VideoPlayer
                    uri={item.uri}
                    thumbnail={item.thumbnail}
                    style={{ width: "100%", height: "100%" }}
                    shouldPlay={isVisible && index === activeIndex}
                  />
                </Pressable>
              ) : (
                <Image
                  source={{ uri: item.uri }}
                  style={styles.mediaItem}
                  resizeMode="cover"
                />
              )}
            </View>
          )}
        />
        {mediaItems.length > 1 && (
          <View style={styles.paginationCounter}>
            <ThemedText style={styles.paginationCounterText}>
              {activeIndex + 1}/{mediaItems.length}
            </ThemedText>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable
            style={styles.businessInfo}
            onPress={(e) => {
              e.stopPropagation();
              onBusinessPress?.();
            }}
          >
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
          </Pressable>
        </View>
        <Pressable onPress={onPress} style={{ marginBottom: Spacing.md }}>
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
        </Pressable>
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
              onComment();
            }}
          >
            <Feather
              name="message-circle"
              size={20}
              color={theme.textSecondary}
            />
            <ThemedText style={[styles.actionText, { color: theme.textSecondary }]}>
              {event.comments?.length || 0}
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
    </View>
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
  mediaContainer: {
    position: "relative",
    width: CARD_WIDTH,
    height: 500,
  },
  mediaItem: {
    width: CARD_WIDTH,
    height: 500,
  },
  paginationCounter: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  paginationCounterText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
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
