import { View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { colors } from "../tokens";

type SparklineProps = {
  data: number[];
  width: number;
  height?: number;
  color?: string;
  max?: number;
};

/** Linha de tendência com área preenchida (telemetria em tempo real) */
export function Sparkline({ data, width, height = 64, color = colors.accent, max }: SparklineProps) {
  if (data.length < 2 || width <= 0) return <View style={{ height }} />;
  const top = max ?? Math.max(...data, 1);
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => [i * stepX, height - 4 - (Math.min(v, top) / top) * (height - 8)] as const);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.28} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#spark)" />
      <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
