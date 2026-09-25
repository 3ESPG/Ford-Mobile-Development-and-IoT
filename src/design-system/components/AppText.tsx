import { Text, type TextProps, type TextStyle } from "react-native";
import { colors, typography, type TypographyVariant } from "../tokens";

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle["textAlign"];
};

/** Texto tipado pela escala do Design System. Nunca use <Text> cru nas telas. */
export function AppText({ variant = "body", color = colors.textPrimary, align, style, ...rest }: AppTextProps) {
  return <Text {...rest} style={[typography[variant], { color, textAlign: align }, style]} />;
}
