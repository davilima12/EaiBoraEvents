import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FeedStackNavigator from "@/navigation/FeedStackNavigator";
import ReelsStackNavigator from "@/navigation/ReelsStackNavigator";
import { ExploreStackNavigator } from "@/navigation/ExploreStackNavigator";
import ChatStackNavigator from "@/navigation/ChatStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export type MainTabParamList = {
  FeedTab: undefined;
  ReelsTab: undefined;
  ExploreTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="FeedTab"
      screenOptions={{
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: "#000000", // Forçar preto no Android
          }),
          borderTopWidth: 0,
          borderTopColor: "transparent",
          elevation: 0,
          height: Platform.select({
            android: 60 + Math.max(insets.bottom - 8, 0), // Adicionar espaço para botões do sistema
            ios: 60 + insets.bottom, // Altura com espaço para safe area no iOS
          }),
          paddingBottom: Platform.select({
            android: Math.max(insets.bottom - 8, Spacing.sm), // Padding para evitar sobreposição
            ios: insets.bottom + Spacing.sm, // Padding para safe area no iOS
          }),
          paddingTop: Platform.select({
            android: Spacing.sm,
            ios: Spacing.sm,
          }),
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="FeedTab"
        component={FeedStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ReelsTab"
        component={ReelsStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="video" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatTab"
        component={ChatStackNavigator}
        options={({ route }) => {
          // Hide tab bar on nested screens (ChatDetail)
          // We need to check the route state to see if we are on the initial screen or a pushed screen
          const routeName = (route.state as any)?.routes?.[(route.state as any).index]?.name ?? (route.state as any)?.routeNames?.[(route.state as any).index] ?? 'ChatList';
          // Also check if we are navigating to ChatDetail directly
          // If the state is undefined, we assume it's the initial route (ChatList)
          // But if we navigated via params (like from Profile), we might need to be careful.
          // A safer way for simple stacks is checking if the focused route is ChatDetail

          // Actually, getFocusedRouteNameFromRoute is the standard way but we can do a simple check
          // If we are deep in the stack, hide the tab bar

          // Let's use a simpler approach: if the route state exists and index > 0, hide it.
          // However, initially route.state might be undefined.

          // Better approach: use getFocusedRouteNameFromRoute from @react-navigation/native
          // But I don't want to add imports if I can avoid it.
          // Let's try to infer from the route object if possible, or just use the standard way.

          // Let's import getFocusedRouteNameFromRoute
          return {
            tabBarIcon: ({ color, size }) => (
              <Feather name="message-square" size={size} color={color} />
            ),
            tabBarStyle: ((route) => {
              const routeName = getFocusedRouteNameFromRoute(route) ?? "ChatList";
              if (routeName === "ChatDetail") {
                return { display: "none" };
              }
              return {
                position: "absolute",
                backgroundColor: Platform.select({
                  ios: "transparent",
                  android: "#000000", // Forçar preto no Android
                }),
                borderTopWidth: 0,
                borderTopColor: "transparent",
                elevation: 0,
                height: Platform.select({
                  android: 60 + Math.max(insets.bottom - 8, 0), // Adicionar espaço para botões do sistema
                  ios: 60 + insets.bottom, // Altura com espaço para safe area no iOS
                }),
                paddingBottom: Platform.select({
                  android: Math.max(insets.bottom - 8, Spacing.sm), // Padding para evitar sobreposição
                  ios: insets.bottom + Spacing.sm, // Padding para safe area no iOS
                }),
                paddingTop: Platform.select({
                  android: Spacing.sm,
                  ios: Spacing.sm,
                }),
              };
            })(route),
          };
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
