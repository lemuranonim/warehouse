import { requirePageAccess } from "@/lib/auth";

export default async function DocumentsLayout({ children }: { children: React.ReactNode }) {
  await requirePageAccess();
  return children;
}
