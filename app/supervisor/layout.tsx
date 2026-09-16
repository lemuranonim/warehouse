import { SUPERVISOR_ROLES } from "@/lib/access-control";
import { requirePageAccess } from "@/lib/auth";

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess(SUPERVISOR_ROLES);
  return children;
}
