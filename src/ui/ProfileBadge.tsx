import { Badge } from "@/design-system";
import { CUSTOMER_PROFILES, type CustomerProfile } from "@/domain/customers";

/** Badge do perfil de cliente (Fiel, Abandono, Esquecido, Econômico) com cor própria */
export function ProfileBadge({ profile, solid }: { profile: CustomerProfile; solid?: boolean }) {
  const info = CUSTOMER_PROFILES[profile];
  return <Badge label={info.label} tone={info.tone} icon={info.icon as never} solid={solid} />;
}
