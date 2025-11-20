import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReelsScreen from "@/screens/ReelsScreen";
import { useTheme } from "@/hooks/useTheme";

export type ReelsStackParamList = {
  Reels: undefined;
};

const Stack = createNativeStackNavigator<ReelsStackParamList>();

export default function ReelsStackNavigator() {
  const { theme } = useTheme();

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
    </Stack.Navigator>
  );
}
