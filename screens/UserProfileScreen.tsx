import React from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { UserSearchResult } from "@/services/api";
import { Spacing, BorderRadius } from "@/constants/theme";
import { ExploreStackParamList } from "@/navigation/ExploreStackNavigator";

type UserProfileScreenRouteProp = RouteProp<ExploreStackParamList, "UserProfile">;

export default function UserProfileScreen() {
    const { theme } = useTheme();
    const route = useRoute<UserProfileScreenRouteProp>();
    const { user } = route.params;

    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        {user.user_profile_base64 ? (
                            <Image
                                source={{ uri: user.user_profile_base64 }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.backgroundTertiary }]}>
                                <Feather name="user" size={40} color={theme.textSecondary} />
                            </View>
                        )}
                    </View>

                    <ThemedText style={styles.name}>{user.name}</ThemedText>
                    <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
                        {user.email}
                    </ThemedText>

                    <MenuSection theme={theme} />
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const MenuSection = ({ theme }: { theme: any }) => (
    <View style={[styles.infoSection, { backgroundColor: theme.surface }]}>
        {/* Placeholder for future profile sections */}
        <View style={styles.emptyState}>
            <Feather name="calendar" size={48} color={theme.textSecondary + '80'} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nenhum evento público encontrado
            </ThemedText>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        width: '100%',
    },
    avatarContainer: {
        marginBottom: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    email: {
        fontSize: 14,
        marginBottom: Spacing.xl,
        textAlign: 'center',
    },
    infoSection: {
        width: '100%',
        padding: Spacing.xl,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.xl,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    }
});
