import { OPERATOR_ROLES } from "@/lib/access-control";
import { requirePageAccess } from "@/lib/auth";

export default async function StagingLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess(OPERATOR_ROLES);
  return children;
}
