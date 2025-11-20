import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Event } from "@/types";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

interface ReelCardProps {
  event: Event;
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
  onSave: () => void;
  onBusinessPress?: () => void;
}

export function ReelCard({ event, isActive, onLike, onComment, onSave, onBusinessPress }: ReelCardProps) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  const videoMedia = event.media?.find((m) => m.type === "video");
  if (!videoMedia) return null;

  const player = useVideoPlayer(videoMedia.uri, (player) => {
    player.loop = true;
    player.muted = false;
    if (isActive) {
      player.play();
    }
  });

  useFocusEffect(
    React.useCallback(() => {
      setIsScreenFocused(true);
      if (player && isActive) {
        try {
          player.play();
        } catch (e) {
          console.warn('Erro ao dar play:', e);
        }
      }
      return () => {
        setIsScreenFocused(false);
        if (player) {
          try {
            player.pause();
          } catch (e) {
            console.warn('Erro ao pausar:', e);
          }
        }
      };
    }, [player, isActive])
  );

  useEffect(() => {
    if (player) {
      setIsLoading(false);
      if (isActive && isScreenFocused) {
        try {
          player.play();
        } catch (e) {
          console.warn('Erro ao dar play:', e);
        }
      } else {
        try {
          player.pause();
        } catch (e) {
          console.warn('Erro ao pausar:', e);
        }
      }
    }
  }, [isActive, player, isScreenFocused]);

  const togglePlayPause = () => {
    if (player) {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  const toggleMute = () => {
    if (player) {
      player.muted = !player.muted;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.videoContainer} onPress={togglePlayPause}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
        />
        
        {isLoading && (
          <View style={[styles.skeleton, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.skeletonShimmer} />
          </View>
        )}
      </Pressable>

      <View style={styles.overlay}>
        <View style={styles.rightActions}>
          <Pressable style={styles.actionButton} onPress={onLike}>
            <Feather
              name="heart"
              size={32}
              color={event.isLiked ? theme.accent : "#FFFFFF"}
              fill={event.isLiked ? theme.accent : "transparent"}
            />
            <ThemedText style={styles.actionText}>{event.likes}</ThemedText>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={onComment}>
            <Feather name="message-circle" size={32} color="#FFFFFF" />
            <ThemedText style={styles.actionText}>
              {event.comments?.length || 0}
            </ThemedText>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={onSave}>
            <Feather
              name="bookmark"
              size={32}
              color={event.isSaved ? theme.success : "#FFFFFF"}
              fill={event.isSaved ? theme.success : "transparent"}
            />
          </Pressable>

          <Pressable style={styles.actionButton} onPress={toggleMute}>
            <Feather
              name={player?.muted ? "volume-x" : "volume-2"}
              size={32}
              color="#FFFFFF"
            />
          </Pressable>
        </View>

        <View style={styles.bottomInfo}>
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
            <ThemedText style={styles.businessName}>
              {event.businessName}
            </ThemedText>
          </Pressable>

          <ThemedText style={styles.title} numberOfLines={2}>
            {event.title}
          </ThemedText>

          <View style={styles.metadata}>
            <Feather name="calendar" size={14} color="#FFFFFF" />
            <ThemedText style={styles.metadataText}>
              {formatDate(event.date)}
            </ThemedText>
            <Feather name="map-pin" size={14} color="#FFFFFF" />
            <ThemedText style={styles.metadataText}>
              {event.distance.toFixed(1)} km
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height,
    position: "relative",
  },
  videoContainer: {
    width: "100%",
    height: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  skeleton: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  skeletonShimmer: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    pointerEvents: "box-none",
  },
  rightActions: {
    position: "absolute",
    right: Spacing.lg,
    bottom: 120,
    gap: Spacing.xl,
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomInfo: {
    position: "absolute",
    bottom: 120, // antes era 40, agora mais acima
    left: Spacing.lg,
    right: 80,
    gap: Spacing.sm,
  },
  businessInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  businessName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metadataText: {
    fontSize: 12,
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
