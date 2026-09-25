import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type TextInput, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText, Banner, Button, Chip, colors, gradients, Input, radii, spacing, useLayout } from "@/design-system";
import { AuthError } from "@/auth/authService";
import { DEMO_PASSWORD, DEMO_USERS, ROLE_INFO, validateLogin, type LoginErrors } from "@/domain/auth";
import { successFeedback } from "@/iot/actuators";
import { useApp } from "@/state/AppProvider";
import { useAuth } from "@/state/AuthProvider";

const FEATURES = [
  { icon: "analytics-outline", title: "VIN Share em tempo real", text: "Indicadores por concessionária, modelo e idade do veículo." },
  { icon: "people-outline", title: "Clientes por perfil", text: "Fiel, Abandono, Esquecido e Econômico, com a ação certa para cada um." },
  { icon: "hardware-chip-outline", title: "Veículo conectado", text: "Telemetria e sensores geram leads preditivos e lembretes." }
] as const;

/** Marca do app (grafismo original: pulso dentro de um anel) */
function AppMark({ size = 64 }: { size?: number }) {
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.28 }]}>
      <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 48 48">
        <Circle cx={24} cy={24} r={20} stroke="rgba(255,255,255,0.35)" strokeWidth={2.5} fill="none" />
        <Path d="M6 26 H16 L20 17 L26 33 L30 23 L33 26 H42" stroke="#FFFFFF" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { isCompact } = useLayout();
  const { settings } = useApp();
  const { signIn, notice } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [step, setStep] = useState<0 | 1>(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const revalidate = (nextEmail: string, nextPassword: string) => {
    if (submitted) setErrors(validateLogin(nextEmail, nextPassword));
    setAuthError(null);
  };

  const submit = async () => {
    setSubmitted(true);
    const found = validateLogin(email, password);
    setErrors(found);
    if (found.email || found.password) return;
    setLoading(true);
    try {
      await signIn(email, password);
      await successFeedback();
      router.replace("/painel");
    } catch (err) {
      setAuthError(err instanceof AuthError ? err.message : "Não foi possível entrar agora. Tente novamente.");
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setErrors({});
    setAuthError(null);
  };

  return (
    <LinearGradient colors={gradients.hero} style={styles.root} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl, paddingHorizontal: isCompact ? spacing.lg : spacing.xxl }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <AppMark />
          <View style={styles.titleBlock}>
            <AppText variant="overline" color={colors.textOnBrandMuted}>
              Ford × FIAP · Desafio 2
            </AppText>
            <AppText variant={isCompact ? "displayL" : "displayXL"} color={colors.textOnBrand}>
              Service Pulse
            </AppText>
            <AppText variant="body" color={colors.textOnBrandMuted}>
              Retenção no pós-venda guiada por dados e por veículos conectados. Mais clientes Ford voltando para a rede oficial.
            </AppText>
          </View>

          {step === 0 && !notice ? (
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
            <View style={[styles.form, isCompact && { padding: spacing.lg }]}>
              <View style={{ gap: spacing.xs }}>
                <AppText variant="titleL">Entrar</AppText>
                <AppText variant="bodySm" color={colors.textMuted}>
                  Acesso para consultores e gestores da rede Ford.
                </AppText>
              </View>

              {notice ? <Banner tone="warning" icon="time-outline" title={notice} /> : null}
              {authError ? <Banner tone="danger" icon="close-circle" title={authError} message="Confira os dados ou use um dos usuários de teste abaixo." /> : null}

              <Input
                label="E-mail corporativo"
                icon="mail-outline"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  revalidate(v, password);
                }}
                placeholder="nome@ford.com"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                error={errors.email}
                testID="login-email"
              />
              <Input
                ref={passwordRef}
                label="Senha"
                icon="lock-closed-outline"
                password
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  revalidate(email, v);
                }}
                placeholder="Sua senha"
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
                error={errors.password}
                testID="login-password"
              />

              <Button label="Entrar" icon="log-in-outline" onPress={submit} loading={loading} fullWidth testID="login-submit" />

              <View style={styles.demo}>
                <View style={styles.demoHead}>
                  <Ionicons name="flask-outline" size={16} color={colors.brand} />
                  <AppText variant="bodySmStrong" color={colors.brand}>
                    Usuários de teste
                  </AppText>
                </View>
                <AppText variant="caption" color={colors.textMuted}>
                  Toque para preencher. Senha: {DEMO_PASSWORD}
                </AppText>
                <View style={styles.chips}>
                  {DEMO_USERS.map((u) => (
                    <Chip key={u.id} label={ROLE_INFO[u.role].label.split(" ")[0]} icon="person-outline" selected={email === u.email} onPress={() => fillDemo(u.email)} />
                  ))}
                </View>
                <AppText variant="caption" color={colors.textMuted}>
                  {settings.apiUrl ? `API: ${settings.apiUrl} (se não responder, entra em modo demo)` : "Modo demo: sem API configurada, dados embarcados no app."}
                </AppText>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: spacing.xxl, flexGrow: 1, width: "100%", maxWidth: 520, alignSelf: "center" },
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
  demo: { backgroundColor: colors.accentSubtle, borderRadius: radii.md, padding: spacing.md, gap: spacing.sm },
  demoHead: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }
});
