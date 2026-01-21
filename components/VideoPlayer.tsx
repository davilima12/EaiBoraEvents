import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Dimensions, PanResponder } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useFocusEffect } from "@react-navigation/native";

const screenHeight = Dimensions.get("window").height;

interface VideoPlayerProps {
  uri: string;
  thumbnail?: string;
  style?: any;
  shouldPlay?: boolean;
  hideControls?: boolean;
}

export function VideoPlayer({ uri, thumbnail, style, shouldPlay = true, hideControls = false }: VideoPlayerProps) {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isPausedManually, setIsPausedManually] = useState(false);
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = false;
  });

  const videoRef = useRef<View>(null);
  const progressBarRef = useRef<View>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

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

  // Control playback based on shouldPlay, screen focus, and manual pause
  useEffect(() => {
    if (!player) return;

    if (shouldPlay && isScreenFocused && !isPausedManually) {
      player.play();
    } else {
      try {
        player.pause();
      } catch (e) {
        console.warn('Erro ao pausar:', e);
      }
    }
  }, [shouldPlay, isScreenFocused, isPausedManually, player]);

  useFocusEffect(
    React.useCallback(() => {
      console.log("Screen focused: Playing video");
      setIsScreenFocused(true);

      return () => {
        console.log("Screen unfocused: Pausing video");
        setIsScreenFocused(false);
      };
    }, [])
  );

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

  const handleScreenPress = () => {
    setShowControls(!showControls);

    // Auto-hide controls after 3 seconds
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
          setIsPausedManually(true);
        } catch (e) {
          console.warn('Erro ao pausar:', e);
        }
      } else {
        player.play();
        setIsPausedManually(false);
      }
    }
  };

  const toggleMute = () => {
    if (player) {
      player.muted = !player.muted;
      setIsMuted(player.muted);
    }
  };

  return (
    <View ref={videoRef} style={[styles.container, style]}>
      <Pressable 
        style={styles.videoContainer} 
        onPress={handleScreenPress}
        onLongPress={() => {}} // Desabilita menu de contexto
      >
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
        {isLoading ? (
          <View style={[styles.skeleton, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.skeletonShimmer} />
          </View>
        ) : null}
      </Pressable>

      {/* Interactive Progress bar with drag support */}
      {!hideControls && (
        <View
          ref={progressBarRef}
          style={styles.progressBarContainer}
          {...panResponder.panHandlers}
        >
          <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: theme.primary }]} />
        </View>
      )}

      {/* Controls overlay - shows on tap */}
      {!hideControls && showControls && (
        <View style={styles.controlsOverlay}>
          {/* Play/Pause button - center */}
          <View style={styles.centerControls}>
            <Pressable 
              style={styles.playPauseButton} 
              onPress={togglePlayPause}
            >
              <View style={styles.playPauseIconContainer}>
                <Feather
                  name={player?.playing ? "pause" : "play"}
                  size={32}
                  color="#FFFFFF"
                />
              </View>
            </Pressable>

            {/* Mute button - below play/pause */}
            <Pressable 
              style={styles.muteButton} 
              onPress={toggleMute}
            >
              <View style={styles.muteButtonContainer}>
                <Feather
                  name={isMuted ? "volume-x" : "volume-2"}
                  size={20}
                  color="#FFFFFF"
                />
              </View>
            </Pressable>
          </View>
        </View>
      )}
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
  progressBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  progressBar: {
    height: "100%",
  },
  muteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  muteButtonContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  mutedIndicator: {
    position: "absolute",
    bottom: -4,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  videoContainer: {
    width: "100%",
    height: "100%",
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    pointerEvents: "box-none",
    justifyContent: "center",
    alignItems: "center",
  },
  centerControls: {
    alignItems: "center",
    gap: 20,
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  playPauseIconContainer: {
    marginLeft: 4, // Slight offset for play icon to appear centered
    justifyContent: "center",
    alignItems: "center",
  },
});
