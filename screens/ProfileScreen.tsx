import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { mockEvents } from "@/utils/mockData";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function ProfileScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [selectedTab, setSelectedTab] = useState<"saved" | "attending">("saved");

  const savedEvents = mockEvents.filter((e) => e.isSaved);
  const myEvents = user?.accountType === "business" ? mockEvents.slice(0, 2) : savedEvents;

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.avatarText}>
              {user?.name?.[0] || "U"}
            </ThemedText>
          </View>
          <ThemedText style={styles.name}>{user?.name || "Usuário"}</ThemedText>
          <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
            {user?.email || "email@example.com"}
          </ThemedText>
          {user?.bio ? (
            <ThemedText style={[styles.bio, { color: theme.textSecondary }]}>
              {user.bio}
            </ThemedText>
          ) : null}
          {user?.accountType === "business" ? (
            <View style={[styles.badge, { backgroundColor: theme.secondary + "20" }]}>
              <Feather name="briefcase" size={12} color={theme.secondary} />
              <ThemedText style={[styles.badgeText, { color: theme.secondary }]}>
                Conta Empresarial
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.tabs}>
          <Pressable
            style={[
              styles.tab,
              selectedTab === "saved" && {
                borderBottomColor: theme.primary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setSelectedTab("saved")}
          >
            <ThemedText
              style={[
                styles.tabText,
                {
                  color: selectedTab === "saved" ? theme.primary : theme.textSecondary,
                  fontWeight: selectedTab === "saved" ? "600" : "400",
                },
              ]}
            >
              {user?.accountType === "business" ? "Meus Eventos" : "Salvos"}
            </ThemedText>
          </Pressable>
          {user?.accountType !== "business" ? (
            <Pressable
              style={[
                styles.tab,
                selectedTab === "attending" && {
                  borderBottomColor: theme.primary,
                  borderBottomWidth: 2,
                },
              ]}
              onPress={() => setSelectedTab("attending")}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  {
                    color: selectedTab === "attending" ? theme.primary : theme.textSecondary,
                    fontWeight: selectedTab === "attending" ? "600" : "400",
                  },
                ]}
              >
                Participando
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.gridContainer}>
          {myEvents.length === 0 ? (
            <View style={styles.emptyGrid}>
              <Feather name="bookmark" size={48} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nenhum evento salvo ainda
              </ThemedText>
            </View>
          ) : (
            <View style={styles.grid}>
              {myEvents.map((event) => (
                <View
                  key={event.id}
                  style={[styles.gridItem, { backgroundColor: theme.backgroundSecondary }]}
                >
                  <ThemedText style={styles.gridItemText} numberOfLines={2}>
                    {event.title}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  bio: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tabs: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
  },
  gridContainer: {
    minHeight: 200,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  gridItem: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: BorderRadius.xs,
    padding: Spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  gridItemText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyGrid: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyText: {
    fontSize: 14,
    marginTop: Spacing.md,
  },
});
