import React, { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, Image, Modal, ScrollView, ActivityIndicator, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
// Import MediaType directly to avoid deprecation warning and lint error
import { MediaType } from "expo-image-picker";
// Direct import to bypass index.js which causes resolution errors on some platforms
// @ts-ignore
import DateTimePicker from "@react-native-community/datetimepicker/src/datetimepicker";
// Picker removed in favor of custom implementation
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { CategoryChip } from "@/components/CategoryChip";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/services/api";
import { PostType } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function CreateEventScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Category
  const [postTypes, setPostTypes] = useState<PostType[]>([]);
  const [selectedPostTypeId, setSelectedPostTypeId] = useState<number | null>(null);
  const [loadingPostTypes, setLoadingPostTypes] = useState(true);

  // Address fields
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [number, setNumber] = useState("");

  // Location
  const [states, setStates] = useState<Array<{ id: number; name: string }>>([]);
  const [cities, setCities] = useState<Array<{ id: number; name: string }>>([]);
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

  // Dates
  const [startEvent, setStartEvent] = useState<Date>(new Date());
  const [endEvent, setEndEvent] = useState<Date>(new Date(Date.now() + 2 * 60 * 60 * 1000)); // 2 hours later
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load post types and states on mount
  useEffect(() => {
    loadPostTypes();
    loadStates();
  }, []);

  // Load cities when state changes
  useEffect(() => {
    if (selectedStateId) {
      loadCities(selectedStateId);
    } else {
      setCities([]);
      setSelectedCityId(null);
      setShowCityList(false);
      setCitySearchQuery("");
    }
  }, [selectedStateId]);

  const loadPostTypes = async () => {
    try {
      setLoadingPostTypes(true);
      const types = await api.getPostTypes();
      setPostTypes(types);
    } catch (error) {
      console.error("Error loading post types:", error);
      Alert.alert("Erro", "Não foi possível carregar as categorias.");
    } finally {
      setLoadingPostTypes(false);
    }
  };

  const loadStates = async () => {
    try {
      const statesData = await api.getStates();
      setStates(statesData);
    } catch (error) {
      console.error("Error loading states:", error);
      Alert.alert("Erro", "Não foi possível carregar os estados.");
    }
  };

  const loadCities = async (stateId: number) => {
    try {
      setLoadingCities(true);
      const citiesData = await api.getCities(stateId);
      setCities(citiesData);
    } catch (error) {
      console.error("Error loading cities:", error);
      Alert.alert("Erro", "Não foi possível carregar as cidades.");
    } finally {
      setLoadingCities(false);
    }
  };

  const handleCancel = () => {
    if (name || description) {
      Alert.alert(
        "Descartar Evento",
        "Tem certeza que deseja descartar este evento?",
        [
          { text: "Continuar Editando", style: "cancel" },
          {
            text: "Descartar",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Precisamos de permissão para acessar suas fotos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'] as any,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newUris = result.assets.map((asset) => asset.uri);
        setSelectedImages((prev) => [...prev, ...newUris]);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Erro", "Não foi possível selecionar as mídias.");
    }
  };

  const handlePost = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, preencha o nome do evento.");
      return;
    }

    if (!selectedPostTypeId) {
      Alert.alert("Campo obrigatório", "Por favor, selecione uma categoria.");
      return;
    }

    if (selectedImages.length === 0) {
      Alert.alert("Mídia necessária", "Por favor, adicione pelo menos uma foto ou vídeo do evento.");
      return;
    }

    if (!address.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, preencha o endereço.");
      return;
    }

    if (!zipCode.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, preencha o CEP.");
      return;
    }

    if (!neighborhood.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, preencha o bairro.");
      return;
    }

    if (!number.trim()) {
      Alert.alert("Campo obrigatório", "Por favor, preencha o número.");
      return;
    }

    if (!selectedStateId) {
      Alert.alert("Campo obrigatório", "Por favor, selecione o estado.");
      return;
    }

    if (!selectedCityId) {
      Alert.alert("Campo obrigatório", "Por favor, selecione a cidade.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        photos: selectedImages,
        type_post_id: selectedPostTypeId,
        address: address.trim(),
        zip_code: zipCode.trim(),
        neighborhood: neighborhood.trim(),
        number: number.trim(),
        citie_id: selectedCityId,
        state_id: selectedStateId,
        start_event: startEvent.toISOString(),
        end_event: endEvent.toISOString(),
        name: name.trim(),
        description: description.trim() || undefined,
      };

      await api.createEvent(payload, selectedImages);

      Alert.alert("Sucesso", "Evento criado com sucesso!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error("Error creating event:", error);
      Alert.alert("Erro", error.message || "Não foi possível criar o evento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.container}>
        {/* Photos Section */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Fotos do Evento *</ThemedText>
          <View style={styles.uploadSection}>
            {selectedImages.length > 0 ? (
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                  {selectedImages.map((uri, index) => (
                    <Image key={index} source={{ uri }} style={styles.selectedImage} />
                  ))}
                </ScrollView>
                <Pressable style={styles.changeImageButton} onPress={handlePickImages}>
                  <ThemedText style={[styles.changeImageText, { color: theme.primary }]}>
                    Alterar Fotos ({selectedImages.length})
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={[styles.uploadBox, { backgroundColor: theme.backgroundSecondary }]}
                onPress={handlePickImages}
              >
                <Feather name="image" size={32} color={theme.textSecondary} />
                <ThemedText style={[styles.uploadText, { color: theme.textSecondary }]}>
                  Adicionar fotos do evento
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>

        {/* Event Name */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Nome do Evento *</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="Ex: Noite de Jazz ao Vivo"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={100}
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Categoria *</ThemedText>
          {loadingPostTypes ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <View style={styles.categoriesContainer}>
              {postTypes.map((type) => (
                <CategoryChip
                  key={type.id}
                  category={{
                    id: type.id,
                    label: type.name,
                    icon: type.icon,
                  }}
                  isSelected={selectedPostTypeId === type.id}
                  onPress={() => setSelectedPostTypeId(type.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Start Date */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Data e Hora de Início *</ThemedText>
          <Pressable
            style={[styles.input, styles.dateInput, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => setShowStartPicker(true)}
          >
            <Feather name="calendar" size={20} color={theme.textSecondary} />
            <ThemedText style={[styles.dateText, { color: theme.text }]}>
              {formatDate(startEvent)}
            </ThemedText>
          </Pressable>
          {showStartPicker && (
            <DateTimePicker
              value={startEvent}
              mode="datetime"
              display="default"
              onChange={(event: any, date?: Date) => {
                setShowStartPicker(false);
                if (date) setStartEvent(date);
              }}
            />
          )}
        </View>

        {/* End Date */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Data e Hora de Término *</ThemedText>
          <Pressable
            style={[styles.input, styles.dateInput, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => setShowEndPicker(true)}
          >
            <Feather name="calendar" size={20} color={theme.textSecondary} />
            <ThemedText style={[styles.dateText, { color: theme.text }]}>
              {formatDate(endEvent)}
            </ThemedText>
          </Pressable>
          {showEndPicker && (
            <DateTimePicker
              value={endEvent}
              mode="datetime"
              display="default"
              onChange={(event: any, date?: Date) => {
                setShowEndPicker(false);
                if (date) setEndEvent(date);
              }}
            />
          )}
        </View>

        {/* Address */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Endereço *</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="Ex: Rua Augusta"
            placeholderTextColor={theme.textSecondary}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Number */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Número *</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="Ex: 1234"
            placeholderTextColor={theme.textSecondary}
            value={number}
            onChangeText={setNumber}
            keyboardType="numeric"
          />
        </View>

        {/* Neighborhood */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Bairro *</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="Ex: Consolação"
            placeholderTextColor={theme.textSecondary}
            value={neighborhood}
            onChangeText={setNeighborhood}
          />
        </View>

        {/* ZIP Code */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>CEP *</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="Ex: 01310-100"
            placeholderTextColor={theme.textSecondary}
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="numeric"
          />
        </View>

        {/* State */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Estado *</ThemedText>
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
        </View>

        {/* City */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Cidade *</ThemedText>
          <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <Pressable
              style={styles.pickerButton}
              onPress={() => {
                if (!selectedStateId) {
                  Alert.alert("Atenção", "Selecione um estado primeiro.");
                  return;
                }
                setShowCityList(!showCityList);
              }}
              disabled={!selectedStateId || loadingCities}
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
                    style={[styles.searchInput, { backgroundColor: theme.backgroundTertiary || theme.backgroundDefault, color: theme.text }]}
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
        </View>

        {/* Description */}
        <View style={styles.section}>
          <ThemedText style={styles.label}>Descrição</ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: theme.backgroundSecondary, color: theme.text },
            ]}
            placeholder="Conte mais sobre o evento..."
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            maxLength={500}
          />
          <ThemedText style={[styles.charCount, { color: theme.textSecondary }]}>
            {description.length}/500
          </ThemedText>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button onPress={handlePost} disabled={isSubmitting}>
            {isSubmitting ? "Criando..." : "Publicar Evento"}
          </Button>
          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <ThemedText style={[styles.cancelText, { color: theme.textSecondary }]}>
              Cancelar
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
  section: {
    marginBottom: Spacing.xl,
  },
  uploadSection: {
    marginBottom: Spacing.md,
  },
  uploadBox: {
    height: 200,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  uploadText: {
    marginTop: Spacing.sm,
    fontSize: 14,
  },
  imagesScroll: {
    marginBottom: Spacing.sm,
  },
  selectedImage: {
    width: 150,
    height: 150,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  changeImageButton: {
    marginTop: Spacing.sm,
    alignItems: "center",
  },
  changeImageText: {
    fontSize: 14,
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    minHeight: 48,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  pickerContainer: {
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  pickerButton: {
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
    paddingVertical: Spacing.sm,
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
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: 16,
  },
  textArea: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    textAlignVertical: "top",
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    marginTop: Spacing.xs,
    alignSelf: "flex-end",
  },
  buttonContainer: {
    marginTop: Spacing.lg,
  },
  cancelButton: {
    marginTop: Spacing.md,
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
