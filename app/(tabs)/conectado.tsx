import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  AppText,
  Badge,
  Banner,
  Button,
  Card,
  Chip,
  ChipRow,
  colors,
  IconTile,
  ProgressBar,
  radii,
  RingGauge,
  Screen,
  Section,
  SegmentedControl,
  Sparkline,
  StatusDot,
  spacing,
  useLayout,
  useToast,
  type IconName,
  type Tone
} from "@/design-system";
import { drivingLabel, drivingScore, HARSH_THRESHOLD_G } from "@/domain/driving";
import { decimal, km, number, relativeTime, titleCase } from "@/domain/format";
import { connectedFleet } from "@/domain/fleet";
import { DTC_DESCRIPTIONS, evaluateRules, healthScore, SCENARIOS, severityRank, type RuleHit, type TirePressures } from "@/domain/telemetry";
import type { AlertSeverity, TelemetryMode } from "@/domain/types";
import { notifyAlert } from "@/iot/actuators";
import { useDrivingSensor } from "@/iot/useDrivingSensor";
import { useTelemetry } from "@/iot/useTelemetry";
import { useApp } from "@/state/AppProvider";
import { useDealerScope } from "@/state/selectors";
import { ProfileButton } from "@/ui/ProfileButton";

const SEVERITY: Record<AlertSeverity, { label: string; tone: Tone }> = {
  critical: { label: "Crítico", tone: "danger" },
  warning: { label: "Atenção", tone: "warning" },
  info: { label: "Info", tone: "info" }
};

const MODE_HELP: Record<TelemetryMode, string> = {
  simulado: "Gerador local no app — funciona sem internet.",
  http: "Polling REST a cada 2 s na API (/api/vehicles/:vin/telemetry).",
  websocket: "Stream em tempo real (push) via WebSocket da API."
};

