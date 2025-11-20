import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReelsScreen from "@/screens/ReelsScreen";
import BusinessProfileScreen from "@/screens/BusinessProfileScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";

export type ReelsStackParamList = {
  Reels: undefined;
  BusinessProfile: { businessId: string; businessName: string };
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
        name="BusinessProfile"
        component={BusinessProfileScreen}
        options={({ route }) => ({
          ...getCommonScreenOptions({ theme, isDark, transparent: true }),
          headerShown: true,
          title: route.params.businessName,
        })}
      />
    </Stack.Navigator>
  );
}
