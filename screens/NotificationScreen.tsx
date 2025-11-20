import React from "react";
import { View, StyleSheet, FlatList, Image, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import { useScreenInsets } from "@/hooks/useScreenInsets";

interface Notification {
    id: string;
    type: "like" | "comment" | "follow" | "mention";
    user: {
        id: string;
        name: string;
        avatar?: string;
    };
    content: string;
    timestamp: string;
    read: boolean;
    targetImage?: string; // For likes/comments on posts
}

const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: "1",
        type: "like",
        user: { id: "u1", name: "Ana Silva", avatar: "https://i.pravatar.cc/150?u=u1" },
        content: "curtiu sua publicação.",
        timestamp: "2h",
        read: false,
        targetImage: "https://picsum.photos/200/300",
    },
    {
        id: "2",
        type: "comment",
        user: { id: "u2", name: "Carlos Souza", avatar: "https://i.pravatar.cc/150?u=u2" },
        content: "comentou: 'Que evento incrível! 👏👏'",
        timestamp: "5h",
        read: false,
        targetImage: "https://picsum.photos/200/301",
    },
    {
        id: "3",
        type: "follow",
        user: { id: "u3", name: "Beatriz Lima", avatar: "https://i.pravatar.cc/150?u=u3" },
        content: "começou a seguir você.",
        timestamp: "1d",
        read: true,
    },
    {
        id: "4",
        type: "mention",
        user: { id: "u4", name: "João Pedro", avatar: "https://i.pravatar.cc/150?u=u4" },
        content: "mencionou você em um comentário.",
        timestamp: "2d",
        read: true,
        targetImage: "https://picsum.photos/200/302",
    },
    {
        id: "5",
        type: "like",
        user: { id: "u5", name: "Mariana Costa", avatar: "https://i.pravatar.cc/150?u=u5" },
        content: "curtiu seu comentário.",
        timestamp: "3d",
        read: true,
    },
];

export default function NotificationScreen() {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const insets = useScreenInsets();

    const renderItem = ({ item }: { item: Notification }) => {
        const isFollow = item.type === "follow";

        return (
            <Pressable
                style={[
                    styles.itemContainer,
                    { backgroundColor: item.read ? theme.backgroundRoot : theme.backgroundSecondary + "20" },
                ]}
                onPress={() => { }}
            >
                <View style={styles.avatarContainer}>
                    {item.user.avatar ? (
                        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary }]}>
                            <ThemedText style={styles.avatarPlaceholderText}>{item.user.name[0]}</ThemedText>
                        </View>
                    )}
                    <View style={[styles.iconBadge, { backgroundColor: getIconColor(item.type) }]}>
                        <Feather name={getIconName(item.type)} size={10} color="#FFF" />
                    </View>
                </View>

                <View style={styles.contentContainer}>
                    <ThemedText style={styles.text}>
                        <ThemedText style={styles.userName}>{item.user.name}</ThemedText> {item.content}
                    </ThemedText>
                    <ThemedText style={[styles.timestamp, { color: theme.textSecondary }]}>
                        {item.timestamp}
                    </ThemedText>
                </View>

                {item.targetImage && (
                    <Image source={{ uri: item.targetImage }} style={styles.targetImage} />
                )}

                {isFollow && (
                    <Pressable style={[styles.followButton, { backgroundColor: theme.primary }]}>
                        <ThemedText style={styles.followButtonText}>Seguir</ThemedText>
                    </Pressable>
                )}
            </Pressable>
        );
    };

    const getIconName = (type: string) => {
        switch (type) {
            case "like": return "heart";
            case "comment": return "message-circle";
            case "follow": return "user-plus";
            case "mention": return "at-sign";
            default: return "bell";
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case "like": return "#E91E63";
            case "comment": return "#2196F3";
            case "follow": return "#4CAF50";
            case "mention": return "#FF9800";
            default: return "#9E9E9E";
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            <FlatList
                data={MOCK_NOTIFICATIONS}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, { paddingTop: insets.paddingTop }]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingVertical: Spacing.sm,
    },
    itemContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.md,
        paddingVertical: Spacing.md,
    },
    avatarContainer: {
        position: "relative",
        marginRight: Spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarPlaceholderText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
    },
    iconBadge: {
        position: "absolute",
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: BorderRadius.full,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFF", // Should match background, but hardcoded for now
    },
    contentContainer: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    text: {
        fontSize: 14,
        lineHeight: 20,
    },
    userName: {
        fontWeight: "bold",
    },
    timestamp: {
        fontSize: 12,
        marginTop: 2,
    },
    targetImage: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.sm,
    },
    followButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
    },
    followButtonText: {
        color: "#FFF",
        fontSize: 12,
        fontWeight: "600",
    },
});
