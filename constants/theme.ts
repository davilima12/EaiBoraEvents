import { Platform } from "react-native";

const primaryColor = "#7C3AED";
const secondaryColor = "#3B82F6";
const accentColor = "#FF6B6B";

export const Colors = {
  light: {
    text: "#0F0F0F",
    textSecondary: "#737373",
    buttonText: "#FFFFFF",
    tabIconDefault: "#737373",
    tabIconSelected: primaryColor,
    link: primaryColor,
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    success: "#10B981",
    error: "#EF4444",
    backgroundRoot: "#FFFFFF", // Elevation 0
    backgroundDefault: "#F5F5F5", // Elevation 1
    backgroundSecondary: "#E6E6E6", // Elevation 2
    backgroundTertiary: "#D9D9D9", // Elevation 3
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#A3A3A3",
    buttonText: "#FFFFFF",
    tabIconDefault: "#A3A3A3",
    tabIconSelected: primaryColor,
    link: primaryColor,
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor,
    success: "#10B981",
    error: "#EF4444",
    backgroundRoot: "#0F0F0F", // Elevation 0
    backgroundDefault: "#1A1A1A", // Elevation 1
    backgroundSecondary: "#2A2A2A", // Elevation 2
    backgroundTertiary: "#3A3A3A", // Elevation 3
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
