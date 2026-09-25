import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  AppText,
  Badge,
  Button,
  Card,
  colors,
  EmptyState,
  IconTile,
  KpiGrid,
  KpiTile,
  Screen,
  Section,
  SegmentedControl,
  spacing,
  useToast
} from "@/design-system";
import { longDate, relativeTime, titleCase } from "@/domain/format";
import { CHANNELS, OUTCOMES } from "@/domain/leads";
import { SERVICE_TYPES, serviceLabel } from "@/domain/schedule";
import type { Appointment } from "@/domain/types";
import { successFeedback } from "@/iot/actuators";
import { useApp } from "@/state/AppProvider";
import { ProfileButton } from "@/ui/ProfileButton";

export default function AgendaScreen() {
  const { crm, setAppointmentStatus, leadById } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState<"proximos" | "historico">("proximos");
  const today = new Date().toISOString().slice(0, 10);

  const upcoming = crm.appointments.filter((a) => a.status === "confirmado");
  const done = crm.appointments.filter((a) => a.status !== "confirmado");
  const completed = crm.appointments.filter((a) => a.status === "concluido").length;
  const cancelled = crm.appointments.filter((a) => a.status === "cancelado").length;
  const showRate = completed + cancelled ? Math.round((completed / (completed + cancelled)) * 100) : null;

  const grouped = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    upcoming.forEach((a) => map.set(a.date, [...(map.get(a.date) || []), a]));
    return [...map.entries()];
  }, [upcoming]);

  const update = async (a: Appointment, status: Appointment["status"]) => {
    await setAppointmentStatus(a, status);
    if (status === "concluido") {
      await successFeedback();
      toast.show({ title: "Cliente retido na rede Ford!", message: `${titleCase(a.modelName)} · VIN ${a.vinMask}`, tone: "success" });
    } else {
      toast.show({ title: "Agendamento cancelado", message: "O lead voltou para 'Em contato'.", tone: "warning" });
    }
  };

  return (
    <Screen
      eyebrow="Oficina"
      title="Agenda de serviços"
      subtitle="Agendamentos gerados a partir dos leads. Conclua para registrar a retenção do VIN."
      heroRight={<ProfileButton />}
      heroContent={
        <SegmentedControl
          inverse
          value={tab}
          onChange={setTab}
          options={[
            { value: "proximos", label: `Próximos (${upcoming.length})` },
            { value: "historico", label: "Histórico" }
          ]}
        />
      }
    >
      <KpiGrid>
        <KpiTile icon="calendar-outline" label="Agendados" value={String(upcoming.length)} tone="info" />
        <KpiTile icon="shield-checkmark-outline" label="VINs retidos" value={String(completed)} detail={showRate !== null ? `${showRate}% de comparecimento` : "Conclua um serviço"} tone="success" />
      </KpiGrid>

      {tab === "proximos" ? (
        grouped.length === 0 ? (
          <EmptyState
            title="Nenhum serviço agendado"
            message="Abra um lead da fila e toque em “Agendar” para reservar um horário na oficina."
            actionLabel="Ir para a fila de leads"
            onAction={() => router.push("/leads")}
          />
        ) : (
          grouped.map(([date, items]) => (
            <Section key={date} title={longDate(date)} subtitle={date === today ? "Hoje" : `${items.length} serviço(s)`}>
              {items.map((a) => {
                const icon = SERVICE_TYPES.find((s) => s.id === a.serviceType)?.icon || "construct-outline";
                return (
                  <Card key={a.id} onPress={() => router.push(`/lead/${a.leadId}`)}>
                    <View style={styles.row}>
                      <IconTile name={icon as never} tone="info" />
                      <View style={{ flex: 1 }}>
                        <AppText variant="titleM">{serviceLabel(a.serviceType)}</AppText>
                        <AppText variant="caption" color={colors.textMuted}>
                          {titleCase(a.modelName)} · VIN {a.vinMask} · Dealer {a.dealerCode}
                        </AppText>
                      </View>
                      <Badge label={a.slot} tone="brand" icon="time-outline" />
                    </View>
                    {leadById(a.leadId)?.iotAlert ? <Badge label="Originado por alerta IoT" tone="iot" icon="hardware-chip-outline" /> : null}
                    <View style={styles.actions}>
                      <Button label="Cancelar" variant="danger" size="sm" onPress={() => update(a, "cancelado")} style={{ flex: 1 }} />
                      <Button label="Cliente compareceu" icon="checkmark" size="sm" onPress={() => update(a, "concluido")} style={{ flex: 1.4 }} />
                    </View>
                  </Card>
                );
              })}
            </Section>
          ))
        )
      ) : (
        <>
          <Section title="Serviços encerrados">
            {done.length === 0 ? (
              <EmptyState title="Sem serviços encerrados" message="Serviços concluídos ou cancelados aparecem aqui." />
            ) : (
              done.map((a) => (
                <Card key={a.id} onPress={() => router.push(`/lead/${a.leadId}`)} style={styles.row}>
                  <IconTile name={a.status === "concluido" ? "shield-checkmark" : "close-circle"} tone={a.status === "concluido" ? "success" : "danger"} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="titleS">{serviceLabel(a.serviceType)}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {titleCase(a.modelName)} · {longDate(a.date)} às {a.slot}
                    </AppText>
                  </View>
                  <Badge label={a.status === "concluido" ? "Retido" : "Cancelado"} tone={a.status === "concluido" ? "success" : "danger"} />
                </Card>
              ))
            )}
          </Section>
          <Section title="Últimos contatos">
            {crm.interactions.length === 0 ? (
              <EmptyState title="Nenhum contato registrado" />
            ) : (
              crm.interactions.slice(0, 15).map((i) => {
                const lead = leadById(i.leadId);
                return (
                  <Card key={i.id} onPress={() => router.push(`/lead/${i.leadId}`)} style={styles.row}>
                    <IconTile name={CHANNELS[i.channel].icon as never} tone={i.outcome === "recusou" ? "danger" : "accent"} size="sm" />
                    <View style={{ flex: 1 }}>
                      <AppText variant="titleS">{lead ? `${titleCase(lead.modelName)} ${lead.modelYear || ""}` : i.leadId}</AppText>
                      <AppText variant="caption" color={colors.textMuted}>
                        {CHANNELS[i.channel].label} · {OUTCOMES[i.outcome].label} · {relativeTime(i.createdAt)}
                      </AppText>
                    </View>
                  </Card>
                );
              })
            )}
          </Section>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm }
});
