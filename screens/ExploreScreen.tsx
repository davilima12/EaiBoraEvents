import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, TextInput, ScrollView, FlatList, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { CategoryChip } from "@/components/CategoryChip";
import { LoadingLogo } from "@/components/LoadingLogo";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { locationService } from "@/services/location";
import { api } from "@/services/api";
import { EVENT_CATEGORIES, EventCategory, Event, ApiPost } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function ExploreScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [maxDistance, setMaxDistance] = useState(10);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const loadEvents = useCallback(async (searchTerm?: string, categoryId?: EventCategory) => {
    if (!user) return;
    setLoading(true);
    try {
      const cachedLocation = locationService.getCachedLocation();
      const location = cachedLocation || await locationService.getCurrentLocation();

      // Map category to type_post_id
      const categoryToTypePostId: Record<EventCategory, number> = {
        "music": 1,
        "food": 2,
        "sports": 3,
        "nightlife": 4,
        "art": 5,
        "networking": 6,
        "outdoors": 7,
        "other": 8
      };

      const typePostId = categoryId ? categoryToTypePostId[categoryId] : undefined;

      const apiPosts = await api.getPosts(
        location?.latitude,
        location?.longitude,
        searchTerm,
        typePostId
      );

      const adaptedEvents: Event[] = apiPosts.map((post: ApiPost) => {
        const media = post.photos.map((p: any) => ({
          type: p.type,
          uri: p.path_photo
        }));

        const images = post.photos
          .filter(p => p.type === 'image')
          .map(p => p.path_photo);

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

        let calculatedDistance = post.distance || 0;
        if (location && post.latitude && post.longitude) {
          calculatedDistance = locationService.calculateDistance(
            location.latitude,
            location.longitude,
            post.latitude,
            post.longitude
          );
        }

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
          distance: calculatedDistance,
          comments: [],
        };
      });

      setAllEvents(adaptedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      loadEvents(searchQuery || undefined, selectedCategory || undefined);
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, selectedCategory, loadEvents]);

  useFocusEffect(
    useCallback(() => {
      loadEvents(searchQuery || undefined, selectedCategory || undefined);
    }, [])
  );

  const filteredEvents = allEvents.filter((event) => {
    const matchesDistance = event.distance <= maxDistance;
    return matchesDistance;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <LoadingLogo />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchSection, { paddingTop: Spacing.xl }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Buscar eventos..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {EVENT_CATEGORIES.map((category) => (
          <CategoryChip
            key={category.id}
            category={category}
            isSelected={selectedCategory === category.id}
            onPress={() =>
              setSelectedCategory(selectedCategory === category.id ? null : category.id)
            }
          />
        ))}
      </ScrollView>

      <FlatList
        showsVerticalScrollIndicator={false}
        data={filteredEvents}
        numColumns={2}
        style={{ marginTop: -300 }}
        contentContainerStyle={[
          styles.gridContainer,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        columnWrapperStyle={styles.row}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.gridItem, { backgroundColor: theme.backgroundDefault }]}
            onPress={() => (navigation as any).navigate("EventDetail", { eventId: item.id })}
          >
            {item.media && item.media.length > 0 && item.media[0].type === 'video' ? (
              <VideoPlayer
                uri={item.media[0].uri}
                style={styles.gridImage}
                shouldPlay={false}
              />
            ) : (
              <Image source={{ uri: item.images[0] }} style={styles.gridImage} />
            )}
            <View style={styles.gridOverlay}>
              <View style={[styles.dateBadge, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.dateBadgeText}>
                  {formatDate(item.date)}
                </ThemedText>
              </View>
              <View style={styles.gridInfo}>
                <ThemedText style={styles.gridTitle} numberOfLines={2}>
                  {item.title}
                </ThemedText>
                <View style={styles.gridDistance}>
                  <Feather name="map-pin" size={12} color="#FFFFFF" />
                  <ThemedText style={styles.gridDistanceText}>
                    {item.distance.toFixed(1)} km
                  </ThemedText>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: BorderRadius.xs,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.lg,
  },
  gridContainer: {
    paddingHorizontal: Spacing.lg,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  gridItem: {
    width: "48%",
    aspectRatio: 0.75,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: Spacing.sm,
    justifyContent: "space-between",
  },
  dateBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  gridInfo: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  gridDistance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gridDistanceText: {
    fontSize: 12,
    color: "#FFFFFF",
  },
});
