import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert } from "react-native";
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
    <ScreenKeyboardAwareScrollView>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Comentários</ThemedText>
        <ThemedText style={[styles.count, { color: theme.textSecondary }]}>
          {comments.length} {comments.length === 1 ? "comentário" : "comentários"}
        </ThemedText>
      </View>

      <View style={[styles.commentInput, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={[styles.commentAvatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.commentAvatarText}>
            {user?.name[0] || "U"}
          </ThemedText>
        </View>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Adicione um comentário..."
          placeholderTextColor={theme.textSecondary}
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <Pressable 
          onPress={handleAddComment}
          disabled={!commentText.trim()}
        >
          <Feather 
            name="send" 
            size={20} 
            color={commentText.trim() ? theme.primary : theme.textSecondary} 
          />
        </Pressable>
      </View>

      <View style={styles.commentsList}>
        {comments.length === 0 ? (
          <ThemedText style={[styles.emptyComments, { color: theme.textSecondary }]}>
            Seja o primeiro a comentar!
          </ThemedText>
        ) : (
          comments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <View style={[styles.commentAvatar, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.commentAvatarText}>
                  {comment.userName[0]}
                </ThemedText>
              </View>
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <ThemedText style={styles.commentUserName}>
                    {comment.userName}
                  </ThemedText>
                  <ThemedText style={[styles.commentTime, { color: theme.textSecondary }]}>
                    {formatCommentTime(comment.timestamp)}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.commentText, { color: theme.textSecondary }]}>
                  {comment.text}
                </ThemedText>
              </View>
            </View>
          ))
        )}
      </View>
    </ScreenKeyboardAwareScrollView>
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
});
