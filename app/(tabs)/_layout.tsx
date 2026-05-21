import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "@/theme";

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.fordBlue,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopColor: colors.line
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800"
        }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Painel", tabBarIcon: tabIcon("speedometer-outline") }} />
      <Tabs.Screen name="dealers" options={{ title: "Lojas", tabBarIcon: tabIcon("business-outline") }} />
      <Tabs.Screen name="leads" options={{ title: "Leads", tabBarIcon: tabIcon("radio-outline") }} />
      <Tabs.Screen name="strategy" options={{ title: "Ações", tabBarIcon: tabIcon("map-outline") }} />
    </Tabs>
  );
}
