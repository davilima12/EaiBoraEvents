import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator, Image, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { AccountType } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";
import { api } from "@/services/api";

interface State {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
  state_id: number;
}

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

  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [showStateList, setShowStateList] = useState(false);
  const [showCityList, setShowCityList] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [loadingCities, setLoadingCities] = useState(false);

  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) return cities;
    return cities.filter(city =>
      city.name.toLowerCase().includes(citySearchQuery.toLowerCase())
    );
  }, [cities, citySearchQuery]);

  useEffect(() => {
    if (!isLogin) {
      loadStates();
    }
  }, [isLogin]);

  useEffect(() => {
    if (selectedStateId) {
      loadCities(selectedStateId);
      setShowCityList(false);
      setCitySearchQuery("");
    } else {
      setCities([]);
      setSelectedCityId(null);
    }
  }, [selectedStateId]);

  const loadStates = async () => {
    try {
      const data = await api.getStates();
      setStates(data);
    } catch (error) {
      console.error("Error loading states:", error);
    }
  };

  const loadCities = async (stateId: number) => {
    try {
      setLoadingCities(true);
      const data = await api.getCities(stateId);
      setCities(data);
    } catch (error) {
      console.error("Error loading cities:", error);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        if (!email || !password) {
          Alert.alert("Campos obrigatórios", "Por favor, preencha email e senha.");
          setLoading(false);
          return;
        }
        await signIn(email, password, accountType);
      } else {
        if (!name || !email || !password || !selectedStateId || !selectedCityId) {
          Alert.alert("Campos obrigatórios", "Por favor, preencha todos os campos obrigatórios.");
          setLoading(false);
          return;
        }
        await signUp(name, email, password, accountType, selectedStateId, selectedCityId);
      }
      (navigation as any).goBack();
    } catch (error) {
      console.error("Auth error:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao processar sua solicitação. Tente novamente.";
      Alert.alert("Erro", errorMessage);
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

              <ThemedText style={styles.label}>Estado</ThemedText>
              <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Pressable
                  style={styles.pickerButton}
                  onPress={() => setShowStateList(!showStateList)}
                >
                  <ThemedText style={[styles.pickerText, { color: selectedStateId ? theme.text : theme.textSecondary }]}>
                    {selectedStateId ? states.find(s => s.id === selectedStateId)?.name : "Selecione o estado"}
                  </ThemedText>
                </Pressable>
                {showStateList && (
                  <ScrollView style={styles.stateList} nestedScrollEnabled>
                    {states.map((state) => (
                      <Pressable
                        key={state.id}
                        style={[
                          styles.stateItem,
                          { backgroundColor: selectedStateId === state.id ? theme.primary + "20" : "transparent" }
                        ]}
                        onPress={() => {
                          setSelectedStateId(state.id);
                          setShowStateList(false);
                        }}
                      >
                        <ThemedText style={{ color: selectedStateId === state.id ? theme.primary : theme.text }}>
                          {state.name}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>

              {selectedStateId && (
                <>
                  <ThemedText style={styles.label}>Cidade</ThemedText>
                  <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundSecondary }]}>
                    <Pressable
                      style={styles.pickerButton}
                      onPress={() => setShowCityList(!showCityList)}
                      disabled={loadingCities}
                    >
                      {loadingCities ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color={theme.primary} />
                          <ThemedText style={[styles.pickerText, { color: theme.textSecondary, marginLeft: 8 }]}>
                            Carregando cidades...
                          </ThemedText>
                        </View>
                      ) : (
                        <ThemedText style={[styles.pickerText, { color: selectedCityId ? theme.text : theme.textSecondary }]}>
                          {selectedCityId ? cities.find(c => c.id === selectedCityId)?.name : "Selecione a cidade"}
                        </ThemedText>
                      )}
                    </Pressable>
                    {showCityList && !loadingCities && (
                      <>
                        <View style={styles.searchInputContainer}>
                          <TextInput
                            style={[styles.searchInput, { backgroundColor: theme.backgroundTertiary, color: theme.text }]}
                            placeholder="Buscar cidade..."
                            placeholderTextColor={theme.textSecondary}
                            value={citySearchQuery}
                            onChangeText={setCitySearchQuery}
                            autoCapitalize="words"
                          />
                        </View>
                        <FlatList
                          data={filteredCities}
                          keyExtractor={(item) => item.id.toString()}
                          style={styles.stateList}
                          nestedScrollEnabled
                          scrollEnabled={false}
                          initialNumToRender={10}
                          maxToRenderPerBatch={10}
                          windowSize={5}
                          renderItem={({ item: city }) => (
                            <Pressable
                              style={[
                                styles.stateItem,
                                { backgroundColor: selectedCityId === city.id ? theme.primary + "20" : "transparent" }
                              ]}
                              onPress={() => {
                                setSelectedCityId(city.id);
                                setShowCityList(false);
                                setCitySearchQuery("");
                              }}
                            >
                              <ThemedText style={{ color: selectedCityId === city.id ? theme.primary : theme.text }}>
                                {city.name}
                              </ThemedText>
                            </Pressable>
                          )}
                        />
                      </>
                    )}
                  </View>
                </>
              )}
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
    marginTop: 60,
    marginBottom: Spacing["3xl"],
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    lineHeight: 34,
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
  pickerContainer: {
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  pickerButton: {
    height: 48,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
  },
  pickerText: {
    fontSize: 16,
  },
  stateList: {
    maxHeight: 200,
  },
  stateItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  searchInputContainer: {
    padding: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  searchInput: {
    height: 40,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
