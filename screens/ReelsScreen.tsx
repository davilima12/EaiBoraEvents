import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, FlatList, Dimensions, ViewToken } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ReelCard } from "@/components/ReelCard";
import { useAuth } from "@/hooks/useAuth";
import { database } from "@/services/database";
import { locationService } from "@/services/location";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/services/api";
import { Event, EventCategory, ApiPost } from "@/types";

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
  timestamp: c.created_at
})),
          } as Event;
        })
        .filter((e): e is Event => e !== null);

setEvents(adaptedEvents);
    } catch (error) {
  console.error("Error loading reels:", error);
} finally {
  setLoading(false);
}
  };

const handleLike = async (eventId: string) => {
  if (!user) return;

  setEvents((prev) =>
    prev.map((event) => {
      if (event.id === eventId) {
        const isLiked = !event.isLiked;
        return {
          ...event,
          isLiked,
          likes: isLiked ? event.likes + 1 : event.likes - 1,
        };
      }
      return event;
    })
  );

  try {
    const event = events.find(e => e.id === eventId);
    if (event) {
      if (event.isLiked) {
        await api.unlikePost(Number(eventId));
      } else {
        await api.likePost(Number(eventId));
      }
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id === eventId) {
          const isLiked = !event.isLiked;
          return {
            ...event,
            isLiked,
            likes: isLiked ? event.likes + 1 : event.likes - 1,
          };
        }
        return event;
      })
    );
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

const handleBusinessPress = (businessId: string, businessName: string) => {
  (navigation as any).navigate("BusinessProfile", { businessId, businessName });
};

const handleEventPress = (eventId: string) => {
  (navigation as any).navigate("EventDetail", { eventId });
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
      onBusinessPress={() => handleBusinessPress(item.businessId, item.businessName)}
      onPress={() => handleEventPress(item.id)}
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
