import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ExploreScreen from "@/screens/ExploreScreen";
import EventDetailScreen from "@/screens/EventDetailScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";

export type ExploreStackParamList = {
  Explore: undefined;
  EventDetail: { eventId: string };
  Profile: { userId?: string };
};

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export function ExploreStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.backgroundRoot },
      }}
    >
      <Stack.Screen name="Explore" component={ExploreScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
