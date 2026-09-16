import {
  currentStock as demoCurrentStock,
  dashboardMetrics as demoDashboardMetrics,
  stockMovements as demoStockMovements,
  type StockMovement,
} from "@/lib/demo-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type DashboardStockRow = ReturnType<typeof demoCurrentStock>[number];

type DashboardMetrics = ReturnType<typeof demoDashboardMetrics>;

type DashboardData = {
  source: "demo" | "live" | "error";
  metrics: DashboardMetrics;
  currentStock: DashboardStockRow[];
  movements: StockMovement[];
  errorMessage?: string;
};

const emptyMetrics: DashboardMetrics = {
  totalStockKg: 0,
  availableStockKg: 0,
  shippedStockKg: 0,
  activeLpnCount: 0,
  inboundKg: 0,
  outboundKg: 0,
  movementCount: 0,
  materialCount: 0,
  locationCount: 0,
};

function numberValue(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value ?? 0) || 0;
}

function movementLabel(value: string): StockMovement["transactionType"] {
  if (value === "Inbound") return "Goods Receipt";
  if (value === "Reserve") return "Reservation";
  if (value === "Outbound") return "Dispatch";
  if (["Putaway", "Pick", "Adjustment", "Transfer"].includes(value)) {
    return value as StockMovement["transactionType"];
  }
  return "Adjustment";
}

export async function getDashboardData(): Promise<DashboardData> {
  if (process.env.NEXT_PUBLIC_WMS_DATA_MODE !== "live") {
    return {
      source: "demo",
      metrics: demoDashboardMetrics(),
      currentStock: demoCurrentStock(),
      movements: demoStockMovements,
    };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const [metricsResult, stockResult, movementResult] = await Promise.all([
      supabase.rpc("wms_dashboard_metrics", {}),
      supabase.from("wms_current_stock_view").select("*").order("last_update", { ascending: false }).limit(250),
      supabase.from("wms_stock_movements").select("*").order("movement_date", { ascending: false }).limit(50),
    ]);

    if (metricsResult.error || stockResult.error || movementResult.error) {
      throw new Error("Dashboard query failed");
    }

    const movements = movementResult.data ?? [];
    const lpnIds = [...new Set(movements.map((movement) => movement.lpn_id).filter((id): id is string => Boolean(id)))];
    const materialIds = [...new Set(movements.map((movement) => movement.material_id))];
    const locationIds = [...new Set(movements.flatMap((movement) => [movement.from_location_id, movement.to_location_id]).filter((id): id is string => Boolean(id)))];

    const [lpnResult, materialResult, locationResult] = await Promise.all([
      lpnIds.length ? supabase.from("wms_lpns").select("id, lpn_code, stock_type, status").in("id", lpnIds) : Promise.resolve({ data: [], error: null }),
      materialIds.length ? supabase.from("wms_materials").select("id, material_code, long_description").in("id", materialIds) : Promise.resolve({ data: [], error: null }),
      locationIds.length ? supabase.from("wms_locations").select("id, location_code").in("id", locationIds) : Promise.resolve({ data: [], error: null }),
    ]);

    if (lpnResult.error || materialResult.error || locationResult.error) throw new Error("Dashboard reference query failed");

    const lpns = new Map((lpnResult.data ?? []).map((row) => [row.id, row]));
    const materials = new Map((materialResult.data ?? []).map((row) => [row.id, row]));
    const locations = new Map((locationResult.data ?? []).map((row) => [row.id, row.location_code]));
    const metricsPayload = (metricsResult.data ?? {}) as Record<string, Json | undefined>;

    return {
      source: "live",
      metrics: {
        totalStockKg: numberValue(metricsPayload.totalStockKg),
        availableStockKg: numberValue(metricsPayload.availableStockKg),
        shippedStockKg: 0,
        activeLpnCount: numberValue(metricsPayload.activeLpnCount),
        inboundKg: numberValue(metricsPayload.inboundKg),
        outboundKg: numberValue(metricsPayload.outboundKg),
        movementCount: numberValue(metricsPayload.movementCount),
        materialCount: numberValue(metricsPayload.materialCount),
        locationCount: numberValue(metricsPayload.locationCount),
      },
      currentStock: (stockResult.data ?? []).map((row) => ({
        lpnCode: row.lpn_code,
        materialCode: row.material_code,
        materialDescription: row.material_description,
        lotNumber: row.lot_number,
        currentLocation: row.current_location ?? "-",
        stockType: row.stock_type,
        qtyCurrentKg: Number(row.qty_current_kg),
        status: row.status,
        lastDocNo: "-",
        lastUpdate: row.last_update ?? "-",
      })),
      movements: movements.map((movement) => {
        const lpn = movement.lpn_id ? lpns.get(movement.lpn_id) : undefined;
        const material = materials.get(movement.material_id);
        return {
          date: movement.movement_date,
          docNo: movement.reference_type ?? movement.id.slice(0, 8).toUpperCase(),
          transactionType: movementLabel(movement.transaction_type),
          materialCode: material?.material_code ?? "-",
          materialDescription: material?.long_description ?? "-",
          lotNumber: "-",
          lpnCode: lpn?.lpn_code ?? "-",
          qtyKg: Number(movement.qty_kg),
          movementQtyKg: Number(movement.movement_qty_kg),
          fromLocation: movement.from_location_id ? locations.get(movement.from_location_id) ?? "-" : "-",
          toLocation: movement.to_location_id ? locations.get(movement.to_location_id) ?? "-" : "-",
          stockType: (lpn?.stock_type ?? "Fresh Seed") as StockMovement["stockType"],
          statusAfter: lpn?.status ?? "posted",
          createdBy: movement.created_by ?? "system",
        };
      }),
    };
  } catch {
    return {
      source: "error",
      metrics: emptyMetrics,
      currentStock: [],
      movements: [],
      errorMessage: "Data live tidak tersedia. Sistem tidak mengganti hasil dengan data demo.",
    };
  }
}
