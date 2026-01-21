import React from "react";
import { View, StyleSheet, Pressable, Image, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Event } from "@/types";

interface EventThumbnailProps {
  event: Event;
  onPress: () => void;
  width?: number;
}

export function EventThumbnail({ event, onPress, width }: EventThumbnailProps) {
  const { theme } = useTheme();
  const screenWidth = Dimensions.get("window").width;
  // Calculate width considering padding (xl * 2) and gaps between items (sm * 2 for 3 items)
  const itemWidth = width || (screenWidth - Spacing.xl * 2 - Spacing.sm * 2) / 3;

  // Função auxiliar para detectar tipo de mídia pela extensão
  const detectMediaType = (uri: string): 'image' | 'video' => {
    const videoExtensions = ['.mov', '.mp4', '.avi', '.mkv', '.webm', '.m4v'];
    const lowerUri = uri.toLowerCase();
    return videoExtensions.some(ext => lowerUri.endsWith(ext)) ? 'video' : 'image';
  };

  // Pegar a primeira mídia disponível
  let thumbnailUri = null;
  let mediaType: 'image' | 'video' = 'image';

  // Primeiro tenta pegar de images
  if (event.images && event.images.length > 0) {
    thumbnailUri = event.images[0];
    // Detectar tipo pela extensão, pois images pode conter vídeos
    mediaType = detectMediaType(thumbnailUri);
  }

  // Se não tem images, pega de media (qualquer tipo)
  if (!thumbnailUri && event.media && event.media.length > 0) {
    const firstMedia = event.media[0];
    thumbnailUri = firstMedia.uri;
    mediaType = firstMedia.type || detectMediaType(thumbnailUri);
  }


  return (
    <Pressable
      style={[styles.container, { width: itemWidth, height: itemWidth }]}
      onPress={onPress}
    >
      {thumbnailUri ? (
        <>
          {mediaType === 'video' ? (
            <View style={styles.videoContainer} pointerEvents="none">
              <VideoPlayer
                uri={thumbnailUri}
                style={styles.media}
                shouldPlay={false}
                hideControls={true}
              />
              <View style={styles.videoIcon} pointerEvents="none">
                <Feather name="play" size={16} color="#FFFFFF" />
              </View>
            </View>
          ) : (
            <Image
              source={{ uri: thumbnailUri }}
              style={styles.media}
              resizeMode="cover"
              onError={(error) => {
                console.log('Error loading thumbnail:', thumbnailUri, error);
              }}
            />
          )}
          <View style={styles.overlay}>
            <View style={styles.info}>
              {event.likes > 0 && (
                <View style={styles.likeBadge}>
                  <Feather name="heart" size={12} color="#FFFFFF" />
                  <ThemedText style={styles.likeCount}>{event.likes}</ThemedText>
                </View>
              )}
            </View>
          </View>
        </>
      ) : (
        <View style={[styles.placeholder, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="image" size={24} color={theme.textSecondary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    backgroundColor: "#EFEFEF",
    position: "relative",
    zIndex: 0,
  },
  media: {
    width: "100%",
    height: "100%",
  },
  videoContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
    zIndex: 0,
  },
  videoIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: Spacing.xs,
  },
  info: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  likeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  likeCount: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
