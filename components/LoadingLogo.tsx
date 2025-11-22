import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Image, Animated } from "react-native";
import { ThemedText } from "@/components/ThemedText";

interface LoadingLogoProps {
    text?: string;
}

export function LoadingLogo({ text }: LoadingLogoProps) {
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();

        return () => animation.stop();
    }, [fadeAnim]);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
                <ThemedText style={styles.text}>Eai,</ThemedText>
                <Image
                    source={require("../assets/images/header-logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>
            {/* {text && <ThemedText style={styles.loadingText}>{text}</ThemedText>} */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",

    },
    text: {
        fontSize: 48,
        fontWeight: "900",
        fontStyle: "italic",
        letterSpacing: -1,
        marginBottom: 25,
        lineHeight: 42,
        paddingHorizontal: 4,
        paddingTop: 8,
    },
    logo: {
        width: 260,
        height: 140,
        marginTop: 35,
        marginLeft: -80,
    },
    loadingText: {
        fontSize: 16,
        opacity: 0.7,
    },
});
