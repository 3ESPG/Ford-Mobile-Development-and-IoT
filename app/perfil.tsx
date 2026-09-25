import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText, Badge, Button, Card, colors, EmptyState, ListRow, MetricRow, Screen, Section, spacing, useToast } from "@/design-system";
import { ROLE_INFO } from "@/domain/auth";
import { percent } from "@/domain/format";
import { notificationsSupported } from "@/notifications/reminders";
import { useApp } from "@/state/AppProvider";
import { useAuth } from "@/state/AuthProvider";
import { useDealerScope } from "@/state/selectors";

const TEAM = [
  ["Felipe Braunstein e Silva", "RM554483"],
  ["Felipe do Nascimento Fernandes", "RM554598"],
  ["Henrique Ignacio Bartalo", "RM555274"],
  ["Gustavo Henrique Martins", "RM556956"]
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function PerfilScreen() {
  const { user, mode, signOut, can } = useAuth();
  const { snapshot, crm, customerById, source } = useApp();
  const { dealer: scopeDealer } = useDealerScope();
  const toast = useToast();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [leaving, setLeaving] = useState(false);

  if (!user) return null;

  const role = ROLE_INFO[user.role];
  const dealer = user.dealerCode ? snapshot.dealers.find((d) => d.dealerCode === user.dealerCode) : undefined;
  const now = new Date().toISOString();
  const reminders = crm.reminders.filter((r) => r.fireAt >= now && (!scopeDealer || customerById(r.customerId)?.dealerCode === scopeDealer));

  const logout = async () => {
    if (!confirmLogout) {
      setConfirmLogout(true);
      return;
    }
    setLeaving(true);
    await signOut();
    toast.show({ title: "Você saiu da conta", tone: "info" });
    router.replace("/login");
  };

  return (
    <Screen
      back
      eyebrow="Minha conta"
      title="Perfil"
      heroContent={
        <View style={styles.heroRow}>
          <View style={styles.avatar}>
            <AppText variant="displayM" color={colors.textOnBrand}>
              {initials(user.name)}
            </AppText>
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText variant="titleL" color={colors.textOnBrand}>
              {user.name}
            </AppText>
            <AppText variant="bodySm" color={colors.textOnBrandMuted}>
              {user.email}
            </AppText>
            <Badge label={role.label} tone="accent" solid icon="shield-checkmark-outline" />
          </View>
        </View>
      }
    >
      <Section title="Acesso">
        <Card>
          <MetricRow label="Perfil na API" value={role.apiRole} />
          <MetricRow label="O que você vê" value={role.description} />
          <MetricRow label="Sessão" value={mode === "api" ? "API (JWT)" : "Modo demo"} />
          <MetricRow label="Token" value="Guardado criptografado (SecureStore)" />
          <MetricRow label="Dados" value={source === "api" ? "API ao vivo" : "Base embarcada"} last />
        </Card>
      </Section>

      <Section title="Concessionária">
        {dealer ? (
          <Card padded={false}>
            <ListRow
              icon="business"
              tone="brand"
              title={`Dealer ${dealer.dealerCode}`}
              subtitle={`Service Share ${percent(dealer.serviceShare)} · rede ${percent(snapshot.overview.serviceShare)} · ${dealer.openLeads.toLocaleString("pt-BR")} clientes em risco`}
              onPress={can("network.view") ? () => router.push(`/dealer/${dealer.dealerCode}`) : undefined}
              last
            />
          </Card>
        ) : (
          <Card padded={false}>
            <ListRow icon="globe-outline" tone="brand" title="Rede Ford (todas as lojas)" subtitle={`${snapshot.dealers.length} concessionárias na base`} last />
          </Card>
        )}
      </Section>

      <Section title="Próximos lembretes" subtitle={notificationsSupported ? "Notificações locais agendadas no aparelho" : "Na web os lembretes não disparam notificação"}>
        {reminders.length === 0 ? (
          <EmptyState icon="alarm-outline" title="Nenhum lembrete agendado" message="Crie lembretes na ficha do cliente ou ao agendar um serviço." actionLabel="Ver clientes" onAction={() => router.push("/clientes")} />
        ) : (
          <Card padded={false}>
            {reminders.slice(0, 5).map((r, i) => (
              <ListRow
                key={r.id}
                icon={r.kind === "agendamento" ? "calendar-outline" : "alarm-outline"}
                tone="warning"
                title={r.title}
                subtitle={new Date(r.fireAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                onPress={() => router.push(`/cliente/${r.customerId}`)}
                last={i === Math.min(reminders.length, 5) - 1}
              />
            ))}
          </Card>
        )}
      </Section>

      {can("data.manage") ? (
        <Card padded={false}>
          <ListRow icon="server-outline" tone="info" title="Dados e sincronização" subtitle="URL da API, sincronização e dados locais" onPress={() => router.push("/settings")} last />
        </Card>
      ) : null}

      <Section title="Sobre">
        <Card>
          <MetricRow label="Aplicativo" value="Ford Service Pulse" />
          <MetricRow label="Versão" value={`${Constants.expoConfig?.version || "1.0.0"}${Constants.expoConfig?.android?.versionCode ? ` (build ${Constants.expoConfig.android.versionCode})` : ""}`} />
          <MetricRow label="Desafio" value="Ford × FIAP · Desafio 2 (VIN Share)" last />
        </Card>
        <Card>
          <AppText variant="overline" color={colors.textMuted}>
            Equipe
          </AppText>
          {TEAM.map(([name, rm], i) => (
            <MetricRow key={rm} label={name} value={rm} last={i === TEAM.length - 1} />
          ))}
        </Card>
      </Section>

      <Button
        label={confirmLogout ? "Toque de novo para sair" : "Sair da conta"}
        icon="log-out-outline"
        variant="danger"
        onPress={logout}
        loading={leaving}
        fullWidth
        testID="logout"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center"
  }
});
