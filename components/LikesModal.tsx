import React, { useEffect, useState } from "react";
import {
    View,
    StyleSheet,
    Modal,
    Pressable,
    FlatList,
    ActivityIndicator,
    Image,
    useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { api } from "@/services/api";
import { useNavigation } from "@react-navigation/native";

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
    const navigation = useNavigation();
    const { height } = useWindowDimensions();
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

    const handleUserPress = (userId: string) => {
        onClose();
        setTimeout(() => {
            (navigation as any).navigate("Profile", { userId });
        }, 300);
    };

    const renderLikeItem = ({ item }: { item: LikeUser }) => (
        <Pressable
            style={({ pressed }) => [
                styles.likeItem,
                { backgroundColor: pressed ? theme.backgroundSecondary : 'transparent' }
            ]}
            onPress={() => handleUserPress(item.id)}
        >
            {item.avatar ? (
                <Image
                    source={{ uri: item.avatar }}
                    style={styles.avatarImage}
                />
            ) : (
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                    <ThemedText style={styles.avatarText}>{item.name[0].toUpperCase()}</ThemedText>
                </View>
            )}
            <View style={styles.userInfo}>
                <ThemedText style={styles.userName}>{item.name}</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <Pressable
                    style={[
                        styles.modalContent,
                        {
                            backgroundColor: theme.backgroundDefault,
                            maxHeight: height * 0.75,
                        }
                    ]}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <View style={styles.headerContent}>
                            <ThemedText style={styles.title}>Curtidas</ThemedText>
                            {!loading && likes.length > 0 && (
                                <ThemedText style={[styles.likesCount, { color: theme.textSecondary }]}>
                                    {likes.length} {likes.length === 1 ? 'curtida' : 'curtidas'}
                                </ThemedText>
                            )}
                        </View>
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
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        justifyContent: "flex-end",
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
    },
    headerContent: {
        flex: 1,
        marginRight: Spacing.md,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: Spacing.xs,
    },
    likesCount: {
        fontSize: 14,
        fontWeight: "400",
    },
    closeButton: {
        padding: Spacing.xs,
        borderRadius: BorderRadius.full,
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
        paddingVertical: Spacing.sm,
    },
    likeItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        marginHorizontal: Spacing.sm,
        marginVertical: Spacing.xs,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: BorderRadius.full,
        justifyContent: "center",
        alignItems: "center",
        marginRight: Spacing.md,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarImage: {
        width: 52,
        height: 52,
        borderRadius: BorderRadius.full,
        marginRight: Spacing.md,
        backgroundColor: '#f0f0f0',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    userInfo: {
        flex: 1,
        justifyContent: "center",
    },
    userName: {
        fontSize: 16,
        fontWeight: "600",
    },
});
