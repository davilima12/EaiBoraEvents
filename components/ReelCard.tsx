import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, Dimensions, PanResponder, FlatList, ViewToken } from "react-native";
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
  onPress?: () => void;
}

const ReelVideoItem = ({ uri, shouldPlay, onScreenPress }: { uri: string; shouldPlay: boolean; onScreenPress: () => void }) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const progressBarRef = useRef<View>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = false;
  });

  useEffect(() => {
    if (player) {
      if (shouldPlay) {
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
  }, [shouldPlay, player]);

  useEffect(() => {
    if (player) {
      setIsLoading(false);
    }
  }, [player]);

  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      if (player.currentTime && player.duration) {
        const progressPercent = (player.currentTime / player.duration) * 100;
        setProgress(progressPercent);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player]);

  const handleScreenPress = () => {
    setShowControls(!showControls);
    onScreenPress();

    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }

    if (!showControls) {
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const togglePlayPause = () => {
    if (player) {
      if (player.playing) {
        try {
          player.pause();
        } catch (e) {
          console.warn('Erro ao pausar:', e);
        }
      } else {
        player.play();
      }
    }
  };

  const toggleMute = () => {
    if (player) {
      player.muted = !player.muted;
      setIsMuted(player.muted);
    }
  };

  const handleProgressChange = (locationX: number) => {
    if (!player || !player.duration || !progressBarRef.current) return;

    progressBarRef.current.measure((x, y, width) => {
      const percentage = Math.max(0, Math.min(1, locationX / width));
      const newTime = percentage * player.duration;
      player.currentTime = newTime;
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleProgressChange(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        handleProgressChange(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        // Optional: handle release
      },
    })
  ).current;

  return (
    <View style={styles.videoItemContainer}>
      <Pressable style={styles.videoContainer} onPress={handleScreenPress}>
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

      {showControls && (
        <View style={styles.controlsOverlay}>
          <Pressable style={styles.playPauseButton} onPress={togglePlayPause}>
            <Feather
              name={player?.playing ? "pause" : "play"}
              size={48}
              color="#FFFFFF"
            />
          </Pressable>

          <View style={styles.controlsBottom}>
            <View
              ref={progressBarRef}
              style={styles.progressBarContainer}
              {...panResponder.panHandlers}
            >
              <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: theme.primary }]} />
            </View>
          </View>
        </View>
      )}

      {showControls && (
        <Pressable style={styles.muteButtonOverlay} onPress={toggleMute}>
          <View style={styles.muteButtonContainer}>
            <Feather
              name={isMuted ? "volume-x" : "volume-2"}
              size={32}
              color="#FFFFFF"
            />
          </View>
        </Pressable>
      )}
    </View>
  );
};

export function ReelCard({ event, isActive, onLike, onComment, onSave, onBusinessPress, onPress }: ReelCardProps) {
  const { theme } = useTheme();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);

  // Filter only videos
  const videos = event.media?.filter((m) => m.type === "video") || [];

  useFocusEffect(
    React.useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveVideoIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });
  };

  if (videos.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={videos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${event.id}-video-${index}`}
        renderItem={({ item, index }) => (
          <ReelVideoItem
            uri={item.uri}
            shouldPlay={isActive && isScreenFocused && index === activeVideoIndex}
            onScreenPress={() => { }}
          />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={{ width, height }}
      />

      {/* Pagination Counter */}
      {videos.length > 1 && (
        <View style={styles.paginationCounterContainer}>
          <ThemedText style={styles.paginationCounterText}>
            {activeVideoIndex + 1}/{videos.length}
          </ThemedText>
        </View>
      )}

      <View style={styles.overlay} pointerEvents="box-none">
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

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onPress?.();
            }}
          >
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
          </Pressable>
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
    backgroundColor: "black",
  },
  videoItemContainer: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
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
    bottom: 130,
    gap: Spacing.xl,
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    gap: 4,

    borderRadius: 30,

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
    bottom: 120,
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
  muteButtonContainer: {
    position: "relative",
  },
  muteButtonOverlay: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 30,
    padding: 8,
  },
  mutedIndicator: {
    position: "absolute",
    bottom: -4,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  playPauseButton: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 40,
    padding: 16,
  },
  controlsBottom: {
    position: "absolute",
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 6,
  },
  progressBar: {
    height: "100%",
    borderRadius: 6,
  },
  paginationCounterContainer: {
    position: "absolute",
    top: 60,
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
});
