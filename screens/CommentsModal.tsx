import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { database } from "@/services/database";
import { Spacing, BorderRadius } from "@/constants/theme";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
}

const POPULAR_EMOJIS = ["🔥", "👏", "❤️", "😂", "😍", "😮", "😢", "😡"];

export default function CommentsModal() {
  const route = useRoute();
  const { theme } = useTheme();
  const { user } = useAuth();
  const eventId = (route.params as any)?.eventId;
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [eventId]);

  const loadComments = async () => {
    if (!eventId) return;
    try {
      const commentsData = await database.getComments(eventId);
      setComments(commentsData);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !eventId || !commentText.trim()) return;

    try {
      await database.addComment(
        eventId,
        user.id,
        user.name,
        user.avatar,
        commentText.trim()
      );
      setCommentText("");
      await loadComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Erro", "Não foi possível adicionar o comentário.");
    }
  };


  const handleEmojiPress = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
  };

  const formatCommentTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 66 : 32}
    >
      <View style={{ flex: 1 }}>
        <ScreenKeyboardAwareScrollView contentContainerStyle={{ paddingBottom: 80 }}>

          <View style={styles.commentsList}>
            {comments.length === 0 ? (
              <ThemedText style={[styles.emptyComments, { color: theme.textSecondary }]}>Adicione um comentario!</ThemedText>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={[styles.commentAvatar, { backgroundColor: theme.primary }]}>
                    <ThemedText style={styles.commentAvatarText}>{comment.userName[0]}</ThemedText>
                  </View>
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <ThemedText style={styles.commentUserName}>{comment.userName}</ThemedText>
                      <ThemedText style={[styles.commentTime, { color: theme.textSecondary }]}>{formatCommentTime(comment.timestamp)}</ThemedText>
                    </View>
                    <ThemedText style={[styles.commentText, { color: theme.textSecondary }]}>{comment.text}</ThemedText>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScreenKeyboardAwareScrollView>
        <View style={[styles.commentInputFixed, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.emojiContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiList}>
              {POPULAR_EMOJIS.map((emoji, index) => (
                <Pressable key={index} onPress={() => handleEmojiPress(emoji)} style={styles.emojiButton}>
                  <ThemedText style={styles.emojiText}>{emoji}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View style={[styles.commentInputUsual, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={[styles.commentAvatar, { backgroundColor: theme.primary, marginRight: Spacing.sm }]}>
              <ThemedText style={styles.commentAvatarText}>{user?.name[0] || "U"}</ThemedText>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Adicione um comentário..."
                placeholderTextColor={theme.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <Pressable onPress={handleAddComment} disabled={!commentText.trim()}>
                <Feather name="send" size={20} color={commentText.trim() ? theme.primary : theme.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  count: {
    fontSize: 14,
  },
  commentInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 80,
  },
  commentsList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  emptyComments: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: Spacing.xl,
  },
  commentItem: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentTime: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputUsual: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "#222",
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
    marginTop: Spacing.md, // espaçamento do topo
    backgroundColor: undefined,
  },
  commentInputFixed: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 0,
  },
  emojiContainer: {
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(150, 150, 150, 0.1)",
  },
  emojiList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    flexGrow: 1,
    justifyContent: 'center',
  },
  emojiButton: {
    padding: Spacing.xs,
  },
  emojiText: {
    fontSize: 24,
    lineHeight: 30, // Aumentado para evitar corte
  },
});
