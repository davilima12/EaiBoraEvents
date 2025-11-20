import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, TextInput, ScrollView, FlatList, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { CategoryChip } from "@/components/CategoryChip";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { database } from "@/services/database";
import { EVENT_CATEGORIES, EventCategory, Event } from "@/types";
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

  const loadEvents = useCallback(async () => {
    if (!user) return;
    try {
      const data = await database.getEvents(user.id);
      setAllEvents(data);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  const filteredEvents = allEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || event.category === selectedCategory;
    const matchesDistance = event.distance <= maxDistance;
    return matchesSearch && matchesCategory && matchesDistance;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
    });
  };

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

      <View style={styles.distanceSection}>
        <ThemedText style={styles.distanceLabel}>
          Eventos até {maxDistance} km
        </ThemedText>
      </View>

      <FlatList
        data={filteredEvents}
        numColumns={2}
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
            <Image source={{ uri: item.images[0] }} style={styles.gridImage} />
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
    paddingBottom: Spacing.md,
  },
  distanceSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: "600",
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
