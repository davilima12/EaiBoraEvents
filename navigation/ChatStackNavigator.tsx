import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatListScreen from "@/screens/ChatListScreen";
import ChatDetailScreen from "@/screens/ChatDetailScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";
import { Feather } from "@expo/vector-icons";
import { Pressable } from "react-native";

export type ChatStackParamList = {
  ChatList: undefined;
  ChatDetail: { contactId: string; contactName: string };
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

export default function ChatStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark, transparent: false })}
    >
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          title: "Mensagens",
          headerRight: () => (
            <Pressable onPress={() => {}}>
              <Feather name="edit" size={24} color={theme.text} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={({ route }) => ({
          title: route.params.contactName,
          headerRight: () => (
            <Pressable onPress={() => {}}>
              <Feather name="more-vertical" size={24} color={theme.text} />
            </Pressable>
          ),
        })}
      />
    </Stack.Navigator>
  );
}
