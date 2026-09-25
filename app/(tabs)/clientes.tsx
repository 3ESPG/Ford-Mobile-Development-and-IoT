import { useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { AppText, Banner, Button, Chip, ChipRow, colors, Container, EmptyState, ErrorState, Hero, LoadingState, SearchField, spacing, useLayout } from "@/design-system";
import { CUSTOMER_PROFILES, matchesCustomer, PROFILE_ORDER, profileCounts, sortByRisk, type CustomerProfile } from "@/domain/customers";
import { useApp } from "@/state/AppProvider";
import { useScopedCustomers } from "@/state/selectors";
import { CustomerCard } from "@/ui/CustomerCard";
import { ProfileButton } from "@/ui/ProfileButton";

type ProfileFilter = "all" | CustomerProfile;
type Sort = "risco" | "recencia";

export default function ClientesScreen() {
  const { syncing, syncError, sync, settings } = useApp();
  const { items, label } = useScopedCustomers();
  const { isCompact } = useLayout();
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState<ProfileFilter>("all");
  const [sort, setSort] = useState<Sort>("risco");

  const counts = useMemo(() => profileCounts(items), [items]);
  const atRisk = items.length - counts.fiel;

  const filtered = useMemo(() => {
    const list = items.filter((c) => matchesCustomer(c, query) && (profile === "all" || c.profile === profile));
    return sort === "risco" ? sortByRisk(list) : [...list].sort((a, b) => b.daysSinceService - a.daysSinceService);
  }, [items, query, profile, sort]);

  const clear = () => {
    setQuery("");
    setProfile("all");
  };

  const header = (
    <View>
      <Hero eyebrow={label} title="Clientes" subtitle="Carteira segmentada por perfil de retenção e score de risco de evasão." right={<ProfileButton />} overlap={spacing.xl}>
        <View style={styles.summary}>
          {PROFILE_ORDER.map((p) => (
            <View key={p} style={styles.summaryItem}>
              <AppText variant="metricS" color={colors.textOnBrand}>
                {counts[p]}
              </AppText>
              <AppText variant="caption" color={colors.textOnBrandMuted} numberOfLines={1}>
                {CUSTOMER_PROFILES[p].label}
              </AppText>
            </View>
          ))}
        </View>
      </Hero>
      <Container style={styles.controls}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Buscar nome, modelo, VIN ou telefone" />
        <ChipRow>
          <Chip label="Todos" count={items.length} selected={profile === "all"} onPress={() => setProfile("all")} />
          {PROFILE_ORDER.map((p) => (
            <Chip key={p} label={CUSTOMER_PROFILES[p].label} icon={CUSTOMER_PROFILES[p].icon as never} count={counts[p]} selected={profile === p} onPress={() => setProfile(p)} />
          ))}
        </ChipRow>
        <View style={styles.sortRow}>
          <AppText variant="caption" color={colors.textMuted} style={isCompact ? styles.countFull : { flex: 1 }}>
            {filtered.length} cliente(s) · {atRisk} em risco
          </AppText>
          <Chip label="Maior risco" selected={sort === "risco"} onPress={() => setSort("risco")} />
          <Chip label="Mais tempo fora" selected={sort === "recencia"} onPress={() => setSort("recencia")} />
        </View>
        {syncError && settings.apiUrl ? (
          <View style={{ gap: spacing.sm }}>
            <Banner tone="warning" icon="cloud-offline-outline" title="Não foi possível atualizar pela API" message={`${syncError}. Exibindo a base embarcada.`} />
            <Button label="Tentar novamente" icon="refresh" variant="secondary" size="sm" onPress={sync} loading={syncing} />
          </View>
        ) : null}
      </Container>
    </View>
  );

  const empty = syncing ? (
    <LoadingState rows={4} />
  ) : items.length === 0 ? (
    syncError ? (
      <ErrorState message={syncError} onRetry={sync} />
    ) : (
      <EmptyState title="Nenhum cliente na sua carteira" message="Quando a concessionária tiver clientes na base, eles aparecem aqui." />
    )
  ) : (
    <EmptyState title="Nenhum cliente encontrado" message="Ajuste a busca ou o filtro de perfil." actionLabel="Limpar filtros" onAction={clear} />
  );

  return (
    <FlatList
      style={styles.root}
      data={syncing ? [] : filtered}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Container>
          <CustomerCard customer={item} />
        </Container>
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={<Container>{empty}</Container>}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={8}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={sync} tintColor={colors.accent} />}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { paddingBottom: 120, gap: spacing.md },
  controls: { marginTop: -spacing.xl, gap: spacing.md, marginBottom: spacing.xs },
  summary: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: spacing.md
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 2 },
  sortRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
  countFull: { width: "100%" }
});
