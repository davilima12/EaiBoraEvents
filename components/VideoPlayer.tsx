import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Dimensions } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useFocusEffect } from "@react-navigation/native";

const screenHeight = Dimensions.get("window").height;

interface VideoPlayerProps {
  uri: string;
  thumbnail?: string;
  style?: any;
}

export function VideoPlayer({ uri, thumbnail, style }: VideoPlayerProps) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isScreenFocused, setIsScreenFocused] = useState(true); // Novo estado para foco da tela
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = false;
  });

  const videoRef = useRef<View>(null);

  useEffect(() => {
    if (player) {
      setIsLoading(false);
    }
  }, [player]);

  const checkVisibility = () => {
    if (!isScreenFocused) return; // Verificar se a tela está focada antes de continuar

    if (videoRef.current) {
      videoRef.current.measure((x, y, width, height, pageX, pageY) => {
        const isVisible = pageY >= 0 && pageY + height <= screenHeight;
        if (player) {
          if (isVisible) {
            player.play();
          } else {
            player.pause();
          }
        }
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(checkVisibility, 500);
    return () => clearInterval(interval);
  }, [isScreenFocused]); // Adicionar dependência do foco da tela

  useFocusEffect(
    React.useCallback(() => {
      console.log("Screen focused: Playing video");
      setIsScreenFocused(true); // Atualizar estado quando a tela ganha foco
      if (player) {
        player.play();
      }

      return () => {
        console.log("Screen unfocused: Pausing video");
        setIsScreenFocused(false); // Atualizar estado quando a tela perde foco
        if (player) {
          player.pause();
        }
      };
    }, [player])
  );

  return (
    <View ref={videoRef} style={[styles.container, style]}>
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
});
