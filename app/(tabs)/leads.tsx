import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { AppText, Chip, ChipRow, colors, EmptyState, Hero, SearchField, SegmentedControl, spacing } from "@/design-system";
import { LEAD_STATUS, matchesQuery, sortQueue, STATUS_ORDER } from "@/domain/leads";
import type { Lead, LeadStatus } from "@/domain/types";
import { useApp } from "@/state/AppProvider";
import { funnelCounts, useScopedLeads } from "@/state/selectors";
import { LeadCard } from "@/ui/LeadCard";
import { ProfileButton } from "@/ui/ProfileButton";

type PriorityFilter = "all" | Lead["priority"];
type StatusFilter = "all" | LeadStatus;

export default function LeadsScreen() {
  const { settings } = useApp();
  const isConsultant = settings.profile?.role === "consultor";
  const [scope, setScope] = useState<"mine" | "all">(isConsultant ? "mine" : "all");
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const { items, label } = useScopedLeads(scope);

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
      >
        {isConsultant ? (
          <SegmentedControl
            inverse
            value={scope}
            onChange={setScope}
            options={[
              { value: "mine", label: "Minha loja" },
              { value: "all", label: "Rede toda" }
            ]}
          />
        ) : null}
      </Hero>
      <View style={styles.controls}>
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
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.root}
      data={filtered}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <LeadCard lead={item} />
        </View>
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={styles.item}>
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
        </View>
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
  controls: { paddingHorizontal: spacing.lg, marginTop: -spacing.xl, gap: spacing.md, marginBottom: spacing.xs },
  item: { paddingHorizontal: spacing.lg }
});
