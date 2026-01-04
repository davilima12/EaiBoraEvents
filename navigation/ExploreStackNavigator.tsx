import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ExploreScreen from "@/screens/ExploreScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import BusinessProfileScreen from "@/screens/BusinessProfileScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "./screenOptions";

export type ExploreStackParamList = {
  Explore: undefined;
  UserProfile: { user: import("@/services/api").UserSearchResult };
  BusinessProfile: { businessId: string; businessName: string };
};

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export default function ExploreStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark, transparent: false })}
    >
      <Stack.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          title: "Explorar",
        }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{
          headerShown: true,
          title: "Perfil",
          headerBackTitle: "Voltar",
        }}
      />
      <Stack.Screen
        name="BusinessProfile"
        component={BusinessProfileScreen}
        options={{
          headerShown: true,
          title: "Perfil da Empresa",
          headerBackTitle: "Voltar",
        }}
      />
    </Stack.Navigator>
  );
}
