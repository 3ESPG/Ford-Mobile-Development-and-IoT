import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { radii, toneColors, type Tone } from "../tokens";

export type IconName = keyof typeof Ionicons.glyphMap;

type IconTileProps = {
  name: IconName;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
};

const dims = { sm: { box: 32, icon: 16 }, md: { box: 40, icon: 20 }, lg: { box: 52, icon: 26 } };

/** Ícone em "tile" arredondado com fundo suave do tom semântico */
export function IconTile({ name, tone = "brand", size = "md" }: IconTileProps) {
  const { fg, bg } = toneColors[tone];
  const d = dims[size];
  return (
    <View style={[styles.tile, { width: d.box, height: d.box, backgroundColor: bg }]}>
      <Ionicons name={name} size={d.icon} color={fg} />
    </View>
  );
}

export { Ionicons };

const styles = StyleSheet.create({
  tile: { borderRadius: radii.sm, alignItems: "center", justifyContent: "center" }
});
