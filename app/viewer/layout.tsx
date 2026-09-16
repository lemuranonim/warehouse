import { requirePageAccess } from "@/lib/auth";

export default async function ViewerLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess();
  return children;
}
