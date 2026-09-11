export type InventoryImportRow = {
  sourceSheet: string;
  sourceRow: number;
  stockDate: string | null;
  materialCode: string;
  materialDescription: string;
  hybrid: string;
  stage: string;
  flagging: string;
  lotNumber: string;
  qtyKg: number | null;
  warehouse: string;
  materialType: string;
  product: string;
  crop: string;
  inventoryStatus: string;
  returnClassification: string;
  ageingDays: number | null;
  sapQtyKg: number | null;
  note: string;
  remark: string;
  validationResult: "valid" | "warning" | "blocked";
  validationMessage: string;
};

export type InventorySheetSummary = {
  name: string;
  kind: "inventory_snapshot" | "material_master" | "sap_reference" | "legacy_archive";
  includedInMigration: boolean;
  sourceRows: number;
  acceptedRows: number;
  blockedRows: number;
  skippedRows: number;
};

export type InventoryImportPreview = {
  fileName: string;
  generatedAt: string;
  totals: {
    inventoryRows: number;
    validRows: number;
    warningRows: number;
    blockedRows: number;
    materialMasterRows: number;
    sapReferenceRows: number;
    legacyArchiveRows: number;
    totalQtyKg: number;
    warehouseCount: number;
  };
  sheets: InventorySheetSummary[];
  inventoryPreview: InventoryImportRow[];
  notices: string[];
};
