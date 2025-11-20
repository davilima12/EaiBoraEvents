import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { AccountType } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function AuthScreen() {
  const navigation = useNavigation();
  const { signIn, signUp } = useAuth();
  const { theme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("personal");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password, accountType);
      } else {
        await signUp(name, email, password, accountType);
      }
      (navigation as any).goBack();
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            {isLogin ? "Bem-vindo de volta!" : "Criar conta"}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {isLogin
              ? "Entre para descobrir eventos incríveis"
              : "Junte-se à comunidade eai bora"}
          </ThemedText>
        </View>

        <View style={styles.form}>
          {!isLogin ? (
            <>
              <ThemedText style={styles.label}>Nome</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                placeholder="Seu nome"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </>
          ) : null}

          <ThemedText style={styles.label}>Email</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="seu@email.com"
            placeholderTextColor={theme.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <ThemedText style={styles.label}>Senha</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="••••••••"
            placeholderTextColor={theme.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          {!isLogin ? (
            <>
              <ThemedText style={styles.label}>Tipo de conta</ThemedText>
              <View style={styles.accountTypeContainer}>
                <Pressable
                  style={[
                    styles.accountTypeButton,
                    {
                      backgroundColor:
                        accountType === "personal"
                          ? theme.primary
                          : theme.backgroundSecondary,
                    },
                  ]}
                  onPress={() => setAccountType("personal")}
                >
                  <ThemedText
                    style={[
                      styles.accountTypeText,
                      { color: accountType === "personal" ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    Pessoal
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.accountTypeButton,
                    {
                      backgroundColor:
                        accountType === "business"
                          ? theme.primary
                          : theme.backgroundSecondary,
                    },
                  ]}
                  onPress={() => setAccountType("business")}
                >
                  <ThemedText
                    style={[
                      styles.accountTypeText,
                      { color: accountType === "business" ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    Empresa
                  </ThemedText>
                </Pressable>
              </View>
            </>
          ) : null}

          <View style={styles.buttonContainer}>
            <Button onPress={handleSubmit} disabled={loading}>
              {isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </View>

          <Pressable
            style={styles.switchButton}
            onPress={() => setIsLogin(!isLogin)}
          >
            <ThemedText style={[styles.switchText, { color: theme.textSecondary }]}>
              {isLogin ? "Não tem conta? " : "Já tem conta? "}
              <ThemedText style={{ color: theme.primary, fontWeight: "600" }}>
                {isLogin ? "Criar conta" : "Entrar"}
              </ThemedText>
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
  },
  header: {
    marginBottom: Spacing["3xl"],
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  form: {
    gap: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: -Spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  accountTypeContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
  },
  accountTypeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    marginTop: Spacing.md,
  },
  switchButton: {
    alignItems: "center",
    marginTop: Spacing.md,
  },
  switchText: {
    fontSize: 14,
  },
});
