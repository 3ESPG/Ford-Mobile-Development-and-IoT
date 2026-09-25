import { Ionicons } from "@expo/vector-icons";
import { forwardRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, radii, spacing } from "../tokens";
import { AppText } from "./AppText";
import type { IconName } from "./Icon";

type InputProps = Omit<TextInputProps, "style"> & {
  label: string;
  error?: string;
  hint?: string;
  icon?: IconName;
  /** campo de senha com botão de mostrar/ocultar */
  password?: boolean;
};

/** Campo de formulário do Design System: rótulo, ícone, foco, erro e dica */
export const Input = forwardRef<TextInput, InputProps>(function Input({ label, error, hint, icon, password, onFocus, onBlur, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const borderColor = error ? colors.danger : focused ? colors.accent : colors.borderStrong;

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
      <View style={[styles.box, { borderColor }, focused && styles.focused]}>
        {icon ? <Ionicons name={icon} size={18} color={error ? colors.danger : colors.textMuted} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          secureTextEntry={password && hidden}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {password ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10} accessibilityRole="button" accessibilityLabel={hidden ? "Mostrar senha" : "Ocultar senha"}>
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View style={styles.row} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <AppText variant="caption" color={colors.danger}>
            {error}
          </AppText>
        </View>
      ) : hint ? (
        <AppText variant="caption" color={colors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  box: {
    height: 50,
    borderRadius: radii.sm,
    borderWidth: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  focused: { borderWidth: 1.5 },
  input: { flex: 1, height: "100%", color: colors.textPrimary, fontSize: 15, fontFamily: fonts.body },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.xs }
});