export default function ConectadoScreen() {
  const { fleet: networkFleet, snapshot, settings, updateSettings, raiseAlert, crm, acknowledgeAlert } = useApp();
  const { dealer } = useDealerScope();
  // gestor/consultor monitoram os veículos da própria loja; admin, a frota da rede.
  // snapshot.leads é estável: mudanças no CRM (novos alertas) não reiniciam a telemetria.
  const fleet = useMemo(() => {
    const own = dealer ? snapshot.leads.filter((l) => l.dealerCode === dealer) : [];
    return own.length ? connectedFleet(own, 5, false) : networkFleet;
  }, [dealer, snapshot.leads, networkFleet]);
  const toast = useToast();
  const focused = useIsFocused();
  const [vin, setVin] = useState(fleet[0]?.lead.id);
  const vehicle = fleet.find((v) => v.lead.id === vin) || fleet[0];
  const mode = settings.telemetryMode;
  // Só consome telemetria com a aba em foco (economia de bateria/rede)
  const telemetry = useTelemetry(focused ? vehicle : undefined, mode, settings.apiUrl);
  const driving = useDrivingSensor();
  const [chartWidth, setChartWidth] = useState(0);

  const frame = telemetry.frame;
  const hits = useMemo<RuleHit[]>(() => {
    if (!frame) return [];
    const list = evaluateRules(frame);
    if (driving.state.harshEvents >= 3) {
      list.push({
        code: "DRIVING_HARSH",
        severity: "warning",
        title: "Condução agressiva detectada",
        message: `${driving.state.harshEvents} eventos bruscos pelo acelerômetro — revisar freios e pneus.`
      });
    }
    return list.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  }, [frame, driving.state.harshEvents]);
  const health = healthScore(hits);

  // Regras → alerta persistido (SQLite) → lead preditivo + atuador (vibração)
  const raised = useRef(new Set<string>());
  useEffect(() => {
    if (!vehicle) return;
    hits
      .filter((h) => h.severity !== "info")
      .forEach(async (hit) => {
        const key = `${vehicle.lead.id}:${hit.code}`;
        if (raised.current.has(key)) return;
        raised.current.add(key);
        const created = await raiseAlert(vehicle.lead.id, vehicle.lead.id, hit);
        if (created) {
          await notifyAlert(hit.severity);
          toast.show({ title: `Lead preditivo: ${hit.title}`, message: `${titleCase(vehicle.lead.modelName)} · VIN ${vehicle.lead.vinMask}`, tone: "iot" });
        }
      });
  }, [hits, vehicle, raiseAlert, toast]);

  const vehicleAlerts = crm.alerts.filter((a) => a.vin === vehicle?.lead.id);
  const linkTone: Tone = telemetry.status === "online" ? "success" : telemetry.status === "error" ? "danger" : "warning";
  const linkLabel = telemetry.status === "online" ? "Online" : telemetry.status === "error" ? "Sem conexão" : "Conectando…";

  if (!vehicle) return null;

  return (
    <Screen
      eyebrow="Veículo conectado · IoT"
      title="Telemetria ao vivo"
      heroRight={<ProfileButton />}
      heroContent={
        <>
          <SegmentedControl
            inverse
            value={mode}
            onChange={(m) => updateSettings({ telemetryMode: m })}
            options={[
              { value: "simulado", label: "Simulado" },
              { value: "http", label: "HTTP" },
              { value: "websocket", label: "WebSocket" }
            ]}
          />
          <View style={styles.linkRow}>
            <StatusDot tone={linkTone} />
            <AppText variant="caption" color={colors.textOnBrand}>
              {linkLabel}
              {telemetry.status === "online" ? ` · ${telemetry.messages} leituras${telemetry.latencyMs !== null && mode !== "simulado" ? ` · ${telemetry.latencyMs} ms` : ""}` : ""}
            </AppText>
            <AppText variant="caption" color={colors.textOnBrandMuted} style={{ flex: 1, textAlign: "right" }} numberOfLines={1}>
              {MODE_HELP[mode]}
            </AppText>
          </View>
        </>
      }
    >
      <ChipRow>
        {fleet.map((v) => (
          <Chip key={v.lead.id} label={titleCase(v.lead.modelName)} icon="car-sport-outline" selected={v.lead.id === vehicle.lead.id} onPress={() => setVin(v.lead.id)} />
        ))}
      </ChipRow>

      {telemetry.status === "error" ? (
        <Card>
          <Banner tone="danger" icon="cloud-offline-outline" title="Não foi possível conectar à API" message={telemetry.error || undefined} />
          <View style={styles.row}>
            <Button label="Usar simulado" size="sm" icon="flash-outline" onPress={() => updateSettings({ telemetryMode: "simulado" })} style={{ flex: 1 }} />
            <Button label="Ajustes" size="sm" variant="secondary" icon="settings-outline" onPress={() => router.push("/settings")} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : null}

      <Card>
        <View style={styles.row}>
          <RingGauge value={frame ? health : 0} size={96} stroke={10} color={health >= 80 ? colors.success : health >= 50 ? colors.warning : colors.danger}>
            <AppText variant="metricS">{frame ? health : "—"}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              saúde
            </AppText>
          </RingGauge>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="titleL">
              {titleCase(vehicle.lead.modelName)} {vehicle.lead.modelYear || ""}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              VIN {vehicle.lead.vinMask} · Dealer {vehicle.lead.dealerCode}
            </AppText>
            <Badge label={`Cenário: ${SCENARIOS[vehicle.scenario]}`} tone="iot" icon="pulse-outline" />
          </View>
        </View>
        <View style={styles.liveRow}>
          <Live label="Velocidade" value={frame ? `${frame.speedKmh}` : "—"} unit="km/h" />
          <Live label="Rotação" value={frame ? number(frame.rpm) : "—"} unit="rpm" />
          <Live label="Odômetro" value={frame ? number(Math.round(frame.odometerKm)) : "—"} unit="km" />
        </View>
        <View onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
          <Sparkline data={telemetry.speedHistory} width={chartWidth} height={56} max={130} />
        </View>
      </Card>

      <Section title="Sensores do veículo" subtitle="Leituras do módulo OBD-II / TCU">
        <View style={styles.grid}>
          <SensorTile icon="water-outline" label="Vida do óleo" value={frame ? `${decimal(frame.oilLifePct)}%` : "—"} progress={frame?.oilLifePct} tone={!frame ? "neutral" : frame.oilLifePct <= 15 ? "danger" : "success"} />
          <SensorTile icon="battery-charging-outline" label="Bateria" value={frame ? `${decimal(frame.batteryV)} V` : "—"} progress={frame ? ((frame.batteryV - 11) / 3.5) * 100 : undefined} tone={!frame ? "neutral" : frame.batteryV < 13.2 ? "warning" : "success"} />
          <SensorTile icon="thermometer-outline" label="Motor" value={frame ? `${decimal(frame.coolantC)} °C` : "—"} progress={frame ? (frame.coolantC / 120) * 100 : undefined} tone={!frame ? "neutral" : frame.coolantC >= 108 ? "danger" : "accent"} />
          <SensorTile icon="speedometer-outline" label="Próxima revisão" value={frame ? km(frame.kmToService) : "—"} progress={frame ? frame.kmToService / 100 : undefined} tone={!frame ? "neutral" : frame.kmToService <= 1500 ? "warning" : "accent"} />
        </View>
      </Section>

      <Section title="Pressão dos pneus" subtitle="psi · ideal entre 32 e 35">
        <Card>{frame ? <TireDiagram psi={frame.tirePsi} /> : <AppText color={colors.textMuted}>Aguardando leitura…</AppText>}</Card>
      </Section>

      <Section title="Alertas das regras" subtitle="Avaliados a cada leitura; críticos e de atenção viram leads preditivos">
        {hits.length === 0 ? (
          <Card>
            <Banner tone="success" icon="shield-checkmark" title="Nenhuma anomalia detectada" message="Todos os sensores dentro dos limites." />
          </Card>
        ) : (
          hits.map((h) => (
            <Card key={h.code} style={styles.row}>
              <IconTile name={h.code.startsWith("DTC") ? "warning" : h.code.startsWith("TIRE") ? "disc-outline" : h.code.startsWith("OIL") ? "water" : h.code.startsWith("DRIVING") ? "phone-portrait-outline" : "alert-circle-outline"} tone={SEVERITY[h.severity].tone} />
              <View style={{ flex: 1 }}>
                <AppText variant="titleS">{h.title}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {h.message}
                </AppText>
              </View>
              <Badge label={SEVERITY[h.severity].label} tone={SEVERITY[h.severity].tone} />
            </Card>
          ))
        )}
        {vehicleAlerts.some((a) => !a.acknowledged) ? (
          <Button label="Abrir lead e agendar serviço" icon="calendar-outline" onPress={() => router.push(`/lead/${vehicle.lead.id}`)} fullWidth />
        ) : null}
        {frame && frame.dtc.length ? (
          <Card tone="muted">
            <AppText variant="overline" color={colors.textMuted}>
              Códigos de diagnóstico (DTC)
            </AppText>
            {frame.dtc.map((c) => (
              <AppText key={c} variant="bodySm">
                <AppText variant="bodySmStrong">{c}</AppText> — {DTC_DESCRIPTIONS[c] || "Código registrado pela ECU"}
              </AppText>
            ))}
          </Card>
        ) : null}
      </Section>

      <Section title="Sensor do celular" subtitle="Acelerômetro (expo-sensors) como sensor inercial de condução">
        <Card>
          {driving.available === false ? (
            <Banner tone="neutral" icon="phone-portrait-outline" title="Acelerômetro indisponível" message="Rode o APK em um celular Android para usar este sensor." />
          ) : (
            <>
              <View style={styles.row}>
                <RingGauge value={drivingScore(driving.state)} size={72} stroke={8} color={colors.iot}>
                  <AppText variant="bodyStrong">{drivingScore(driving.state)}</AppText>
                </RingGauge>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="titleS">{drivingLabel(drivingScore(driving.state))}</AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    {driving.state.harshEvents} evento(s) brusco(s) · pico {decimal(driving.state.peakG, 2)} g
                  </AppText>
                </View>
              </View>
              <View style={{ gap: spacing.xs }}>
                <View style={styles.between}>
                  <AppText variant="caption" color={colors.textMuted}>
                    Aceleração dinâmica agora
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    limite {decimal(HARSH_THRESHOLD_G, 2)} g
                  </AppText>
                </View>
                <ProgressBar value={(driving.state.currentG / (HARSH_THRESHOLD_G * 1.5)) * 100} color={driving.state.currentG >= HARSH_THRESHOLD_G ? colors.danger : colors.iot} />
              </View>
              <View style={styles.row}>
                <Button
                  label={driving.enabled ? "Pausar sensor" : "Iniciar sensor"}
                  icon={driving.enabled ? "pause" : "play"}
                  size="sm"
                  variant={driving.enabled ? "secondary" : "primary"}
                  onPress={() => driving.setEnabled(!driving.enabled)}
                  style={{ flex: 1 }}
                />
                <Button label="Zerar" size="sm" variant="ghost" icon="refresh" onPress={driving.reset} />
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                Dica: com o sensor ligado, sacuda o celular para simular frenagens bruscas. Três eventos geram um alerta de desgaste de freios.
              </AppText>
            </>
          )}
        </Card>
      </Section>

      <Section title="Atuação remota" subtitle="Comando enviado ao veículo pelo mesmo canal da telemetria">
        <Card>
          <AppText variant="bodySm" color={colors.textSecondary}>
            Injeta o código P0301 (falha de ignição) para demonstrar o fluxo completo: regra → alerta → vibração do celular (atuador) → lead preditivo → agendamento.
          </AppText>
          <Button label="Simular falha no motor" icon="flash" variant="secondary" onPress={() => telemetry.simulateFault("P0301")} disabled={telemetry.status !== "online"} />
        </Card>
      </Section>

      {vehicleAlerts.length ? (
        <Section title="Histórico de alertas" subtitle="Persistido no SQLite do aparelho">
          {vehicleAlerts.slice(0, 8).map((a) => (
            <Card key={a.id} style={styles.row}>
              <StatusDot tone={a.acknowledged ? "neutral" : SEVERITY[a.severity].tone} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodySmStrong" color={a.acknowledged ? colors.textMuted : colors.textPrimary}>
                  {a.title}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {relativeTime(a.createdAt)} · {a.acknowledged ? "tratado" : "aberto"}
                </AppText>
              </View>
              {!a.acknowledged ? <Button label="Tratar" size="sm" variant="ghost" onPress={() => acknowledgeAlert(a)} /> : null}
            </Card>
          ))}
        </Section>
      ) : null}
    </Screen>
  );
}

function Live({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={{ flex: 1 }}>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
      <AppText variant="metricS">
        {value}
        <AppText variant="caption" color={colors.textMuted}>
          {" "}
          {unit}
        </AppText>
      </AppText>
    </View>
  );
}

function SensorTile({ icon, label, value, progress, tone }: { icon: IconName; label: string; value: string; progress?: number; tone: Tone }) {
  const color = { danger: colors.danger, warning: colors.warning, success: colors.success, accent: colors.accent, neutral: colors.border }[tone as string] || colors.accent;
  const { columns } = useLayout();
  return (
    <Card style={[styles.tile, { flexBasis: columns === 4 ? "22%" : "47%" }]}>
      <View style={styles.row}>
        <IconTile name={icon} tone={tone} size="sm" />
        <AppText variant="caption" color={colors.textMuted} style={{ flex: 1 }}>
          {label}
        </AppText>
      </View>
      <AppText variant="metricS">{value}</AppText>
      {progress !== undefined ? <ProgressBar value={progress} color={color} height={6} /> : null}
    </Card>
  );
}

function TireDiagram({ psi }: { psi: TirePressures }) {
  const tone = (v: number) => (v < 26 ? colors.danger : v < 30 ? colors.warning : colors.success);
  const Tire = ({ value }: { value: number }) => (
    <View style={styles.tireBox}>
      <View style={[styles.tire, { borderColor: tone(value) }]} />
      <AppText variant="bodySmStrong" color={tone(value)}>
        {decimal(value)}
      </AppText>
    </View>
  );
  return (
    <View style={styles.tireWrap}>
      <View style={styles.axle}>
        <Tire value={psi.fl} />
        <Tire value={psi.fr} />
      </View>
      <View style={styles.carBody}>
        <AppText variant="caption" color={colors.textMuted}>
          frente ↑
        </AppText>
      </View>
      <View style={styles.axle}>
        <Tire value={psi.rl} />
        <Tire value={psi.rr} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  between: { flexDirection: "row", justifyContent: "space-between" },
  linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  liveRow: { flexDirection: "row", gap: spacing.md, paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: { flexBasis: "47%", flexGrow: 1, gap: spacing.sm },
  tireWrap: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm },
  axle: { flexDirection: "row", justifyContent: "space-between", width: "80%" },
  carBody: {
    width: "46%",
    height: 56,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: -spacing.xl
  },
  tireBox: { alignItems: "center", gap: 4, width: 64 },
  tire: { width: 22, height: 40, borderRadius: 8, borderWidth: 4, backgroundColor: colors.surfaceMuted }
});
