import React from "react";
import { View, Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import ExploreScreen from "@/screens/ExploreScreen";
import EventDetailScreen from "@/screens/EventDetailScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";

export type ExploreStackParamList = {
  Explore: undefined;
  EventDetail: { eventId: string };
  Profile: { userId?: string };
};

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export function ExploreStackNavigator() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();

  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark, transparent: true })}
    >
      <Stack.Screen
        name="Explore"
        component={ExploreScreen}
        options={({ navigation }) => ({
          headerTitle: "",
          headerLeft: () => <HeaderTitle title="Buscar" />,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 16, marginRight: 8 }}>
              <Pressable onPress={() => (navigation as any).navigate("Notifications")}>
                <Feather name="bell" size={24} color={theme.text} />
              </Pressable>
              <Pressable onPress={() => (navigation as any).navigate("ChatTab", { screen: "ChatList" })}>
                <Feather name="message-circle" size={24} color={theme.text} />
              </Pressable>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          title: "Detalhes do Evento",
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Perfil",
        }}
      />
    </Stack.Navigator>
  );
}
