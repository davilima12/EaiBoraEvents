import { Colors } from "@/constants/theme";

export function useTheme() {
  // Forçar modo escuro em todo o aplicativo
  const isDark = true;
  const theme = Colors.dark;

  return {
    theme,
    isDark,
  };
}
