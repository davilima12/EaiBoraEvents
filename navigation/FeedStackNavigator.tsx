import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FeedScreen from "@/screens/FeedScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";
import { Feather } from "@expo/vector-icons";
import { Pressable } from "react-native";

export type FeedStackParamList = {
  Feed: undefined;
};

const Stack = createNativeStackNavigator<FeedStackParamList>();

export default function FeedStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark, transparent: true })}
    >
      <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          headerTitle: () => <HeaderTitle title="eai bora" />,
          headerRight: () => (
            <Pressable onPress={() => {}}>
              <Feather name="sliders" size={24} color={theme.text} />
            </Pressable>
          ),
        }}
      />
    </Stack.Navigator>
  );
}
