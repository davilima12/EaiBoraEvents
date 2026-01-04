import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { EventCard } from "@/components/EventCard";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { database } from "@/services/database";
import { Event } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { api } from "@/services/api";

type BusinessProfileScreenRouteProp = RouteProp<
  { BusinessProfile: { businessId: string; businessName: string } },
  "BusinessProfile"
>;

export default function BusinessProfileScreen() {
  const route = useRoute<BusinessProfileScreenRouteProp>();
  const { businessId, businessName } = route.params;
  const { theme } = useTheme();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const loadBusinessEvents = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await database.getEventsByBusinessId(businessId, user.id);
      setEvents(data);
    } catch (error) {
      console.error("Error loading business events:", error);
    } finally {
      setLoading(false);
    }
  }, [businessId, user]);

  useFocusEffect(
    useCallback(() => {
      loadBusinessEvents();
    }, [loadBusinessEvents])
    }, [loadBusinessEvents])
  );

useEffect(() => {
  if (user && user.following) {
    const isAlreadyFollowing = user.following.some((u: any) => u.id === Number(businessId));
    setIsFollowing(isAlreadyFollowing);
  }
}, [user, businessId]);

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

const handleFollow = async () => {
  try {
    setIsFollowing((prev) => !prev);
    await api.followUser(Number(businessId));
  } catch (error) {
    console.error("Error toggling follow:", error);
    setIsFollowing((prev) => !prev);
  }
};

const handleEventPress = (event: Event) => {
  // Navigate to event details if needed
};

const handleComment = (event: Event) => {
  // Navigate to comments modal if needed
};

return (
  <ScreenScrollView>
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.avatarText}>
            {businessName[0]}
          </ThemedText>
        </View>
        <ThemedText style={styles.businessName}>{businessName}</ThemedText>

        {user && user.id.toString() !== businessId && (
          <Pressable
            style={styles.followButton}
            onPress={handleFollow}
          >
            <ThemedText style={[styles.followText, { color: theme.primary }]}>
              {isFollowing ? "Deixar de seguir" : "Seguir"}
            </ThemedText>
          </Pressable>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <ThemedText style={styles.statNumber}>{events.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Eventos
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <ThemedText style={styles.sectionTitle}>Eventos Publicados</ThemedText>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: theme.textSecondary }}>
            Carregando...
          </ThemedText>
        </View>
      ) : events.length === 0 ? (
        <EmptyState
          illustration={require("@/assets/images/illustrations/no_events_nearby_illustration.png")}
          title="Nenhum evento"
          description="Esta empresa ainda não publicou eventos."
        />
      ) : (
        <View style={styles.eventsContainer}>
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => handleEventPress(event)}
              onLike={() => handleLike(event.id)}
              onSave={() => handleSave(event.id)}
              onComment={() => handleComment(event)}
            />
          ))}
        </View>
      )}
    </ThemedView>
  </ScreenScrollView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  businessName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: Spacing.lg,
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  eventsContainer: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  followButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "transparent", // Or theme.primary if needed
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
