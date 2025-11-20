import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import EventDetailScreen from "@/screens/EventDetailScreen";
import CreateEventScreen from "@/screens/CreateEventScreen";
import CommentsModal from "@/screens/CommentsModal";
import AuthScreen from "@/screens/AuthScreen";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

export type RootStackParamList = {
  MainTabs: undefined;
  EventDetail: { eventId: string };
  CreateEvent: undefined;
  Comments: { eventId: string };
  Auth: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.backgroundRoot,
        },
      }}
      initialRouteName={isAuthenticated ? "MainTabs" : "Auth"}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Group screenOptions={{ presentation: "modal" }}>
            <Stack.Screen 
              name="EventDetail" 
              component={EventDetailScreen}
              options={{
                headerShown: true,
                title: "Evento",
                headerTintColor: theme.text,
                headerStyle: {
                  backgroundColor: theme.backgroundRoot,
                },
              }}
            />
            <Stack.Screen 
              name="CreateEvent" 
              component={CreateEventScreen}
              options={{
                headerShown: true,
                title: "Novo Evento",
                headerTintColor: theme.text,
                headerStyle: {
                  backgroundColor: theme.backgroundRoot,
                },
              }}
            />
            <Stack.Screen 
              name="Comments" 
              component={CommentsModal}
              options={{
                headerShown: true,
                title: "Comentários",
                headerTintColor: theme.text,
                headerStyle: {
                  backgroundColor: theme.backgroundRoot,
                },
              }}
            />
          </Stack.Group>
        </>
      ) : (
        <Stack.Group screenOptions={{ presentation: "fullScreenModal" }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
