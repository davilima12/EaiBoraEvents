import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, Pressable, Dimensions, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { database } from "@/services/database";
import { Event } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";

const { width } = Dimensions.get("window");

export default function EventDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { user } = useAuth();
  const eventId = (route.params as any)?.eventId;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      if (!user || !eventId) return;
      try {
        const data = await database.getEventById(eventId, user.id);
        setEvent(data);
      } catch (error) {
        console.error("Error loading event:", error);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId, user]);

  const handleToggleLike = async () => {
    if (!user || !eventId) return;
    try {
      const isLiked = await database.toggleLike(eventId, user.id);
      if (event) {
        setEvent({
          ...event,
          isLiked,
          likes: isLiked ? event.likes + 1 : event.likes - 1,
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleToggleSave = async () => {
    if (!user || !eventId) return;
    try {
      const isSaved = await database.toggleSave(eventId, user.id);
      if (event) {
        setEvent({ ...event, isSaved });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };


  if (loading) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText>Evento não encontrado</ThemedText>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <Image source={{ uri: event.images[0] }} style={styles.heroImage} />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.businessInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.avatarText}>
                {event.businessName[0]}
              </ThemedText>
            </View>
            <View style={styles.businessDetails}>
              <ThemedText style={styles.businessName}>
                {event.businessName}
              </ThemedText>
              <Pressable style={styles.followButton}>
                <ThemedText style={[styles.followText, { color: theme.primary }]}>
                  Seguir
                </ThemedText>
              </Pressable>
            </View>
          </View>
          <View style={styles.actions}>
            <Pressable onPress={handleToggleLike}>
              <Feather
                name="heart"
                size={24}
                color={event.isLiked ? theme.accent : theme.text}
                fill={event.isLiked ? theme.accent : "transparent"}
              />
            </Pressable>
            <Pressable onPress={handleToggleSave}>
              <Feather
                name="bookmark"
                size={24}
                color={event.isSaved ? theme.success : theme.text}
                fill={event.isSaved ? theme.success : "transparent"}
              />
            </Pressable>
            <Pressable>
              <Feather name="share-2" size={24} color={theme.text} />
            </Pressable>
          </View>
        </View>

        <ThemedText style={styles.title}>{event.title}</ThemedText>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="calendar" size={20} color={theme.primary} />
            </View>
            <View style={styles.infoText}>
              <ThemedText style={styles.infoLabel}>Data e Hora</ThemedText>
              <ThemedText style={[styles.infoValue, { color: theme.textSecondary }]}>
                {formatDate(event.date)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={[styles.iconCircle, { backgroundColor: theme.secondary + "20" }]}>
              <Feather name="map-pin" size={20} color={theme.secondary} />
            </View>
            <View style={styles.infoText}>
              <ThemedText style={styles.infoLabel}>Localização</ThemedText>
              <ThemedText style={[styles.infoValue, { color: theme.textSecondary }]}>
                {event.location.address}
              </ThemedText>
              <ThemedText style={[styles.distance, { color: theme.textSecondary }]}>
                {event.distance.toFixed(1)} km de distância
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.descriptionSection}>
          <ThemedText style={styles.sectionTitle}>Sobre o Evento</ThemedText>
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            {event.description}
          </ThemedText>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{event.likes}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Interessados
            </ThemedText>
          </View>
        </View>

        <Button onPress={() => {}}>Tenho Interesse</Button>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImage: {
    width,
    height: 300,
  },
  content: {
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  businessInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  businessDetails: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  followButton: {
    paddingVertical: 2,
  },
  followText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xl,
  },
  infoSection: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  infoItem: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
  },
  distance: {
    fontSize: 12,
    marginTop: 2,
  },
  descriptionSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  statsSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
});
