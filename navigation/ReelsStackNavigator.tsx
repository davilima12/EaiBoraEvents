import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReelsScreen from "@/screens/ReelsScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";

export type ReelsStackParamList = {
  Reels: undefined;
  Reels: undefined;
  Profile: { userId?: string };
};

const Stack = createNativeStackNavigator<ReelsStackParamList>();

export default function ReelsStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.backgroundRoot,
        },
      }}
    >
      <Stack.Screen name="Reels" component={ReelsScreen} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          ...getCommonScreenOptions({ theme, isDark, transparent: true }),
          headerShown: true,
          title: "Perfil",
        }}
      />
    </Stack.Navigator>
  );
}
