import { requirePageAccess } from "@/lib/auth";

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess();
  return children;
}
