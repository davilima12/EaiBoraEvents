import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface VideoPlayerProps {
  uri: string;
  thumbnail?: string;
  style?: any;
}

export function VideoPlayer({ uri, thumbnail, style }: VideoPlayerProps) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    if (player) {
      setIsLoading(false);
    }
  }, [player]);

  const togglePlayPause = () => {
    if (player) {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />
      
      {isLoading ? (
        <View style={[styles.skeleton, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.skeletonShimmer} />
        </View>
      ) : null}
      
      <Pressable style={styles.playButton} onPress={togglePlayPause}>
        <View style={[styles.playButtonInner, { backgroundColor: "rgba(0, 0, 0, 0.6)" }]}>
          <Feather
            name={player?.playing ? "pause" : "play"}
            size={32}
            color="#FFFFFF"
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
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
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -32 }, { translateY: -32 }],
  },
  playButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
});
