import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, useLayout } from "@/design-system";
import { useApp } from "@/state/AppProvider";
import { useAuth } from "@/state/AuthProvider";
import { useScopedLeads } from "@/state/selectors";

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(active: IconName, inactive: IconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => <Ionicons name={focused ? active : inactive} size={22} color={color} />;
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { crm } = useApp();
  const { can } = useAuth();
  const { isCompact } = useLayout();
  const { items, dealer } = useScopedLeads();
  // contadores das abas respeitam a concessionária do usuário
  const scopedIds = new Set(items.map((l) => l.id));
  const openAlerts = crm.alerts.filter((a) => !a.acknowledged && (!dealer || (a.leadId !== null && scopedIds.has(a.leadId)))).length;
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = crm.appointments.filter((a) => a.status === "confirmado" && a.date >= today && (!dealer || a.dealerCode === dealer)).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          height: Platform.OS === "web" ? 72 : 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8),
          borderTopColor: colors.border,
          backgroundColor: colors.surface
        },
        tabBarLabelStyle: { fontFamily: fonts.bodySemi, fontSize: isCompact ? 10 : 11 },
        tabBarBadgeStyle: { backgroundColor: colors.danger, fontFamily: fonts.bodySemi, fontSize: 10 }
      }}
    >
      <Tabs.Screen name="painel" options={{ title: "Painel", tabBarIcon: tabIcon("speedometer", "speedometer-outline") }} />
      <Tabs.Screen name="clientes" options={{ title: "Clientes", tabBarIcon: tabIcon("people", "people-outline") }} />
      <Tabs.Screen name="leads" options={{ title: "Leads", tabBarIcon: tabIcon("flash", "flash-outline") }} />
      <Tabs.Screen
        name="conectado"
        options={{ title: "IoT", tabBarIcon: tabIcon("hardware-chip", "hardware-chip-outline"), tabBarBadge: openAlerts || undefined }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: tabIcon("calendar", "calendar-outline"),
          tabBarBadge: upcoming || undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, fontFamily: fonts.bodySemi, fontSize: 10 }
        }}
      />
      {/* Rede Ford: só para quem tem a permissão network.view (admin e gestor) */}
      <Tabs.Screen name="rede" options={{ title: "Rede", tabBarIcon: tabIcon("business", "business-outline"), href: can("network.view") ? undefined : null }} />
    </Tabs>
  );
}
