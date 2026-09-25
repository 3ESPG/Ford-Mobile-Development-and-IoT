import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText, Button, Card, Chip, colors, EmptyState, MetricRow, radii, Screen, Section, spacing, useToast } from "@/design-system";
import { longDate, parseISODate } from "@/domain/format";
import { leadTitle } from "@/domain/leads";
import { nextWorkshopDays, SERVICE_TYPES, serviceForAlert, serviceLabel, TIME_SLOTS, type ServiceTypeId } from "@/domain/schedule";
import { successFeedback } from "@/iot/actuators";
import { useApp } from "@/state/AppProvider";
import { StickyFooter } from "@/ui/StickyFooter";

export default function ScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { leadById, scheduleService, crm } = useApp();
  const toast = useToast();
  const lead = leadById(String(id));
  const days = useMemo(() => nextWorkshopDays(new Date(), 10), []);
  const [service, setService] = useState<ServiceTypeId>(serviceForAlert(lead?.iotAlert?.code));
  const [date, setDate] = useState(days[0]);
  const [slot, setSlot] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!lead) {
    return (
      <Screen title="Agendar serviço" back>
        <EmptyState title="Lead não encontrado" />
      </Screen>
    );
  }

  // Horários já ocupados na mesma concessionária e dia
  const taken = new Set(
    crm.appointments.filter((a) => a.status === "confirmado" && a.dealerCode === lead.dealerCode && a.date === date).map((a) => a.slot)
  );

  const confirm = async () => {
    if (!slot) return;
    setSaving(true);
    await scheduleService(lead, { serviceType: service, date, slot, dealerCode: lead.dealerCode });
    await successFeedback();
    toast.show({ title: "Serviço agendado!", message: `${longDate(date)} às ${slot} · Dealer ${lead.dealerCode}`, tone: "success" });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen back eyebrow="Agendar serviço" title={leadTitle(lead)} subtitle={`Oficina da concessionária ${lead.dealerCode}`}>
        <Section title="Serviço">
          <View style={styles.services}>
            {SERVICE_TYPES.map((s) => {
              const active = s.id === service;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setService(s.id)}
                  style={[styles.service, active && styles.serviceActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={s.icon as never} size={22} color={active ? colors.textOnBrand : colors.brand} />
                  <AppText variant="bodySmStrong" color={active ? colors.textOnBrand : colors.textPrimary} numberOfLines={2}>
                    {s.label}
                  </AppText>
                  <AppText variant="caption" color={active ? colors.textOnBrandMuted : colors.textMuted}>
                    ~{s.minutes} min
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Data">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
            {days.map((d) => {
              const dt = parseISODate(d);
              const active = d === date;
              return (
                <Pressable
                  key={d}
                  onPress={() => {
                    setDate(d);
                    setSlot(null);
                  }}
                  style={[styles.day, active && styles.dayActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <AppText variant="caption" color={active ? colors.textOnBrandMuted : colors.textMuted}>
                    {new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(dt).replace(".", "")}
                  </AppText>
                  <AppText variant="metricS" color={active ? colors.textOnBrand : colors.textPrimary}>
                    {dt.getDate()}
                  </AppText>
                  <AppText variant="caption" color={active ? colors.textOnBrandMuted : colors.textMuted}>
                    {new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(dt).replace(".", "")}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </Section>

        <Section title="Horário">
          <View style={styles.slots}>
            {TIME_SLOTS.map((s) => (
              <Chip key={s} label={taken.has(s) ? `${s} · ocupado` : s} selected={slot === s} onPress={() => !taken.has(s) && setSlot(s)} icon={taken.has(s) ? "lock-closed-outline" : "time-outline"} />
            ))}
          </View>
        </Section>

        <Card tone="muted">
          <AppText variant="overline" color={colors.textMuted}>
            Resumo
          </AppText>
          <MetricRow label="Serviço" value={serviceLabel(service)} />
          <MetricRow label="Quando" value={slot ? `${longDate(date)} às ${slot}` : `${longDate(date)} · escolha o horário`} />
          <MetricRow label="Veículo" value={`${leadTitle(lead)} · ${lead.vinMask}`} last />
        </Card>
        <View style={{ height: 60 }} />
      </Screen>
      <StickyFooter>
        <Button label="Confirmar agendamento" icon="checkmark-circle-outline" onPress={confirm} disabled={!slot} loading={saving} style={{ flex: 1 }} testID="schedule-confirm" />
      </StickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  services: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  service: {
    flexBasis: "31%",
    flexGrow: 1,
    minHeight: 104,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.xs
  },
  serviceActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  days: { gap: spacing.sm, paddingRight: spacing.lg },
  day: {
    width: 64,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 2
  },
  dayActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }
});
