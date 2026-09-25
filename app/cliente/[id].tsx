import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Linking, StyleSheet, View } from "react-native";
import {
  AppText,
  Badge,
  Button,
  Card,
  colors,
  EmptyState,
  IconTile,
  ListRow,
  MetricRow,
  ProgressBar,
  RingGauge,
  Screen,
  Section,
  spacing,
  toneColors,
  useLayout,
  useToast
} from "@/design-system";
import { CUSTOMER_PROFILES, HIGH_USAGE_KM, profileMessage, vehicleAge } from "@/domain/customers";
import { daysToMonths, km, number, shortDate, titleCase } from "@/domain/format";
import { LEAD_STATUS } from "@/domain/leads";
import { useApp } from "@/state/AppProvider";
import { riskColor } from "@/ui/CustomerCard";
import { ProfileBadge } from "@/ui/ProfileBadge";
import { StickyFooter } from "@/ui/StickyFooter";

const digits = (phone: string) => phone.replace(/\D/g, "");

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customerById, leadById, snapshot, crm, deleteReminder } = useApp();
  const toast = useToast();
  const { isCompact } = useLayout();
  const customer = customerById(String(id));

  if (!customer) {
    return (
      <Screen title="Cliente" back>
        <EmptyState title="Cliente não encontrado" message="Ele pode ter saído da base após a última sincronização." actionLabel="Voltar" onAction={() => router.back()} />
      </Screen>
    );
  }

  const info = CUSTOMER_PROFILES[customer.profile];
  const lead = customer.leadId ? leadById(customer.leadId) : undefined;
  const age = vehicleAge(customer.vehicle.modelYear, snapshot.meta.analysisDate);
  const reminders = crm.reminders.filter((r) => r.customerId === customer.id);
  const appointments = crm.appointments.filter((a) => a.leadId === customer.id && a.status === "confirmado");

  const open = async (url: string, fallback: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      toast.show({ title: fallback, tone: "warning" });
    }
  };
  const call = () => open(`tel:${digits(customer.phone)}`, "Ligação indisponível neste dispositivo");
  const whatsapp = () => open(`https://wa.me/${digits(customer.phone)}?text=${encodeURIComponent(profileMessage(customer))}`, "WhatsApp indisponível");
  const schedule = () => router.push(`/schedule/${customer.id}`);
  const remind = () => router.push(`/reminder/${customer.id}`);

  const ctaAction = { agendar: schedule, ligar: call, lembrete: remind, whatsapp }[info.action.cta];
  const ctaLabel = { agendar: "Agendar revisão", ligar: "Ligar agora", lembrete: "Criar lembrete", whatsapp: "Enviar oferta no WhatsApp" }[info.action.cta];
  const ctaIcon = { agendar: "calendar-outline", ligar: "call-outline", lembrete: "alarm-outline", whatsapp: "logo-whatsapp" }[info.action.cta];

  // Variáveis que explicam o perfil previsto
  const drivers = [
    { label: "Recência", value: `${daysToMonths(customer.daysSinceService)} meses sem serviço`, pct: Math.min(100, (customer.daysSinceService / 1800) * 100) },
    { label: "Frequência na rede", value: `${customer.serviceCount} passagem(ns)`, pct: Math.min(100, (customer.serviceCount / 6) * 100) },
    {
      label: "Rodagem",
      value: customer.vehicle.kmPerYear ? `${number(customer.vehicle.kmPerYear)} km/ano` : "Não disponível",
      pct: Math.min(100, ((customer.vehicle.kmPerYear || 0) / (HIGH_USAGE_KM * 1.5)) * 100)
    }
  ];

  return (
    <View style={{ flex: 1 }}>
      <Screen
        back
        eyebrow={`Cliente desde ${shortDate(customer.customerSince)} · Dealer ${customer.dealerCode}`}
        title={customer.name}
        heroContent={
          <View style={styles.heroRow}>
            <RingGauge value={customer.riskScore} size={isCompact ? 72 : 88} stroke={isCompact ? 8 : 9} color={riskColor(customer.riskScore)} track="rgba(255,255,255,0.16)">
              <AppText variant="metricS" color={colors.textOnBrand}>
                {customer.riskScore}
              </AppText>
              <AppText variant="caption" color={colors.textOnBrandMuted}>
                risco
              </AppText>
            </RingGauge>
            <View style={{ flex: 1, gap: spacing.sm }}>
              <AppText variant="overline" color={colors.textOnBrandMuted}>
                Perfil previsto
              </AppText>
              <View style={styles.badges}>
                <ProfileBadge profile={customer.profile} solid />
                {lead ? <Badge label={`Lead ${LEAD_STATUS[lead.status].label}`} tone={LEAD_STATUS[lead.status].tone} /> : null}
              </View>
              <AppText variant="caption" color={colors.textOnBrandMuted}>
                Confiança da classificação: {Math.round(customer.confidence * 100)}%
              </AppText>
            </View>
          </View>
        }
      >
        <Section title="Ação recomendada" subtitle={`Para clientes do perfil ${info.label}`}>
          <Card style={{ borderColor: toneColors[info.tone].bg }}>
            <View style={styles.row}>
              <IconTile name={info.icon as never} tone={info.tone} size="lg" />
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="titleM">{info.action.title}</AppText>
                <AppText variant="bodySm" color={colors.textSecondary}>
                  {info.action.detail}
                </AppText>
              </View>
            </View>
            <Button label={ctaLabel} icon={ctaIcon as never} onPress={ctaAction} fullWidth testID="customer-cta" />
          </Card>
        </Section>

        <Section title="Contato">
          <Card padded={false}>
            <ListRow icon="call-outline" tone="accent" title={customer.phone} subtitle="Celular" onPress={call} />
            <ListRow icon="logo-whatsapp" tone="success" title="WhatsApp" subtitle="Mensagem pronta para o perfil do cliente" onPress={whatsapp} />
            <ListRow icon="mail-outline" tone="info" title={customer.email} subtitle="E-mail" last />
          </Card>
          <AppText variant="caption" color={colors.textMuted}>
            A base da Ford é anonimizada (LGPD). Nome e contatos são fictícios no modo demo.
          </AppText>
        </Section>

        <Section title="Veículo">
          <Card>
            <MetricRow label="Modelo" value={`${titleCase(customer.vehicle.modelName)} ${customer.vehicle.modelYear ?? ""}`} />
            <MetricRow label="VIN" value={customer.vehicle.vinMask} />
            <MetricRow label="Idade do veículo" value={age === null ? "Não disponível" : `${age} ano(s)`} valueColor={age !== null && age >= 4 ? colors.warning : colors.textPrimary} />
            <MetricRow label="KM no último serviço" value={km(customer.vehicle.km)} />
            <MetricRow label="Rodagem estimada" value={customer.vehicle.kmPerYear ? `${number(customer.vehicle.kmPerYear)} km/ano` : "Não disponível"} />
            <MetricRow label="Fim da garantia" value={shortDate(customer.vehicle.warrantyEndDate)} last />
          </Card>
        </Section>

        <Section title="Histórico de serviços" subtitle={`${customer.serviceCount} ordem(ns) de serviço paga(s) na rede Ford`}>
          <Card>
            {appointments.map((a) => (
              <TimelineItem key={`a${a.id}`} icon="calendar" color={colors.info} title={`Agendado · ${shortDate(a.date)} às ${a.slot}`} subtitle={a.note || "Serviço marcado pelo app"} />
            ))}
            {customer.services.map((s) => (
              <TimelineItem key={s.id} icon="construct" color={colors.success} title={`${s.type} · ${shortDate(s.date)}`} subtitle={`${km(s.km)} · Dealer ${customer.dealerCode}`} />
            ))}
          </Card>
        </Section>

        <Section title="Por que este perfil?" subtitle={info.description}>
          <Card>
            {drivers.map((d) => (
              <View key={d.label} style={{ gap: spacing.xs }}>
                <View style={styles.between}>
                  <AppText variant="bodySmStrong">{d.label}</AppText>
                  <AppText variant="bodySm" color={colors.textSecondary}>
                    {d.value}
                  </AppText>
                </View>
                <ProgressBar value={d.pct} color={toneColors[info.tone].fg} height={6} />
              </View>
            ))}
          </Card>
        </Section>

        <Section title="Lembretes" actionLabel="Novo" onAction={remind}>
          {reminders.length === 0 ? (
            <EmptyState icon="alarm-outline" title="Nenhum lembrete" message="Crie um lembrete para não perder a próxima revisão deste cliente." />
          ) : (
            <Card padded={false}>
              {reminders.map((r, i) => (
                <ListRow
                  key={r.id}
                  icon={r.kind === "agendamento" ? "calendar-outline" : "alarm-outline"}
                  tone="warning"
                  title={r.title}
                  subtitle={`${new Date(r.fireAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}${r.notificationId ? "" : " · sem notificação"}`}
                  right={
                    <Button
                      label="Remover"
                      size="sm"
                      variant="ghost"
                      onPress={async () => {
                        await deleteReminder(r);
                        toast.show({ title: "Lembrete removido", tone: "info" });
                      }}
                    />
                  }
                  last={i === reminders.length - 1}
                />
              ))}
            </Card>
          )}
        </Section>

        {lead ? <Button label="Abrir lead e score explicável" variant="secondary" icon="flash-outline" onPress={() => router.push(`/lead/${lead.id}`)} /> : null}
        <View style={{ height: 60 }} />
      </Screen>

      <StickyFooter>
        <Button label="WhatsApp" icon="logo-whatsapp" variant="secondary" style={{ flex: 1 }} onPress={whatsapp} />
        <Button label="Agendar" icon="calendar-outline" style={{ flex: 1 }} onPress={schedule} testID="customer-schedule" />
      </StickyFooter>
    </View>
  );
}

function TimelineItem({ icon, color, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; subtitle: string }) {
  return (
    <View style={styles.timeline}>
      <View style={[styles.timelineDot, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodySmStrong">{title}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: "row", gap: spacing.lg, alignItems: "center" },
  badges: { flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" },
  row: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  timeline: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  timelineDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" }
});
