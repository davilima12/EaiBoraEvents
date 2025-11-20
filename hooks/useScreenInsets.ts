import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";

import { Spacing } from "@/constants/theme";

const TAB_BAR_HEIGHT = 49;

export function useScreenInsets() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  return {
    paddingTop: headerHeight + Spacing.xl,
    paddingBottom: TAB_BAR_HEIGHT + Spacing.xl,
    scrollInsetBottom: insets.bottom + 16,
  };
}
