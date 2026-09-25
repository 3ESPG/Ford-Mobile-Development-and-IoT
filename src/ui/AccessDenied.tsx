import { router } from "expo-router";
import { EmptyState, Screen } from "@/design-system";

/** Tela exibida quando o perfil do usuário não tem permissão para a rota */
export function AccessDenied({ title, message = "Esta área é exclusiva de gestores e administradores Ford.", back }: { title: string; message?: string; back?: boolean }) {
  return (
    <Screen title={title} eyebrow="Acesso restrito" back={back}>
      <EmptyState
        icon="lock-closed-outline"
        title="Seu perfil não tem acesso a esta área"
        message={message}
        actionLabel="Ir para o painel"
        onAction={() => router.replace("/painel")}
      />
    </Screen>
  );
}
