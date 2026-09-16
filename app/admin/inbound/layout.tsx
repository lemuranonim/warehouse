import { ADMIN_ROLES } from "@/lib/access-control";
import { requirePageAccess } from "@/lib/auth";

export default async function InboundAdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess(ADMIN_ROLES);
  return children;
}
