import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { EventCategory } from "@/types";

interface CategoryChipProps {
  category: { id: EventCategory | number | string; label: string; icon: string };
  isSelected: boolean;
  onPress: () => void;
}

export function CategoryChip({ category, isSelected, onPress }: CategoryChipProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? theme.primary : theme.backgroundSecondary,
        },
      ]}
      onPress={onPress}
    >
      <Feather
        name={category.icon as any}
        size={16}
        color={isSelected ? "#FFFFFF" : theme.textSecondary}
      />
      <ThemedText
        style={[
          styles.label,
          {
            color: isSelected ? "#FFFFFF" : theme.text,
          },
        ]}
      >
        {category.label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
});
