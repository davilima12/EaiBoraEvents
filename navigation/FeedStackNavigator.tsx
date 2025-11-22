import React from "react";
import { View, Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import FeedScreen from "@/screens/FeedScreen";
import BusinessProfileScreen from "@/screens/BusinessProfileScreen";
import NotificationScreen from "@/screens/NotificationScreen";
import EventDetailScreen from "@/screens/EventDetailScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";
import { HeaderTitle } from "@/components/HeaderTitle";
import { Feather } from "@expo/vector-icons";


export type FeedStackParamList = {
  Feed: undefined;

  Notifications: undefined;
  BusinessProfile: { businessId: string; businessName: string };
  EventDetail: { eventId: string };
};

const Stack = createNativeStackNavigator<FeedStackParamList>();

export default function FeedStackNavigator() {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation();

  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark, transparent: true })}
    >
      <Stack.Screen
        name="Feed"
        component={FeedScreen}
        options={({ navigation }) => ({
          headerTitle: "",
          headerLeft: () => <HeaderTitle title="eai bora?" />,
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: 16, marginRight: 8 }}>
              <Pressable onPress={() => (navigation as any).navigate("Notifications")}>
                <Feather name="bell" size={24} color={theme.text} />
              </Pressable>
              <Pressable onPress={() => (navigation as any).navigate("ChatTab")}>
                <Feather name="message-circle" size={24} color={theme.text} />
              </Pressable>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="BusinessProfile"
        component={BusinessProfileScreen}
        options={({ route }) => ({
          title: route.params.businessName,
        })}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          title: "Notificações",
        }}
      />
      <Stack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{
          title: "Detalhes do Evento",
          headerTransparent: true,
        }}
      />
    </Stack.Navigator>
  );
}
