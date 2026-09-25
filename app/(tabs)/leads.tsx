import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { AppText, Chip, ChipRow, colors, Container, EmptyState, Hero, LoadingState, SearchField, spacing } from "@/design-system";
import { LEAD_STATUS, matchesQuery, sortQueue, STATUS_ORDER } from "@/domain/leads";
import type { Lead, LeadStatus } from "@/domain/types";
import { useApp } from "@/state/AppProvider";
import { funnelCounts, useScopedLeads } from "@/state/selectors";
import { LeadCard } from "@/ui/LeadCard";
import { ProfileButton } from "@/ui/ProfileButton";

type PriorityFilter = "all" | Lead["priority"];
type StatusFilter = "all" | LeadStatus;

export default function LeadsScreen() {
  const { syncing } = useApp();
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const { items, label } = useScopedLeads();

  const counts = useMemo(() => funnelCounts(items), [items]);
  const iotCount = items.filter((l) => l.iotAlert).length;

  const filtered = useMemo(
    () =>
      sortQueue(
        items.filter(
          (l) => matchesQuery(l, query) && (priority === "all" || l.priority === priority) && (status === "all" || l.status === status)
        )
      ),
    [items, query, priority, status]
  );

  const header = (
    <View>
      <Hero
        eyebrow={label}
        title="Fila de leads"
        subtitle="Ordenada por alertas IoT e score de risco de evasão. Toque para ver o motivo e agir."
        right={<ProfileButton />}
        overlap={spacing.xl}
      />
      <Container style={styles.controls}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Buscar modelo, VIN, dealer ou motivo" />
        <ChipRow>
          <Chip label="Todas" selected={priority === "all"} onPress={() => setPriority("all")} />
          <Chip label="Alta" icon="flame-outline" selected={priority === "Alta"} onPress={() => setPriority("Alta")} />
          <Chip label="Média" selected={priority === "Media"} onPress={() => setPriority("Media")} />
        </ChipRow>
        <ChipRow>
          <Chip label="Todos status" count={items.length} selected={status === "all"} onPress={() => setStatus("all")} />
          {STATUS_ORDER.map((s) => (
            <Chip key={s} label={LEAD_STATUS[s].label} count={counts[s]} selected={status === s} onPress={() => setStatus(s)} />
          ))}
        </ChipRow>
        <AppText variant="caption" color={colors.textMuted}>
          {filtered.length} resultado(s){iotCount ? ` · ${iotCount} com alerta de veículo conectado` : ""}
        </AppText>
      </Container>
    </View>
  );

  return (
    <FlatList
      style={styles.root}
      data={syncing ? [] : filtered}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Container>
          <LeadCard lead={item} />
        </Container>
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Container>
          {syncing ? (
            <LoadingState rows={4} />
          ) : items.length === 0 ? (
            <EmptyState title="Sem leads na sua carteira" message="Nenhum cliente da sua concessionária está em risco agora." />
          ) : (
          <EmptyState
            title="Nenhum lead encontrado"
            message="Ajuste a busca ou os filtros para ver outros clientes."
            actionLabel="Limpar filtros"
            onAction={() => {
              setQuery("");
              setPriority("all");
              setStatus("all");
            }}
          />
          )}
        </Container>
      }
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={8}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: 120, gap: spacing.md },
  controls: { marginTop: -spacing.xl, gap: spacing.md, marginBottom: spacing.xs },
});
