import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { CategoryChip } from "@/components/CategoryChip";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { database } from "@/services/database";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handlePost = async () => {
    if (!title || !description || !selectedCategory || !location || !date || !user) {
      Alert.alert("Campos obrigatórios", "Por favor, preencha todos os campos.");
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
        images: ["https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800"],
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: {
          address: location,
          latitude: -23.5505,
          longitude: -46.6333,
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
            <Pressable
              style={[styles.uploadBox, { backgroundColor: theme.backgroundSecondary }]}
              onPress={() => {}}
            >
              <Feather name="image" size={32} color={theme.textSecondary} />
              <ThemedText style={[styles.uploadText, { color: theme.textSecondary }]}>
                Adicionar fotos ou vídeos
              </ThemedText>
            </Pressable>
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
          <Pressable
            style={[styles.input, styles.dateInput, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => {}}
          >
            <Feather name="map-pin" size={20} color={theme.textSecondary} />
            <ThemedText style={[styles.dateText, { color: location ? theme.text : theme.textSecondary }]}>
              {location || "Selecione o local"}
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
});
