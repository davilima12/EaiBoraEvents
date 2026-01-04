import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import FeedStackNavigator from "@/navigation/FeedStackNavigator";
import ReelsStackNavigator from "@/navigation/ReelsStackNavigator";
import { ExploreStackNavigator } from "@/navigation/ExploreStackNavigator";
import ChatStackNavigator from "@/navigation/ChatStackNavigator";
import ProfileStackNavigator from "@/navigation/ProfileStackNavigator";
import { useTheme } from "@/hooks/useTheme";

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
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
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
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-square" size={size} color={color} />
          ),
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
