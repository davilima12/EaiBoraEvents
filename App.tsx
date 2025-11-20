import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import RootNavigator from "@/navigation/RootNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/hooks/useAuth";
import { database } from "@/services/database";

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function initDatabase() {
      try {
        await database.init();
        await database.seedMockData();
        setDbReady(true);
      } catch (error) {
        console.error("Failed to initialize database:", error);
        setDbReady(true);
      }
    }
    initDatabase();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return (
  <ErrorBoundary>
    <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <KeyboardProvider>
            <AuthProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </AuthProvider>
            <StatusBar style="auto" />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
  </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
