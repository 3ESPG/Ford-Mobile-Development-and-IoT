import { Ionicons } from "@expo/vector-icons";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, elevation, radii, spacing, toneColors, type Tone } from "../tokens";
import { AppText } from "./AppText";

type ToastInput = { title: string; message?: string; tone?: Tone };
type ToastContextValue = { show: (toast: ToastInput) => void };

const ToastContext = createContext<ToastContextValue>({ show: () => undefined });

const icons: Partial<Record<Tone, keyof typeof Ionicons.glyphMap>> = {
  success: "checkmark-circle",
  danger: "alert-circle",
  warning: "warning",
  iot: "hardware-chip",
  info: "information-circle"
};

/** Feedback de sucesso/erro não bloqueante, exibido no topo da tela */
export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastInput | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (next: ToastInput) => {
      if (timer.current) clearTimeout(timer.current);
      setToast(next);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(null));
      }, 2800);
    },
    [anim]
  );

  const value = useMemo(() => ({ show }), [show]);
  const tone = toast?.tone || "success";
  const { fg } = toneColors[tone];

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            { top: insets.top + spacing.sm, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] }
          ]}
        >
          <View style={[styles.toast, elevation.lg]} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Ionicons name={icons[tone] || "information-circle"} size={22} color={fg} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodySmStrong">{toast.title}</AppText>
              {toast.message ? (
                <AppText variant="caption" color={colors.textMuted}>
                  {toast.message}
                </AppText>
              ) : null}
            </View>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: spacing.lg, right: spacing.lg, zIndex: 100 },
  toast: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  }
});
