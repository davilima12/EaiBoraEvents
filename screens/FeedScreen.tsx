import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, RefreshControl, FlatList, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { EventCard } from "@/components/EventCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { database } from "@/services/database";
import { api } from "@/services/api";
import { locationService } from "@/services/location";
import { Event, ApiPost, EventCategory } from "@/types";
import { Spacing } from "@/constants/theme";
import { useScreenInsets } from "@/hooks/useScreenInsets";

export default function FeedScreen() {
  const insets = useScreenInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!user) return;
    try {
      const cachedLocation = locationService.getCachedLocation();
      const location = cachedLocation || await locationService.getCurrentLocation();

      // Fetch posts from API
      const apiPosts = await api.getPosts();

      // Adapt API posts to Event type
      const adaptedEvents: Event[] = apiPosts.map((post) => {
        // Map photos/videos
        const media = post.photos.map(p => ({
          type: p.type,
          uri: p.path_photo
        }));

        // Extract image URIs for backward compatibility or specific image views
        const images = post.photos
          .filter(p => p.type === 'image')
          .map(p => p.path_photo);

        // Map category
        const categoryMap: Record<string, EventCategory> = {
          "Música": "music",
          "Gastronomia": "food",
          "Esportes": "sports",
          "Balada": "nightlife",
          "Arte": "art",
          "Networking": "networking",
          "Ar Livre": "outdoors",
          "Outros": "other"
        };
        const category = categoryMap[post.type_post.name] || "other";

        return {
          id: post.id.toString(),
          title: post.name,
          description: post.description || "",
          businessId: post.user.id.toString(),
          businessName: post.user.name,
          businessAvatar: post.user.user_profile_picture || undefined,
          images: images.length > 0 ? images : (media.length > 0 ? [media[0].uri] : []),
          media: media,
          date: post.start_event,
          location: {
            address: `${post.address}, ${post.number} - ${post.neighborhood}`,
            latitude: post.latitude || 0,
            longitude: post.longitude || 0,
          },
          category: category,
          likes: post.like_post.length,
          isLiked: post.like_post.some((like: any) => like.user_id === Number(user.id)),
          isSaved: false,
          distance: post.distance || 0,
          comments: post.comments_chained.map((c: any) => ({
            id: c.id.toString(),
            userId: c.user_id.toString(),
            userName: c.user.name,
            userAvatar: c.user.user_profile_picture,
            text: c.comment,
            timestamp: c.created_at
          })),
        };
      });

      setEvents(adaptedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }, [loadEvents]);

  const handleLike = async (eventId: string) => {
    if (!user) return;

    // Optimistic update
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
      // Revert optimistic update on error
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

  const handleEventPress = (eventId: string) => {
    (navigation as any).navigate("EventDetail", { eventId });
  };

  const handleComment = (eventId: string) => {
    (navigation as any).navigate("Comments", { eventId });
  };

  const handleBusinessPress = (businessId: string, businessName: string) => {
    (navigation as any).navigate("BusinessProfile", { businessId, businessName });
  };

  const handleCreateEvent = () => {
    (navigation as any).navigate("CreateEvent");
  };

  const [viewableItems, setViewableItems] = useState<any[]>([]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    setViewableItems(viewableItems);
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };

  if (events.length === 0) {
    return (
      <ScreenScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <EmptyState
          illustration={require("@/assets/images/illustrations/no_events_nearby_illustration.png")}
          title="Nenhum evento próximo"
          description="Não encontramos eventos na sua região. Tente expandir a distância de busca."
        />
        {user?.accountType === "business" ? (
          <FloatingActionButton onPress={handleCreateEvent} />
        ) : null}
      </ScreenScrollView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => handleEventPress(item.id)}
            onLike={() => handleLike(item.id)}
            onComment={() => handleComment(item.id)}
            onSave={() => handleSave(item.id)}
            onBusinessPress={() => handleBusinessPress(item.businessId, item.businessName)}
            isVisible={viewableItems.some(viewableItem => viewableItem.item.id === item.id)}
          />
        )}
        contentContainerStyle={{
          paddingTop: 100,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        showsVerticalScrollIndicator={false}
      />
      {user?.accountType === "business" ? (
        <FloatingActionButton onPress={handleCreateEvent} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: Spacing.xl,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
  },
});
