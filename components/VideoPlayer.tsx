import React, { useState, useRef } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Video, ResizeMode } from "expo-video";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface VideoPlayerProps {
  uri: string;
  thumbnail?: string;
  style?: any;
}

export function VideoPlayer({ uri, thumbnail, style }: VideoPlayerProps) {
  const { theme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<any>(null);

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isLooping
        isMuted={true}
        onLoad={() => {
          setIsLoading(false);
          setIsPlaying(true);
        }}
      />
      
      {isLoading ? (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : null}
      
      <Pressable style={styles.playButton} onPress={togglePlayPause}>
        <View style={[styles.playButtonInner, { backgroundColor: "rgba(0, 0, 0, 0.6)" }]}>
          <Feather
            name={isPlaying ? "pause" : "play"}
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
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
