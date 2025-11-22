import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { Spacing, BorderRadius } from "@/constants/theme";

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
  parentId?: string | null;
  replies?: Comment[];
  isLiked?: boolean;
  likes: number;
}

const POPULAR_EMOJIS = ["🔥", "👏", "❤️", "😂", "😍", "😮", "😢", "😡"];

const CommentItem = ({ comment, onReply, depth = 0, onRefresh }: { comment: Comment; onReply: (comment: Comment) => void; depth?: number; onRefresh?: () => void }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

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

  const [isLiked, setIsLiked] = useState(comment.isLiked || false);
  const [likesCount, setLikesCount] = useState(comment.likes || 0);

  const handleLike = async () => {
    const previousState = isLiked;
    const previousCount = likesCount;

    setIsLiked(!previousState);
    setLikesCount(previousState ? previousCount - 1 : previousCount + 1);

    try {
      if (previousState) {
        await api.unlikeComment(Number(comment.id));
      } else {
        await api.likeComment(Number(comment.id));
      }
      if (onRefresh) onRefresh();
    } catch (e) {
      setIsLiked(previousState);
      setLikesCount(previousCount);
      console.error(e);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Excluir comentário',
      'Tem certeza que deseja remover este comentário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteComment(Number(comment.id));
              Alert.alert('Sucesso', 'Comentário removido');
              if (onRefresh) onRefresh();
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.commentItemContainer, { marginLeft: depth * Spacing.xs }]}>
      <View style={styles.commentItem}>
        {depth > 0 && <View style={styles.connector} />}
        <View style={[styles.commentAvatar, { backgroundColor: theme.primary, width: depth > 0 ? 24 : 32, height: depth > 0 ? 24 : 32 }]}>
          <ThemedText style={[styles.commentAvatarText, { fontSize: depth > 0 ? 12 : 14 }]}>{comment.userName[0]}</ThemedText>
        </View>
        <Pressable
          style={styles.commentContent}
          onLongPress={user?.id === comment.userId ? handleDelete : undefined}
          delayLongPress={500}
        >
          <View style={styles.commentHeader}>
            <ThemedText style={styles.commentUserName}>{comment.userName}</ThemedText>
            <ThemedText style={[styles.commentTime, { color: theme.textSecondary }]}>{formatCommentTime(comment.timestamp)}</ThemedText>
          </View>
          <ThemedText style={[styles.commentText, { color: theme.textSecondary }]}>{comment.text}</ThemedText>

          <View style={styles.actionsRow}>
            <Pressable onPress={handleLike} style={styles.iconButton}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Feather name="thumbs-up" size={14} color={isLiked ? theme.primary : theme.textSecondary} />
                {likesCount > 0 && (
                  <ThemedText style={{ fontSize: 12, color: isLiked ? theme.primary : theme.textSecondary }}>
                    {likesCount}
                  </ThemedText>
                )}
              </View>
            </Pressable>
            <Pressable onPress={() => onReply(comment)} style={{ marginTop: 2 }}>
              <ThemedText style={{ fontSize: 12, fontWeight: "600", color: theme.textSecondary }}>Responder</ThemedText>
            </Pressable>
          </View>

          {hasReplies && (
            <View>
              {!showReplies && (
                <Pressable onPress={() => setShowReplies(true)} style={{ marginTop: Spacing.xs }}>
                  <ThemedText style={{ fontSize: 12, color: theme.textSecondary, fontWeight: "600" }}>Ver {comment.replies?.length} respostas</ThemedText>
                </Pressable>
              )}
              {showReplies && (
                <View style={{ marginTop: Spacing.sm }}>
                  {comment.replies?.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} onReply={onReply} depth={depth + 1} onRefresh={onRefresh} />
                  ))}
                  <Pressable onPress={() => setShowReplies(false)} style={{ marginTop: Spacing.xs, marginBottom: Spacing.sm }}>
                    <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>Ocultar respostas</ThemedText>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

export default function CommentsModal() {
  const route = useRoute();
  const { theme } = useTheme();
  const { user } = useAuth();
  const eventId = (route.params as any)?.eventId;
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<{ id: string; userName: string } | null>(null);
  const inputRef = useRef<TextInput>(null);

  const adaptComment = (c: any): Comment => ({
    id: c.id.toString(),
    userId: c.user_id.toString(),
    userName: c.user.name,
    userAvatar: c.user.user_profile_picture,
    text: c.comment,
    timestamp: c.created_at,
    parentId: c.post_comment_id ? c.post_comment_id.toString() : null,
    replies: c.answers ? c.answers.map(adaptComment) : [],
    isLiked: c.liked_comment && c.liked_comment.some((like: any) => like.user_id.toString() === user?.id),
    likes: c.liked_comment ? c.liked_comment.length : 0,
  });

  const loadComments = async () => {
    if (!eventId) return;
    try {
      const post = await api.getPostById(Number(eventId));
      const adaptedComments: Comment[] = post.comments_chained.map(adaptComment);
      setComments(adaptedComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [eventId]);

  const handleAddComment = async () => {
    if (!user || !eventId || !commentText.trim()) return;
    try {
      await api.commentOnPost(Number(eventId), commentText.trim(), replyingTo ? Number(replyingTo.id) : undefined);
      setCommentText("");
      setReplyingTo(null);
      await loadComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Erro", "Não foi possível adicionar o comentário.");
    }
  };

  const handleReply = (c: Comment) => {
    setReplyingTo({ id: c.id, userName: c.userName });
    inputRef.current?.focus();
  };

  const handleCancelReply = () => setReplyingTo(null);
  const handleEmojiPress = (emoji: string) => setCommentText((prev) => prev + emoji);

  const refreshComments = loadComments;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.backgroundRoot }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      <View style={{ flex: 1, paddingTop: 0, marginTop: 0 }}>
        <ScreenKeyboardAwareScrollView contentContainerStyle={{ paddingBottom: 180, paddingTop: 0 }}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
          ) : comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={[styles.emptyComments, { color: theme.textSecondary }]}>Ainda não há nenhum comentário</ThemedText>
            </View>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} onReply={handleReply} onRefresh={refreshComments} />
              ))}
            </View>
          )}
        </ScreenKeyboardAwareScrollView>
        <View style={[styles.commentInputFixed, { backgroundColor: theme.backgroundSecondary }]}>
          {replyingTo && (
            <View style={[styles.replyContainer, { borderBottomColor: theme.backgroundTertiary }]}>
              <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>Respondendo a <ThemedText style={{ fontWeight: "bold" }}>{replyingTo.userName}</ThemedText></ThemedText>
              <Pressable onPress={handleCancelReply}>
                <Feather name="x" size={16} color={theme.textSecondary} />
              </Pressable>
            </View>
          )}
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
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: theme.text }]}
                placeholder={replyingTo ? `Respondendo a ${replyingTo.userName}...` : "Adicione um comentário..."}
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyComments: {
    textAlign: "center",
    fontSize: 14,
  },
  commentsList: {
    paddingHorizontal: Spacing.xs,
    marginTop: 10,
    gap: Spacing.lg,
  },
  commentItemContainer: {
    marginBottom: Spacing.xs,
  },
  commentItem: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  connector: {
    width: 2,
    backgroundColor: "#333",
    marginRight: Spacing.sm,
    marginLeft: Spacing.xs,
    borderRadius: 1,
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
  actionsRow: {
    flexDirection: "row",
    marginTop: 4,
    marginBottom: 4,
    gap: Spacing.md,
    alignItems: 'center',
  },
  iconButton: {
    padding: 2,
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
    marginTop: Spacing.md,
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
    justifyContent: "center",
  },
  emojiButton: {
    padding: Spacing.xs,
  },
  emojiText: {
    fontSize: 24,
    lineHeight: 30,
  },
  replyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  input: {
    flex: 1,
  },
});
