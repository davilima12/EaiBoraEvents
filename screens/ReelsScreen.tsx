import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, FlatList, Dimensions, ViewToken } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ReelCard } from "@/components/ReelCard";
import { useAuth } from "@/hooks/useAuth";
import { database } from "@/services/database";
import { Event } from "@/types";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";

const { height } = Dimensions.get("window");

export default function ReelsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReels();
  }, [user]);

  const loadReels = async () => {
    if (!user) return;
    try {
      const allEvents = await database.getEvents(user.id);
      const videoEvents = allEvents.filter((event: Event) =>
        event.media?.some((m: any) => m.type === "video")
      );
      setEvents(videoEvents);
    } catch (error) {
      console.error("Error loading reels:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (eventId: string) => {
    if (!user) return;
    try {
      const isLiked = await database.toggleLike(eventId, user.id);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? { ...event, isLiked, likes: isLiked ? event.likes + 1 : event.likes - 1 }
            : event
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSave = async (eventId: string) => {
    if (!user) return;
    try {
      const isSaved = await database.toggleSave(eventId, user.id);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, isSaved } : event
        )
      );
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleComment = (eventId: string) => {
    (navigation as any).navigate("Comments", { eventId });
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Event; index: number }) => (
      <ReelCard
        event={item}
        isActive={index === activeIndex}
        onLike={() => handleLike(item.id)}
        onComment={() => handleComment(item.id)}
        onSave={() => handleSave(item.id)}
      />
    ),
    [activeIndex]
  );

  const keyExtractor = useCallback((item: Event) => item.id, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText>Carregando reels...</ThemedText>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText style={styles.emptyText}>Nenhum vídeo disponível</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
});
