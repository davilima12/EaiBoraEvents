import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, RefreshControl } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { EventCard } from "@/components/EventCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { database } from "@/services/database";
import { locationService } from "@/services/location";
import { Event } from "@/types";
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
      
      const data = await database.getEvents(
        user.id,
        location?.latitude,
        location?.longitude
      );
      
      if (location && !cachedLocation) {
        await database.updateUserLocation(user.id, location.latitude, location.longitude);
      }
      
      setEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
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
    try {
      const isLiked = await database.toggleLike(eventId, user.id);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId
            ? {
                ...event,
                isLiked,
                likes: isLiked ? event.likes + 1 : event.likes - 1,
              }
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
    <>
      <ScreenScrollView
        showsVerticalScrollIndicator={false}
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
      >
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => handleEventPress(event.id)}
            onLike={() => handleLike(event.id)}
            onComment={() => handleComment(event.id)}
            onSave={() => handleSave(event.id)}
            onBusinessPress={() => handleBusinessPress(event.businessId, event.businessName)}
          />
        ))}
      </ScreenScrollView>
      {user?.accountType === "business" ? (
        <FloatingActionButton onPress={handleCreateEvent} />
      ) : null}
    </>
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
