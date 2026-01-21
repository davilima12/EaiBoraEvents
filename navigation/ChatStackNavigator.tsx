import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import ChatListScreen from "@/screens/ChatListScreen";
import ChatDetailScreen from "@/screens/ChatDetailScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";
import { Feather } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";

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
            <Pressable onPress={() => { }}>
              <Feather name="edit" size={24} color={theme.text} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={({ route, navigation }) => ({
          title: route.params?.contactName || "Mensagem",
          headerShown: true,
          headerBackButtonVisible: false,
          headerLeft: () => (
            <Pressable 
              onPress={() => navigation.goBack()}
              style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -8 }}
            >
              <Feather name="arrow-left" size={24} color={theme.text} />
              <ThemedText style={{ marginLeft: 8, fontSize: 16, color: theme.text }}>
                Voltar
              </ThemedText>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={() => { }}>
              <Feather name="more-vertical" size={24} color={theme.text} />
            </Pressable>
          ),
        })}
      />
    </Stack.Navigator>
  );
}
