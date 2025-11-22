import React, { useState, useEffect } from "react";
import { View, StyleSheet, Image, Pressable, Dimensions, ActivityIndicator, Linking, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { database } from "@/services/database";
import { api } from "@/services/api";
import { Event, ApiPost, EventCategory } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";
import { VideoPlayer } from "@/components/VideoPlayer";
import { LoadingLogo } from "@/components/LoadingLogo";

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
        const post = await api.getPostById(Number(eventId));

        // Adapt API post to Event type
        // Map photos/videos
        const media = post.photos.map(p => ({
          type: p.type,
          uri: p.path_photo
        }));

        // Extract image URIs
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

        const adaptedEvent: Event = {
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

        setEvent(adaptedEvent);
      } catch (error) {
        console.error("Error loading event:", error);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId, user]);

  const handleToggleLike = async () => {
    if (!user || !eventId || !event) return;

    // Optimistic update
    const newIsLiked = !event.isLiked;
    setEvent({
      ...event,
      isLiked: newIsLiked,
      likes: newIsLiked ? event.likes + 1 : event.likes - 1,
    });

    try {
      if (event.isLiked) {
        await api.unlikePost(Number(eventId));
      } else {
        await api.likePost(Number(eventId));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update
      setEvent({
        ...event,
        isLiked: !newIsLiked,
        likes: !newIsLiked ? event.likes + 1 : event.likes - 1,
      });
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
        <LoadingLogo text="Carregando evento..." />
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

  const openMap = () => {
    if (!event) return;

    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${event.location.latitude},${event.location.longitude}`;
    const label = event.title;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    if (url) {
      Linking.openURL(url).catch(err => console.error('Error opening map:', err));
    }
  };

  return (
    <ScreenKeyboardAwareScrollView noPadding>
      {event.media && event.media.length > 0 && event.media[0].type === 'video' ? (
        <VideoPlayer
          uri={event.media[0].uri}
          style={styles.heroImage}
          shouldPlay={true}
        />
      ) : (
        <Image source={{ uri: event.images[0] }} style={styles.heroImage} />
      )}

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

          <Pressable style={styles.infoItem} onPress={openMap}>
            <View style={[styles.iconCircle, { backgroundColor: theme.secondary + "20" }]}>
              <Feather name="map-pin" size={20} color={theme.secondary} />
            </View>
            <View style={styles.infoText}>
              <ThemedText style={styles.infoLabel}>Localização</ThemedText>
              <ThemedText style={[styles.infoValue, { color: theme.textSecondary }]}>
                {event.location.address}
              </ThemedText>
              <ThemedText style={[styles.distance, { color: theme.textSecondary }]}>
                {event.distance.toFixed(1)} km de distância • Toque para abrir no mapa
              </ThemedText>
            </View>
            <Feather name="external-link" size={16} color={theme.textSecondary} style={{ alignSelf: 'center' }} />
          </Pressable>
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

        <Button onPress={() => { }}>Tenho Interesse</Button>
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
