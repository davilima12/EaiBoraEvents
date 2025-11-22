import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    Modal,
    Pressable,
    FlatList,
    ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { api } from "@/services/api";

interface LikeUser {
    id: string;
    name: string;
    avatar?: string;
}

interface LikesModalProps {
    visible: boolean;
    onClose: () => void;
    postId: string;
}

export function LikesModal({ visible, onClose, postId }: LikesModalProps) {
    const { theme } = useTheme();
    const [likes, setLikes] = useState<LikeUser[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && postId) {
            loadLikes();
        }
    }, [visible, postId]);

    const loadLikes = async () => {
        setLoading(true);
        try {
            const posts = await api.getPosts();
            const post = posts.find((p) => p.id.toString() === postId);

            if (post && post.like_post) {
                const likeUsers: LikeUser[] = post.like_post.map((like: any) => ({
                    id: like.user_id.toString(),
                    name: like.user.name,
                    avatar: like.user.user_profile_picture,
                }));
                setLikes(likeUsers);
            }
        } catch (error) {
            console.error("Error loading likes:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderLikeItem = ({ item }: { item: LikeUser }) => (
        <View style={styles.likeItem}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.avatarText}>{item.name[0].toUpperCase()}</ThemedText>
            </View>
            <ThemedText style={styles.userName}>{item.name}</ThemedText>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]} onPress={(e) => e.stopPropagation()}>
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <ThemedText style={styles.title}>Curtidas</ThemedText>
                        <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
                            <Feather name="x" size={24} color={theme.text} />
                        </Pressable>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : likes.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Feather name="heart" size={48} color={theme.textSecondary} style={{ opacity: 0.3 }} />
                            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                                Nenhuma curtida ainda
                            </ThemedText>
                        </View>
                    ) : (
                        <FlatList
                            data={likes}
                            renderItem={renderLikeItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "flex-end",
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        maxHeight: "60%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
    },
    closeButton: {
        padding: Spacing.xs,
    },
    loadingContainer: {
        paddingVertical: Spacing.xxl * 2,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyContainer: {
        paddingVertical: Spacing.xxl * 2,
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    likeItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: Spacing.md,
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
        fontWeight: "700",
        color: "#FFFFFF",
    },
    userName: {
        fontSize: 16,
        fontWeight: "500",
    },
});
