import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText, Banner, Button, Card, colors, EmptyState, radii, Screen, Section, spacing, useToast } from "@/design-system";
import { CUSTOMER_PROFILES } from "@/domain/customers";
import { titleCase } from "@/domain/format";
import { REVISION_OPTIONS, revisionReminderDate, type RevisionReminderOption } from "@/domain/reminders";
import { successFeedback } from "@/iot/actuators";
import { notificationsSupported } from "@/notifications/reminders";
import { useApp } from "@/state/AppProvider";
import { StickyFooter } from "@/ui/StickyFooter";

const when = (d: Date) => d.toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** "Algo a mais": lembrete de revisão como notificação local */
export default function ReminderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customerById, createRevisionReminder } = useApp();
  const toast = useToast();
  const customer = customerById(String(id));
  const [option, setOption] = useState<RevisionReminderOption>(customer?.profile === "esquecido" ? "amanha" : "semana");
  const [saving, setSaving] = useState(false);

  if (!customer) {
    return (
      <Screen title="Lembrete" back>
        <EmptyState title="Cliente não encontrado" actionLabel="Voltar" onAction={() => router.back()} />
      </Screen>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      const { scheduled, fireAt } = await createRevisionReminder(customer, option);
      await successFeedback();
      toast.show(
        scheduled
          ? { title: "Lembrete agendado!", message: `Você será avisado ${when(fireAt)}.`, tone: "success" }
          : notificationsSupported
            ? { title: "Lembrete salvo", message: "Permissão de notificação negada: o lembrete fica na ficha do cliente.", tone: "warning" }
            : { title: "Lembrete salvo na ficha", message: `Previsto para ${when(fireAt)}. No app Android ele chega como notificação.`, tone: "success" }
      );
      router.back();
    } catch {
      toast.show({ title: "Não foi possível criar o lembrete", message: "Tente novamente.", tone: "danger" });
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen back eyebrow="Lembrete de revisão" title={customer.name} subtitle={`${titleCase(customer.vehicle.modelName)} · perfil ${CUSTOMER_PROFILES[customer.profile].label}`}>
        {customer.profile === "esquecido" ? (
          <Banner tone="warning" icon="alarm" title="Cliente Esquecido" message="Esse perfil costuma voltar com um lembrete no momento certo." />
        ) : null}

        <Section title="Quando avisar?">
          <View style={{ gap: spacing.sm }}>
            {REVISION_OPTIONS.map((o) => {
              const active = o.id === option;
              return (
                <Pressable
                  key={o.id}
                  onPress={() => setOption(o.id)}
                  style={[styles.option, active && styles.optionActive]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={active ? "radio-button-on" : "radio-button-off"} size={22} color={active ? colors.accent : colors.textMuted} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyStrong">{o.label}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {when(revisionReminderDate(o.id))}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Prévia da notificação">
          <Card tone="muted">
            <View style={styles.preview}>
              <View style={styles.previewIcon}>
                <Ionicons name="pulse" size={16} color={colors.textOnBrand} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodySmStrong">Lembrete de revisão: {customer.name}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {titleCase(customer.vehicle.modelName)} · perfil {CUSTOMER_PROFILES[customer.profile].label}. Envie a mensagem de revisão e ofereça um horário.
                </AppText>
              </View>
            </View>
          </Card>
          {!notificationsSupported ? (
            <AppText variant="caption" color={colors.textMuted}>
              Na pré-visualização web o lembrete é salvo, mas a notificação só dispara no app Android/iOS.
            </AppText>
          ) : null}
        </Section>
        <View style={{ height: 60 }} />
      </Screen>
      <StickyFooter>
        <Button label="Agendar lembrete" icon="alarm-outline" onPress={save} loading={saving} style={{ flex: 1 }} testID="reminder-save" />
      </StickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  optionActive: { borderColor: colors.accent, backgroundColor: colors.accentSubtle },
  preview: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  previewIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }
});
