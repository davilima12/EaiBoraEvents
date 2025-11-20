import React, { useState, useCallback } from "react";
import { StyleSheet, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { EventCard } from "@/components/EventCard";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { mockEvents } from "@/utils/mockData";
import { Event } from "@/types";
import { Spacing } from "@/constants/theme";

export default function FeedScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleLike = (eventId: string) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? {
              ...event,
              isLiked: !event.isLiked,
              likes: event.isLiked ? event.likes - 1 : event.likes + 1,
            }
          : event
      )
    );
  };

  const handleSave = (eventId: string) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, isSaved: !event.isSaved } : event
      )
    );
  };

  const handleEventPress = (eventId: string) => {
    (navigation as any).navigate("EventDetail", { eventId });
  };

  const handleCreateEvent = () => {
    (navigation as any).navigate("CreateEvent");
  };

  if (events.length === 0) {
    return (
      <ScreenScrollView
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
        contentContainerStyle={styles.scrollContent}
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
            onSave={() => handleSave(event.id)}
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
  },
});
