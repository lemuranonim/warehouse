import { currentStock, dashboardMetrics, materials, stockMovements } from "@/lib/demo-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getDashboardData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      source: "demo",
      metrics: dashboardMetrics(),
      currentStock: currentStock(),
      movements: stockMovements,
      materials
    };
  }

  const supabase = createServerSupabaseClient();
  const [stockResult, movementResult, materialResult] = await Promise.all([
    supabase.from("current_stock_view").select("*").limit(100),
    supabase.from("stock_movements").select("*").order("movement_date", { ascending: false }).limit(50),
    supabase.from("materials").select("*").eq("is_active", true).limit(100)
  ]);

  if (stockResult.error || movementResult.error || materialResult.error) {
    return {
      source: "demo",
      metrics: dashboardMetrics(),
      currentStock: currentStock(),
      movements: stockMovements,
      materials
    };
  }

  return {
    source: "supabase",
    metrics: dashboardMetrics(),
    currentStock: stockResult.data,
    movements: movementResult.data,
    materials: materialResult.data
  };
}
