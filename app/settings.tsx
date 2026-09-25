import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { getHealth } from "@/api/client";
import { AppText, Badge, Banner, Button, Card, colors, MetricRow, Screen, Section, spacing, TextField, useToast } from "@/design-system";
import { shortDate } from "@/domain/format";
import { useApp } from "@/state/AppProvider";
import { useAuth } from "@/state/AuthProvider";
import { AccessDenied } from "@/ui/AccessDenied";

export default function SettingsScreen() {
  const { can } = useAuth();
  const { settings, updateSettings, source, syncError, syncing, sync, snapshot, crm, resetLocalData } = useApp();
  const toast = useToast();
  const [apiUrl, setApiUrl] = useState(settings.apiUrl);
  const [testing, setTesting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

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

  if (!can("data.manage")) return <AccessDenied title="Dados" back message="Somente administradores alteram a fonte de dados." />;

  return (
    <Screen back eyebrow="Administração" title="Dados e sincronização">
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
          <MetricRow label="Alertas IoT" value={String(crm.alerts.length)} />
          <MetricRow label="Lembretes" value={String(crm.reminders.length)} last />
          <Button label={confirmReset ? "Toque de novo para confirmar" : "Apagar dados locais"} icon="trash-outline" variant="danger" size="sm" onPress={reset} />
        </Card>
      </Section>

    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  between: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }
});
