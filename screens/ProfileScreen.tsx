import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Modal, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { database } from "@/services/database";
import { api } from "@/services/api";
import { Event } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/EmptyState";

type ProfileScreenRouteProp = RouteProp<
  { Profile: { userId?: string } },
  "Profile"
>;

export default function ProfileScreen() {
  const { user: authUser } = useAuth();
  const { theme } = useTheme();
  const route = useRoute<ProfileScreenRouteProp>();
  const navigation = useNavigation();

  // Determine if we are viewing the current user or another user
  const paramUserId = route.params?.userId;
  const isCurrentUser = !paramUserId || (authUser && paramUserId === authUser.id);
  const userId = isCurrentUser ? authUser?.id : paramUserId;

  // State for profile data
  const [profileUser, setProfileUser] = useState<any>(isCurrentUser ? authUser : null);
  const [loadingProfile, setLoadingProfile] = useState(!isCurrentUser);

  // State for events and tabs
  const [selectedTab, setSelectedTab] = useState<"saved" | "attending" | "events">("saved");
  const [savedEvents, setSavedEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [publicEvents, setPublicEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // State for Follow
  const [isFollowing, setIsFollowing] = useState(false);

  // State for Modals
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  // Initialize Follow State
  useEffect(() => {
    if (!isCurrentUser && profileUser && profileUser.followers && authUser) {
      const isAlreadyFollowing = profileUser.followers.some((u: any) => u.id === Number(authUser.id));
      setIsFollowing(isAlreadyFollowing);
    }
  }, [profileUser, authUser, isCurrentUser]);

  // Load Profile Data (if not current user)
  // Load Profile Data and Events
  const loadData = useCallback(async () => {
    if (!userId) return;
    setLoadingProfile(true);
    setLoadingEvents(true);

    try {
      const data = await api.getUserProfile(Number(userId));

      setProfileUser(data);

      const posts = data.post || [];
      if (Array.isArray(posts)) {
        const adaptedEvents: Event[] = posts.map((post: any) => {
          const media = post.photos ? post.photos.map((p: any) => ({
            type: p.type,
            uri: p.path_photo
          })) : [];

          return {
            id: post.id.toString(),
            title: post.name,
            description: post.description || "",
            businessId: post.user_id ? post.user_id.toString() : (data.id ? data.id.toString() : ""),
            businessName: data.name || "",
            businessAvatar: data.user_profile_picture || undefined,
            images: media.length > 0 ? [media[0].uri] : [],
            media: media,
            date: post.start_event,
            location: {
              address: `${post.address || ""}, ${post.number || ""} - ${post.neighborhood || ""}`,
              latitude: post.latitude || 0,
              longitude: post.longitude || 0,
            },
            category: "other",
            likes: post.like_post ? post.like_post.length : 0,
            isLiked: post.like_post ? post.like_post.some((like: any) => like.user_id === Number(authUser?.id)) : false,
            isSaved: false,
            distance: 0,
            comments: [],
          };
        });

        if (isCurrentUser) {
          setMyEvents(adaptedEvents);
          const saved = await database.getSavedEvents(userId);
          setSavedEvents(saved);
        } else {
          setPublicEvents(adaptedEvents);
        }
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoadingProfile(false);
      setLoadingEvents(false);
    }
  }, [userId, isCurrentUser, authUser]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleFollow = async () => {
    if (!userId) return;
    try {
      setIsFollowing((prev) => !prev);
      await api.followUser(Number(userId));
      // Optimistically update profileUser followers list
      setProfileUser((prev: any) => {
        if (!prev) return prev;
        const newFollowers = isFollowing
          ? prev.followers.filter((f: any) => f.id !== Number(authUser?.id))
          : [...(prev.followers || []), { id: Number(authUser?.id), name: authUser?.name }];
        return { ...prev, followers: newFollowers };
      });
    } catch (error) {
      console.error("Error toggling follow:", error);
      setIsFollowing((prev) => !prev);
    }
  };

  // Handlers for Event Actions (Like, Save, etc)
  const handleLike = async (eventId: string) => {
    if (!authUser) return;
    try {
      const isLiked = await database.toggleLike(eventId, authUser.id);
      const updateEvent = (event: Event) =>
        event.id === eventId
          ? { ...event, isLiked, likes: isLiked ? event.likes + 1 : event.likes - 1 }
          : event;

      setPublicEvents((prev) => prev.map(updateEvent));
      setMyEvents((prev) => prev.map(updateEvent));
      setSavedEvents((prev) => prev.map(updateEvent));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSave = async (eventId: string) => {
    if (!authUser) return;
    try {
      const isSaved = await database.toggleSave(eventId, authUser.id);
      const updateEvent = (event: Event) =>
        event.id === eventId ? { ...event, isSaved } : event;

      setPublicEvents((prev) => prev.map(updateEvent));
      setMyEvents((prev) => prev.map(updateEvent));
      setSavedEvents((prev) => prev.map(updateEvent));
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  // Determine which events to display
  let displayEvents: Event[] = [];
  if (isCurrentUser) {
    if (authUser?.accountType === "business") {
      displayEvents = myEvents;
    } else {
      displayEvents = selectedTab === "saved" ? savedEvents : (selectedTab === "attending" ? [] : myEvents);
    }
  } else {
    displayEvents = publicEvents;
  }

  if (loadingProfile && !profileUser) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const displayName = profileUser?.name || "Usuário";
  const displayEmail = profileUser?.email || "";
  const displayBio = profileUser?.description || profileUser?.bio || "";
  const displayFollowers = profileUser?.followers || [];
  const displayFollowing = profileUser?.following || [];
  const isBusiness = profileUser?.accountType === "business" || (publicEvents.length > 0);

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.avatarText}>
                {displayName?.[0] || "U"}
              </ThemedText>
            </View>

            <View style={styles.headerInfo}>
              <ThemedText style={styles.name}>{displayName}</ThemedText>
              {isBusiness && (
                <View style={[styles.badge, { backgroundColor: theme.secondary + "20" }]}>
                  <Feather name="briefcase" size={12} color={theme.secondary} />
                  <ThemedText style={[styles.badgeText, { color: theme.secondary }]}>
                    Conta Empresarial
                  </ThemedText>
                </View>
              )}
              {displayEmail ? (
                <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
                  {displayEmail}
                </ThemedText>
              ) : null}
            </View>
          </View>

          {displayBio ? (
            <ThemedText style={[styles.bio, { color: theme.textSecondary }]}>
              {displayBio}
            </ThemedText>
          ) : null}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <Pressable style={styles.stat} onPress={() => setShowFollowers(true)}>
              <ThemedText style={styles.statNumber}>{displayFollowers.length}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Seguidores</ThemedText>
            </Pressable>
            <View style={[styles.statDivider, { backgroundColor: theme.textSecondary + "40" }]} />
            <Pressable style={styles.stat} onPress={() => setShowFollowing(true)}>
              <ThemedText style={styles.statNumber}>{displayFollowing.length}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Seguindo</ThemedText>
            </Pressable>
          </View>

          {/* Follow and Message Buttons (Public Mode Only) */}
          {!isCurrentUser && authUser && (
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <Pressable
                style={[styles.followButton, { borderColor: theme.primary, backgroundColor: isFollowing ? 'transparent' : theme.primary }]}
                onPress={handleFollow}
              >
                <ThemedText style={[styles.followText, { color: isFollowing ? theme.primary : '#FFF' }]}>
                  {isFollowing ? "Deixar de seguir" : "Seguir"}
                </ThemedText>
              </Pressable>

              <Pressable
                style={[styles.followButton, { borderColor: theme.primary, backgroundColor: 'transparent' }]}
                onPress={() => {
                  (navigation as any).navigate('ChatTab', {
                    screen: 'ChatDetail',
                    params: { contactId: userId, contactName: displayName }
                  });
                }}
              >
                <ThemedText style={[styles.followText, { color: theme.primary }]}>
                  Mensagem
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>

        {/* Modals for Followers/Following */}
        <Modal
          visible={showFollowers}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowFollowers(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Seguidores</ThemedText>
              <Pressable onPress={() => setShowFollowers(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <FlatList
              data={displayFollowers}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.userItem}
                  onPress={() => {
                    setShowFollowers(false);
                    (navigation as any).push("Profile", { userId: item.id });
                  }}
                >
                  <View style={[styles.userAvatar, { backgroundColor: theme.primary }]}>
                    <ThemedText style={styles.userAvatarText}>
                      {item.name?.[0] || "U"}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.userName}>{item.name}</ThemedText>
                </Pressable>
              )}
              ListEmptyComponent={
                <ThemedText style={{ textAlign: 'center', marginTop: 20, color: theme.textSecondary }}>
                  Nenhum seguidor ainda.
                </ThemedText>
              }
            />
          </View>
        </Modal>

        <Modal
          visible={showFollowing}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowFollowing(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Seguindo</ThemedText>
              <Pressable onPress={() => setShowFollowing(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <FlatList
              data={displayFollowing}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.userItem}
                  onPress={() => {
                    setShowFollowing(false);
                    (navigation as any).push("Profile", { userId: item.id });
                  }}
                >
                  <View style={[styles.userAvatar, { backgroundColor: theme.primary }]}>
                    <ThemedText style={styles.userAvatarText}>
                      {item.name?.[0] || "U"}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.userName}>{item.name}</ThemedText>
                </Pressable>
              )}
              ListEmptyComponent={
                <ThemedText style={{ textAlign: 'center', marginTop: 20, color: theme.textSecondary }}>
                  Nenhum seguido ainda.
                </ThemedText>
              }
            />
          </View>
        </Modal>

        {!showFollowers && !showFollowing && (
          <>
            {/* Tabs (Private Mode) or Section Title (Public Mode) */}
            {isCurrentUser ? (
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
                    {authUser?.accountType === "business" ? "Meus Eventos" : "Salvos"}
                  </ThemedText>
                </Pressable>
                {authUser?.accountType !== "business" && (
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
                )}
              </View>
            ) : (
              <View style={styles.publicEventsHeader}>
                <ThemedText style={styles.sectionTitle}>Eventos</ThemedText>
              </View>
            )}

            {/* Content Area */}
            {loadingEvents ? (
              <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.eventsContainer}>
                {displayEvents.length === 0 ? (
                  <View style={styles.emptyGrid}>
                    <Feather name="bookmark" size={48} color={theme.textSecondary} />
                    <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                      {isCurrentUser ? "Nenhum evento encontrado" : "Este usuário não tem eventos públicos."}
                    </ThemedText>
                  </View>
                ) : (
                  <View style={{ gap: Spacing.md }}>
                    {displayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onPress={() => { }} // Navigate to detail
                        onLike={() => handleLike(event.id)}
                        onSave={() => handleSave(event.id)}
                        onComment={() => { }}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    flex: 1,
  },
  headerContainer: {
    marginBottom: Spacing["2xl"],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
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
    marginBottom: Spacing.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
    marginBottom: Spacing.xs,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
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
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: Spacing.sm,
    gap: Spacing.xl,
  },
  stat: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  modalContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: Spacing.sm,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  userAvatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  followButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    minWidth: 120,
  },
  followText: {
    fontSize: 14,
    fontWeight: "600",
  },
  publicEventsHeader: {
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  eventsContainer: {
    paddingBottom: Spacing.xl,
  }
});
