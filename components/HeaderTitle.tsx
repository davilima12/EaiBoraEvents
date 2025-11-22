import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/theme";

interface HeaderTitleProps {
  title: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.text}>Eai,</ThemedText>
      <Image
        source={require("../assets/images/header-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 0,
  },
  text: {
    fontSize: 22,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -1,
    marginBottom: 20,
    marginTop: -8,
  },
  logo: {
    width: 150,
    height: 85,
    marginTop: -10,
    marginLeft: -40,
  },
});
