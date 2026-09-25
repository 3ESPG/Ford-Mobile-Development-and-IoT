import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText, Button, Card, Chip, colors, EmptyState, MetricRow, radii, Screen, Section, spacing, TextField, useLayout, useToast } from "@/design-system";
import { longDate, parseISODate, titleCase } from "@/domain/format";
import { appointmentReminderDate } from "@/domain/reminders";
import { nextWorkshopDays, SERVICE_TYPES, serviceForAlert, serviceLabel, TIME_SLOTS, type ServiceTypeId } from "@/domain/schedule";
import { successFeedback } from "@/iot/actuators";
import { useApp } from "@/state/AppProvider";
import { StickyFooter } from "@/ui/StickyFooter";

export default function ScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { leadById, customerById, scheduleService, crm } = useApp();
  const toast = useToast();
  const { isCompact, isWide } = useLayout();
  const lead = leadById(String(id));
  const customer = customerById(String(id));
  // Agenda tanto leads quanto clientes fiéis (que não viram lead)
  const target = lead ?? (customer ? { id: customer.id, modelName: customer.vehicle.modelName, vinMask: customer.vehicle.vinMask, dealerCode: customer.dealerCode, modelYear: customer.vehicle.modelYear } : null);
  const days = useMemo(() => nextWorkshopDays(new Date(), 10), []);
  const [service, setService] = useState<ServiceTypeId>(serviceForAlert(lead?.iotAlert?.code));
  const [date, setDate] = useState(days[0]);
  const [slot, setSlot] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!target) {
    return (
      <Screen title="Agendar serviço" back>
        <EmptyState title="Cliente não encontrado" actionLabel="Voltar" onAction={() => router.back()} />
      </Screen>
    );
  }
  const title = `${titleCase(target.modelName)}${target.modelYear ? ` ${target.modelYear}` : ""}`;
  const reminderAt = slot ? appointmentReminderDate(date, slot) : null;
  const reminderText = !slot
    ? "Escolha o horário"
    : reminderAt
      ? `Notificação ${reminderAt.toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
      : "Sem lembrete (horário muito próximo)";

  // Horários já ocupados na mesma concessionária e dia
  const taken = new Set(
    crm.appointments.filter((a) => a.status === "confirmado" && a.dealerCode === target.dealerCode && a.date === date).map((a) => a.slot)
  );

  const confirm = async () => {
    if (!slot) return;
    setSaving(true);
    try {
      const { reminder } = await scheduleService(target, { serviceType: service, date, slot, dealerCode: target.dealerCode, note: note.trim() });
      await successFeedback();
      toast.show({
        title: "Serviço agendado!",
        message: `${longDate(date)} às ${slot} · Dealer ${target.dealerCode}${reminder ? " · lembrete criado" : ""}`,
        tone: "success"
      });
      router.back();
    } catch {
      toast.show({ title: "Não foi possível agendar", message: "Tente novamente.", tone: "danger" });
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen back eyebrow="Agendar serviço" title={title} subtitle={`Oficina da concessionária ${target.dealerCode}`}>
        <Section title="Serviço">
          <View style={styles.services}>
            {SERVICE_TYPES.map((s) => {
              const active = s.id === service;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setService(s.id)}
                  style={[styles.service, { flexBasis: isWide ? "15%" : isCompact ? "47%" : "31%" }, active && styles.serviceActive]}
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

        <Section title="Observação" subtitle="Opcional: aparece no histórico do cliente">
          <TextField value={note} onChangeText={setNote} placeholder="Ex.: cliente pediu leva-e-traz, verificar ruído na suspensão…" multiline />
        </Section>

        <Card tone="muted">
          <AppText variant="overline" color={colors.textMuted}>
            Resumo
          </AppText>
          <MetricRow label="Serviço" value={serviceLabel(service)} />
          <MetricRow label="Quando" value={slot ? `${longDate(date)} às ${slot}` : `${longDate(date)} · escolha o horário`} />
          {note.trim() ? <MetricRow label="Observação" value={note.trim()} /> : null}
          <MetricRow label="Veículo" value={`${title} · ${target.vinMask}`} />
          <MetricRow label="Lembrete" value={reminderText} last />
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
