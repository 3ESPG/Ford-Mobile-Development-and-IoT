import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { AppText, Button, Card, Chip, colors, EmptyState, Screen, Section, spacing, TextField, useToast } from "@/design-system";
import { CHANNELS, contactMessage, leadTitle, OUTCOMES } from "@/domain/leads";
import type { ContactChannel, ContactOutcome } from "@/domain/types";
import { successFeedback } from "@/iot/actuators";
import { useApp } from "@/state/AppProvider";
import { StickyFooter } from "@/ui/StickyFooter";

export default function ContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { leadById, logContact } = useApp();
  const toast = useToast();
  const lead = leadById(String(id));
  const [channel, setChannel] = useState<ContactChannel>("whatsapp");
  const [outcome, setOutcome] = useState<ContactOutcome | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!lead) {
    return (
      <Screen title="Registrar contato" back>
        <EmptyState title="Lead não encontrado" />
      </Screen>
    );
  }

  const openChannel = async () => {
    const text = encodeURIComponent(contactMessage(lead, lead.dealerCode, lead.iotAlert));
    const url = channel === "whatsapp" ? `https://wa.me/?text=${text}` : channel === "email" ? `mailto:?subject=${encodeURIComponent("Revisão do seu Ford")}&body=${text}` : channel === "sms" ? `sms:?body=${text}` : "tel:";
    try {
      await Linking.openURL(url);
    } catch {
      toast.show({ title: "Canal indisponível neste dispositivo", tone: "warning" });
    }
  };

  const save = async () => {
    if (!outcome) return;
    setSaving(true);
    await logContact(lead, channel, outcome, note.trim());
    await successFeedback();
    toast.show({ title: "Contato registrado", message: `${CHANNELS[channel].label} · ${OUTCOMES[outcome].label}`, tone: "success" });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen back eyebrow="Registrar contato" title={leadTitle(lead)} subtitle={`VIN ${lead.vinMask} · Dealer ${lead.dealerCode}`}>
        <Section title="Canal">
          <View style={styles.wrap}>
            {(Object.keys(CHANNELS) as ContactChannel[]).map((c) => (
              <Chip key={c} label={CHANNELS[c].label} icon={CHANNELS[c].icon as never} selected={channel === c} onPress={() => setChannel(c)} />
            ))}
          </View>
          <Button label={`Abrir ${CHANNELS[channel].label} com a mensagem`} icon="open-outline" variant="secondary" size="sm" onPress={openChannel} />
        </Section>

        <Section title="Resultado do contato">
          <View style={styles.wrap}>
            {(Object.keys(OUTCOMES) as ContactOutcome[]).map((o) => (
              <Chip key={o} label={OUTCOMES[o].label} selected={outcome === o} onPress={() => setOutcome(o)} />
            ))}
          </View>
          {outcome === "interessado" ? (
            <Card tone="muted">
              <AppText variant="bodySm" color={colors.textSecondary}>
                Cliente interessado? Depois de salvar, use “Agendar” no detalhe do lead para reservar o horário na oficina.
              </AppText>
            </Card>
          ) : null}
        </Section>

        <Section title="Observações">
          <TextField value={note} onChangeText={setNote} placeholder="Ex.: prefere contato após 18h, pediu orçamento de pneus…" multiline />
        </Section>
        <View style={{ height: 60 }} />
      </Screen>
      <StickyFooter>
        <Button label="Salvar contato" icon="checkmark" onPress={save} disabled={!outcome} loading={saving} style={{ flex: 1 }} />
      </StickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }
});
