import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Button, Chip, colors, fonts, gradients, radii, SegmentedControl, spacing } from "@/design-system";
import type { UserRole } from "@/domain/types";
import { successFeedback } from "@/iot/actuators";
import { useApp } from "@/state/AppProvider";

const FEATURES = [
  { icon: "analytics-outline", title: "VIN Share em tempo real", text: "Indicadores por concessionária, modelo e período." },
  { icon: "flash-outline", title: "Leads priorizados", text: "Score explicável de risco de evasão da rede Ford." },
  { icon: "hardware-chip-outline", title: "Veículo conectado", text: "Telemetria e sensores geram leads preditivos." }
] as const;

/** Marca do app (grafismo original: pulso dentro de um anel) */
function AppMark({ size = 72 }: { size?: number }) {
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48">
        <Circle cx={24} cy={24} r={20} stroke="rgba(255,255,255,0.35)" strokeWidth={2.5} fill="none" />
        <Path d="M6 26 H16 L20 17 L26 33 L30 23 L33 26 H42" stroke="#FFFFFF" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, snapshot } = useApp();
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("consultor");
  const [dealer, setDealer] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Concessionárias com leads na base (as mais relevantes para a demonstração)
  const dealerOptions = useMemo(() => {
    const counts = new Map<string, number>();
    snapshot.leads.forEach((l) => counts.set(l.dealerCode, (counts.get(l.dealerCode) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [snapshot.leads]);

  const canContinue = name.trim().length >= 2 && (role === "gestor" || dealer);

  const enter = async () => {
    if (!canContinue) return;
    setSaving(true);
    await signIn({ name: name.trim(), role, dealerCode: role === "consultor" ? dealer : null });
    await successFeedback();
    router.replace("/painel");
  };

  return (
    <LinearGradient colors={gradients.hero} style={styles.root} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxxl, paddingBottom: insets.bottom + spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
        >
          <AppMark />
          <View style={styles.titleBlock}>
            <AppText variant="overline" color={colors.textOnBrandMuted}>
              Ford × FIAP · Desafio 2
            </AppText>
            <AppText variant="displayXL" color={colors.textOnBrand}>
              Service Pulse
            </AppText>
            <AppText variant="body" color={colors.textOnBrandMuted}>
              Retenção no pós-venda guiada por dados e por veículos conectados. Mais clientes Ford voltando para a rede oficial.
            </AppText>
          </View>

          {step === 0 ? (
            <>
              <View style={styles.features}>
                {FEATURES.map((f) => (
                  <View key={f.title} style={styles.feature}>
                    <View style={styles.featureIcon}>
                      <Ionicons name={f.icon} size={20} color={colors.textOnBrand} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="titleS" color={colors.textOnBrand}>
                        {f.title}
                      </AppText>
                      <AppText variant="bodySm" color={colors.textOnBrandMuted}>
                        {f.text}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>
              <Button label="Começar" iconRight="arrow-forward" onPress={() => setStep(1)} fullWidth testID="welcome-start" />
            </>
          ) : (
            <View style={styles.form}>
              <AppText variant="titleL">Seu perfil</AppText>
              <AppText variant="bodySm" color={colors.textMuted}>
                O perfil define a visão inicial: o consultor vê a fila da sua loja; o gestor, a rede toda.
              </AppText>

              <View style={styles.field}>
                <AppText variant="caption" color={colors.textSecondary}>
                  Como podemos te chamar?
                </AppText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  autoCapitalize="words"
                  testID="welcome-name"
                />
              </View>

              <View style={styles.field}>
                <AppText variant="caption" color={colors.textSecondary}>
                  Função
                </AppText>
                <SegmentedControl
                  value={role}
                  onChange={setRole}
                  options={[
                    { value: "consultor", label: "Consultor" },
                    { value: "gestor", label: "Gestor Ford" }
                  ]}
                />
              </View>

              {role === "consultor" ? (
                <View style={styles.field}>
                  <AppText variant="caption" color={colors.textSecondary}>
                    Sua concessionária
                  </AppText>
                  <View style={styles.dealerGrid}>
                    {dealerOptions.map(([code, count]) => (
                      <Chip key={code} label={`Dealer ${code}`} count={count} selected={dealer === code} onPress={() => setDealer(code)} />
                    ))}
                  </View>
                </View>
              ) : null}

              <Button label="Entrar no app" icon="log-in-outline" onPress={enter} disabled={!canContinue} loading={saving} fullWidth testID="welcome-enter" />
              <Button label="Voltar" variant="ghost" onPress={() => setStep(0)} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.xxl, gap: spacing.xxl, flexGrow: 1 },
  mark: { backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  titleBlock: { gap: spacing.sm },
  features: { gap: spacing.lg, flex: 1 },
  feature: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  form: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.lg },
  field: { gap: spacing.sm },
  input: {
    height: 48,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textPrimary
  },
  dealerGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }
});
