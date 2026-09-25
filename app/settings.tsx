import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { getHealth } from "@/api/client";
import { AppText, Badge, Banner, Button, Card, colors, IconTile, MetricRow, Screen, Section, spacing, TextField, useToast } from "@/design-system";
import { shortDate } from "@/domain/format";
import { useApp } from "@/state/AppProvider";

const TEAM = [
  ["Felipe Braunstein e Silva", "RM554483"],
  ["Felipe do Nascimento Fernandes", "RM554598"],
  ["Henrique Ignacio Bartalo", "RM555274"],
  ["Gustavo Henrique Martins", "RM556956"]
];

export default function SettingsScreen() {
  const { settings, updateSettings, signOut, source, syncError, syncing, sync, snapshot, crm, resetLocalData } = useApp();
  const toast = useToast();
  const [apiUrl, setApiUrl] = useState(settings.apiUrl);
  const [testing, setTesting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const profile = settings.profile;

  const saveApi = async () => {
    const value = apiUrl.trim();
    if (!value) {
      await updateSettings({ apiUrl: "" });
      toast.show({ title: "Modo offline", message: "Usando a base embarcada no app.", tone: "info" });
      return;
    }
    setTesting(true);
    try {
      await getHealth(value);
      await updateSettings({ apiUrl: value });
      toast.show({ title: "API conectada", message: value, tone: "success" });
    } catch (err) {
      toast.show({ title: "API inacessível", message: err instanceof Error ? err.message : undefined, tone: "danger" });
    } finally {
      setTesting(false);
    }
  };

  const reset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    await resetLocalData();
    setConfirmReset(false);
    toast.show({ title: "Dados locais apagados", tone: "warning" });
  };

  return (
    <Screen back eyebrow="Conta e dados" title="Ajustes">
      <Card style={styles.row}>
        <IconTile name="person" tone="brand" size="lg" />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="titleM">{profile?.name}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {profile?.role === "gestor" ? "Gestor Ford · visão da rede" : `Consultor de serviço · Dealer ${profile?.dealerCode}`}
          </AppText>
        </View>
        <Button
          label="Trocar"
          size="sm"
          variant="secondary"
          onPress={async () => {
            await signOut();
            router.replace("/welcome");
          }}
        />
      </Card>

      <Section title="Fonte de dados" subtitle="O app é offline-first: sem API, usa a base embarcada">
        <Card>
          <View style={styles.between}>
            <AppText variant="bodySmStrong">Origem atual</AppText>
            <Badge label={source === "api" ? "API ao vivo" : "Base embarcada"} tone={source === "api" ? "success" : "neutral"} />
          </View>
          <MetricRow label="Dados até" value={shortDate(snapshot.meta.analysisDate)} />
          <MetricRow label="Leads na amostra" value={String(snapshot.leads.length)} last />
          {syncError && settings.apiUrl ? <Banner tone="warning" icon="cloud-offline-outline" title="Sincronização falhou" message={`${syncError}. Continuando com a base embarcada.`} /> : null}
          <AppText variant="caption" color={colors.textSecondary}>
            URL da API (ex.: http://192.168.0.10:3333)
          </AppText>
          <TextField value={apiUrl} onChangeText={setApiUrl} placeholder="Vazio = modo offline" keyboardType="url" />
          <View style={styles.row}>
            <Button label="Salvar e testar" icon="pulse-outline" size="sm" onPress={saveApi} loading={testing} style={{ flex: 1 }} />
            <Button label="Sincronizar" icon="sync-outline" size="sm" variant="secondary" onPress={sync} loading={syncing} disabled={!settings.apiUrl} style={{ flex: 1 }} />
          </View>
        </Card>
      </Section>

      <Section title="Dados do aparelho" subtitle={Platform.OS === "web" ? "Pré-visualização web (localStorage)" : "Banco SQLite local (expo-sqlite)"}>
        <Card>
          <MetricRow label="Leads com status" value={String(Object.keys(crm.statuses).length)} />
          <MetricRow label="Contatos registrados" value={String(crm.interactions.length)} />
          <MetricRow label="Agendamentos" value={String(crm.appointments.length)} />
          <MetricRow label="Alertas IoT" value={String(crm.alerts.length)} last />
          <Button label={confirmReset ? "Toque de novo para confirmar" : "Apagar dados locais"} icon="trash-outline" variant="danger" size="sm" onPress={reset} />
        </Card>
      </Section>

      <Section title="Sobre">
        <Card>
          <MetricRow label="Aplicativo" value={`Ford Service Pulse v${Constants.expoConfig?.version || "1.0.0"}`} />
          <MetricRow label="Desafio" value="Ford × FIAP · Desafio 2 (VIN Share)" />
          <MetricRow label="Stack" value="Expo SDK 54 · React Native · Expo Router · SQLite · Sensors" last />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }
});
