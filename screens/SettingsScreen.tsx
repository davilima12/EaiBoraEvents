import React from "react";
import { View, StyleSheet, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { signOut, user } = useAuth();
  const { theme } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      "Sair",
      "Tem certeza que deseja sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await signOut();
            // Navigation will happen automatically based on isAuthenticated
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Excluir Conta",
      "Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmar Exclusão",
              "Você tem certeza absoluta? Esta ação é irreversível.",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Sim, excluir",
                  style: "destructive",
                  onPress: async () => {
                    await signOut();
                    // Navigation will happen automatically based on isAuthenticated
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const SettingsItem = ({
    icon,
    title,
    onPress,
    isDestructive = false,
  }: {
    icon: string;
    title: string;
    onPress: () => void;
    isDestructive?: boolean;
  }) => (
    <Pressable
      style={[styles.item, { backgroundColor: theme.backgroundDefault }]}
      onPress={onPress}
      android_ripple={{ color: theme.primary + "20" }}
    >
      <View style={styles.itemLeft}>
        <Feather
          name={icon as any}
          size={20}
          color={isDestructive ? theme.error : theme.text}
        />
        <ThemedText
          style={[styles.itemTitle, { color: isDestructive ? theme.error : theme.text }]}
        >
          {title}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            CONTA
          </ThemedText>
          <SettingsItem icon="user" title="Editar Perfil" onPress={() => { }} />
          <SettingsItem
            icon="bell"
            title="Notificações"
            onPress={() => { }}
          />
          <SettingsItem icon="lock" title="Privacidade" onPress={() => { }} />
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            PREFERÊNCIAS
          </ThemedText>
          <SettingsItem icon="map-pin" title="Localização" onPress={() => { }} />
          <SettingsItem
            icon="sliders"
            title="Filtros Padrão"
            onPress={() => { }}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            SUPORTE
          </ThemedText>
          <SettingsItem icon="help-circle" title="Central de Ajuda" onPress={() => { }} />
          <SettingsItem icon="message-circle" title="Contato" onPress={() => { }} />
          <SettingsItem icon="info" title="Sobre" onPress={() => { }} />
        </View>

        <View style={styles.section}>
          <SettingsItem icon="log-out" title="Sair" onPress={handleLogout} />
        </View>

        <View style={styles.section}>
          <SettingsItem
            icon="trash-2"
            title="Excluir Conta"
            onPress={handleDeleteAccount}
            isDestructive
          />
        </View>

        <View style={styles.versionContainer}>
          <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
            Versão 1.0.0
          </ThemedText>
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    marginBottom: Spacing.xs,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  versionContainer: {
    alignItems: "center",
    marginTop: Spacing["2xl"],
  },
  version: {
    fontSize: 12,
  },
});
