import { CHECKER_ROLES } from "@/lib/access-control";
import { requirePageAccess } from "@/lib/auth";

export default async function CheckerLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess(CHECKER_ROLES);
  return children;
}
