import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, Image, Modal } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { CategoryChip } from "@/components/CategoryChip";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { database } from "@/services/database";
import { locationService } from "@/services/location";
import { EVENT_CATEGORIES, EventCategory } from "@/types";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function CreateEventScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [eventCoordinates, setEventCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCoordinateModal, setShowCoordinateModal] = useState(false);
  const [manualCoords, setManualCoords] = useState("");

  const handleCancel = () => {
    if (title || description) {
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const imageUris = result.assets.map((asset) => asset.uri);
        setSelectedImages(imageUris);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Erro", "Não foi possível selecionar as imagens.");
    }
  };

  const handleSetVenueLocation = () => {
    Alert.alert(
      "Definir Localização do Evento",
      "Como deseja definir a localização onde o evento acontecerá?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Usar Minha Posição Atual", onPress: handleUseCurrentLocation },
        { text: "Inserir Coordenadas Manualmente", onPress: handleManualCoordinates },
      ]
    );
  };

  const handleUseCurrentLocation = async () => {
    try {
      const currentLocation = await locationService.getCurrentLocation();
      if (currentLocation) {
        setEventCoordinates(currentLocation);
        Alert.alert("Local do Evento Definido", "O evento acontecerá na sua localização atual.");
      } else {
        Alert.alert("Erro", "Não foi possível obter sua localização atual.");
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert("Erro", "Não foi possível obter sua localização atual.");
    }
  };

  const handleManualCoordinates = () => {
    setShowCoordinateModal(true);
  };

  const handleSaveManualCoordinates = () => {
    if (manualCoords) {
      const [lat, lon] = manualCoords.split(",").map((s) => parseFloat(s.trim()));
      if (!isNaN(lat) && !isNaN(lon)) {
        setEventCoordinates({ latitude: lat, longitude: lon });
        setShowCoordinateModal(false);
        setManualCoords("");
        Alert.alert("Local do Evento Definido", "As coordenadas do evento foram salvas.");
      } else {
        Alert.alert("Erro", "Coordenadas inválidas. Use o formato: latitude,longitude");
      }
    }
  };

  const handlePost = async () => {
    if (!title || !description || !selectedCategory || !location || !date || !user) {
      Alert.alert("Campos obrigatórios", "Por favor, preencha todos os campos.");
      return;
    }

    if (selectedImages.length === 0) {
      Alert.alert("Imagem necessária", "Por favor, adicione pelo menos uma foto do evento.");
      return;
    }

    if (!eventCoordinates) {
      Alert.alert(
        "Localização não definida",
        "Por favor, defina onde o evento acontecerá.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Definir Agora", onPress: () => {
            handleSetVenueLocation();
          }},
        ]
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await database.createEvent({
        id: Math.random().toString(36).substring(7),
        title,
        description,
        businessId: user.id,
        businessName: user.name,
        businessAvatar: user.avatar,
        images: selectedImages,
        media: selectedImages.map(uri => ({
          type: "image" as const,
          uri,
        })),
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: {
          address: location,
          latitude: eventCoordinates.latitude,
          longitude: eventCoordinates.longitude,
        },
        category: selectedCategory,
      });

      Alert.alert("Sucesso", "Evento criado com sucesso!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error creating event:", error);
      Alert.alert("Erro", "Não foi possível criar o evento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = title && description && selectedCategory && location && date;

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.container}>
        <View style={styles.section}>
          <View style={styles.uploadSection}>
            {selectedImages.length > 0 ? (
              <View>
                <Image
                  source={{ uri: selectedImages[0] }}
                  style={styles.selectedImage}
                />
                <Pressable
                  style={styles.changeImageButton}
                  onPress={handlePickImages}
                >
                  <ThemedText style={[styles.changeImageText, { color: theme.primary }]}>
                    Alterar Foto
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
                  Adicionar fotos ou vídeos
                </ThemedText>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Título do Evento *</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="Ex: Noite de Jazz ao Vivo"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Categoria *</ThemedText>
          <View style={styles.categoriesContainer}>
            {EVENT_CATEGORIES.map((category) => (
              <CategoryChip
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Data e Hora *</ThemedText>
          <Pressable
            style={[styles.input, styles.dateInput, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => {}}
          >
            <Feather name="calendar" size={20} color={theme.textSecondary} />
            <ThemedText style={[styles.dateText, { color: date ? theme.text : theme.textSecondary }]}>
              {date || "Selecione a data e hora"}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Localização *</ThemedText>
          <TextInput
            style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            placeholder="Ex: Rua Augusta, 1234 - São Paulo"
            placeholderTextColor={theme.textSecondary}
            value={location}
            onChangeText={setLocation}
          />
          <Pressable
            style={styles.locationButton}
            onPress={handleSetVenueLocation}
          >
            <Feather name="map-pin" size={16} color={theme.primary} />
            <ThemedText style={[styles.locationButtonText, { color: theme.primary }]}>
              {eventCoordinates 
                ? `Local definido (${eventCoordinates.latitude.toFixed(4)}, ${eventCoordinates.longitude.toFixed(4)})`
                : "Definir localização do evento"}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Descrição *</ThemedText>
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

        <View style={styles.buttonContainer}>
          <Button onPress={handlePost} disabled={!isFormValid}>
            Publicar Evento
          </Button>
          <Pressable style={styles.cancelButton} onPress={handleCancel}>
            <ThemedText style={[styles.cancelText, { color: theme.textSecondary }]}>
              Cancelar
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showCoordinateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCoordinateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <ThemedText style={styles.modalTitle}>Coordenadas do Evento</ThemedText>
            <ThemedText style={[styles.modalDescription, { color: theme.textSecondary }]}>
              Digite as coordenadas no formato:{"\n"}latitude,longitude
            </ThemedText>
            <ThemedText style={[styles.modalExample, { color: theme.textSecondary }]}>
              Exemplo: -23.5505,-46.6333
            </ThemedText>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder="-23.5505,-46.6333"
              placeholderTextColor={theme.textSecondary}
              value={manualCoords}
              onChangeText={setManualCoords}
              keyboardType="numbers-and-punctuation"
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => {
                  setShowCoordinateModal(false);
                  setManualCoords("");
                }}
              >
                <ThemedText style={{ color: theme.textSecondary }}>Cancelar</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSave, { backgroundColor: theme.primary }]}
                onPress={handleSaveManualCoordinates}
              >
                <ThemedText style={{ color: "#FFFFFF" }}>Salvar</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.sm,
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
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
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
  locationButton: {
    marginTop: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  modalDescription: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  modalExample: {
    fontSize: 12,
    marginBottom: Spacing.md,
  },
  modalInput: {
    minHeight: 48,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  modalButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: BorderRadius.xs,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonCancel: {},
  modalButtonSave: {},
});
