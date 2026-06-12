export type Material = {
  materialCode: string;
  description: string;
  hybrid: string;
  stage: string;
  flagging: string;
  type: string;
  product: string;
  crop: string;
  status: string;
  orderUnit: string;
  standardPackageKg: number;
  isActive: boolean;
};

export type Location = {
  locationCode: string;
  site: string;
  warehouse: string;
  room: string;
  aisle?: string;
  rack?: string;
  level?: string;
  bin?: string;
  locationType: "storage" | "staging" | "loading" | "receiving" | "quarantine";
  capacityKg: number;
  isActive: boolean;
};

export type StockType = {
  code: string;
  label: string;
  description: string;
  color: "green" | "blue" | "amber" | "violet" | "red";
  isActive: boolean;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Operator" | "Checker" | "Supervisor" | "Viewer";
  warehouse: string;
  status: "active" | "inactive";
  lastLogin: string;
};

export type InboundDocument = {
  docNo: string;
  asnDate: string;
  supplier: string;
  expectedDate: string;
  status: "draft" | "planned" | "receiving" | "received" | "closed";
  totalLines: number;
  totalQtyKg: number;
  createdBy: string;
  lines: InboundLine[];
};

export type InboundLine = {
  lineNo: number;
  materialCode: string;
  materialDescription: string;
  lotNumber: string;
  expectedQtyKg: number;
  receivedQtyKg: number;
  expDate: string;
  stockType: string;
  status: "pending" | "partial" | "received" | "variance";
};

export type OutboundOrder = {
  docNo: string;
  orderDate: string;
  requestedDate: string;
  destination: string;
  status: "draft" | "released" | "allocated" | "picking" | "staged" | "dispatched" | "closed";
  totalLines: number;
  totalQtyKg: number;
  createdBy: string;
  lines: OutboundLine[];
};

export type OutboundLine = {
  lineNo: number;
  materialCode: string;
  materialDescription: string;
  requestedQtyKg: number;
  allocatedQtyKg: number;
  lpnCode?: string;
  status: "pending" | "allocated" | "picked" | "staged" | "dispatched";
};

export type DeliveryNote = {
  dnNo: string;
  outboundDocNo: string;
  dnDate: string;
  destination: string;
  driver: string;
  vehicle: string;
  status: "draft" | "dn_created" | "loading" | "dispatched";
  totalLpns: number;
  totalQtyKg: number;
  lines: DeliveryNoteLine[];
};

export type DeliveryNoteLine = {
  lpnCode: string;
  materialDescription: string;
  lotNumber: string;
  qtyKg: number;
  status: string;
};

export type CycleCountSession = {
  sessionId: string;
  openDate: string;
  closeDate?: string;
  status: "open" | "counting" | "variance_review" | "closed";
  scope: string;
  openedBy: string;
  lines: CycleCountLine[];
};

export type CycleCountLine = {
  locationCode: string;
  lpnCode: string;
  materialDescription: string;
  lotNumber: string;
  bookQtyKg: number;
  countedQtyKg: number | null;
  variance: number | null;
  status: "pending" | "counted" | "variance" | "confirmed";
};

export type StockAdjustment = {
  adjNo: string;
  date: string;
  lpnCode: string;
  materialDescription: string;
  locationCode: string;
  bookQtyKg: number;
  actualQtyKg: number;
  varianceKg: number;
  reasonCode: string;
  reasonLabel: string;
  status: "pending" | "approved" | "rejected";
  submittedBy: string;
  approvedBy?: string;
};

export type StockMovement = {
  date: string;
  docNo: string;
  transactionType:
    | "Goods Receipt"
    | "Putaway"
    | "Reservation"
    | "Pick"
    | "Dispatch"
    | "Adjustment"
    | "Transfer";
  materialCode: string;
  materialDescription: string;
  lotNumber: string;
  lpnCode: string;
  qtyKg: number;
  movementQtyKg: number;
  fromLocation: string;
  toLocation: string;
  stockType: "Fresh Seed" | "Return Seed" | "Demo Seed";
  statusAfter: string;
  createdBy: string;
};

export type WorkflowStep = {
  workflow: string;
  step: number;
  actor: string;
  activity: string;
  trigger: string;
  scanRequired: string;
  systemAction: string;
  output: string;
  statusBefore: string;
  statusAfter: string;
};

export type ModuleItem = {
  module: string;
  route: string;
  features: string;
  tables: string;
  backend: string;
  priority: "MVP" | "P1" | "P2";
  notes: string;
};

export type RoleAccess = {
  process: string;
  primaryRole: string;
  raci: string;
  access: string;
  notes: string;
};

export type ScanScenario = {
  scenario: string;
  mode: string;
  firstScan: string;
  nextInput: string;
  validation: string;
  result: string;
  error: string;
};

export type StatusRule = {
  status: string;
  previous: string;
  next: string;
  trigger: string;
  rule: string;
};

export type RpcEndpoint = {
  name: string;
  type: "RPC" | "Edge Function/RPC";
  caller: string;
  payload: string;
  response: string;
  tables: string;
  validation: string;
  priority: "MVP" | "P1" | "P2";
};

/* ─── Master Data ──────────────────────────────────────── */

export const stockTypes: StockType[] = [
  { code: "FS", label: "Fresh Seed", description: "Benih segar langsung dari produksi / supplier", color: "green", isActive: true },
  { code: "RS", label: "Return Seed", description: "Benih retur dari distributor / lapangan", color: "amber", isActive: true },
  { code: "DS", label: "Demo Seed", description: "Benih untuk demonstrasi plot dan uji lapang", color: "blue", isActive: true },
  { code: "QS", label: "Quarantine Seed", description: "Benih dalam karantina menunggu hasil lab", color: "red", isActive: true },
  { code: "PS", label: "Parent Seed", description: "Benih induk untuk produksi benih generasi berikutnya", color: "violet", isActive: true },
];

export const userProfiles: UserProfile[] = [
  { id: "USR-001", name: "Budi Santoso", email: "budi.santoso@advantaseeds.co.id", role: "Admin", warehouse: "Warehouse 1", status: "active", lastLogin: "2026-05-29 08:45" },
  { id: "USR-002", name: "Siti Rahayu", email: "siti.rahayu@advantaseeds.co.id", role: "Checker", warehouse: "Warehouse 1", status: "active", lastLogin: "2026-05-29 07:30" },
  { id: "USR-003", name: "Ahmad Fauzi", email: "ahmad.fauzi@advantaseeds.co.id", role: "Operator", warehouse: "Warehouse 1", status: "active", lastLogin: "2026-05-29 09:10" },
  { id: "USR-004", name: "Dewi Kurnia", email: "dewi.kurnia@advantaseeds.co.id", role: "Operator", warehouse: "Vegetable Room", status: "active", lastLogin: "2026-05-28 16:20" },
  { id: "USR-005", name: "Hendra Wijaya", email: "hendra.wijaya@advantaseeds.co.id", role: "Supervisor", warehouse: "All", status: "active", lastLogin: "2026-05-29 08:00" },
  { id: "USR-006", name: "Rina Puspita", email: "rina.puspita@advantaseeds.co.id", role: "Viewer", warehouse: "All", status: "active", lastLogin: "2026-05-27 14:15" },
  { id: "USR-007", name: "Joko Widodo", email: "joko.w@advantaseeds.co.id", role: "Checker", warehouse: "Warehouse 1", status: "inactive", lastLogin: "2026-05-10 11:00" },
];

export const materials: Material[] = [
  {
    materialCode: "152000198",
    description: "Hybrid AV4 Clean Seed KG",
    hybrid: "PX03",
    stage: "DCS",
    flagging: "YF",
    type: "Commercial",
    product: "ADV JAGO",
    crop: "Field Corn",
    status: "WIP",
    orderUnit: "Jumbo Bag 1 MT",
    standardPackageKg: 1000,
    isActive: true
  },
  {
    materialCode: "160511345",
    description: "Hybrid B. CCMBR LAVANTA F1 20gr",
    hybrid: "CRPT133/RJHL1024",
    stage: "FG-Packed",
    flagging: "RF",
    type: "Commercial",
    product: "LAVANTA",
    crop: "Vegetable",
    status: "FG",
    orderUnit: "Carton Box 2 KG",
    standardPackageKg: 2,
    isActive: true
  },
  {
    materialCode: "141000223",
    description: "Hybrid AV9 Raw Seed KG",
    hybrid: "PX02",
    stage: "DSS",
    flagging: "RF",
    type: "Commercial",
    product: "ADV JAGO",
    crop: "Field Corn",
    status: "WIP",
    orderUnit: "Jumbo Bag 1 MT",
    standardPackageKg: 1000,
    isActive: true
  },
  {
    materialCode: "160511350",
    description: "OP Chilli SHIMA 10gr",
    hybrid: "CRPT133/RJHL1024",
    stage: "FG-Packed",
    flagging: "RF",
    type: "Commercial",
    product: "SHIMA",
    crop: "Vegetable",
    status: "FG",
    orderUnit: "Carton Box 2 KG",
    standardPackageKg: 2,
    isActive: true
  },
  {
    materialCode: "151000155",
    description: "PS M AV4 AV5 & AV7 Clean Seed KG",
    hybrid: "PX03-PX04-M",
    stage: "DCS",
    flagging: "YF",
    type: "Parent Seed",
    product: "Non Commercial",
    crop: "Field Corn",
    status: "WIP",
    orderUnit: "Jumbo Bag 1 MT",
    standardPackageKg: 1000,
    isActive: true
  }
];

export const locations: Location[] = [
  {
    locationCode: "WH1-A11.3",
    site: "Prasad 01",
    warehouse: "Warehouse 1",
    room: "Warehouse 1",
    aisle: "A",
    rack: "11",
    level: "3",
    locationType: "storage",
    capacityKg: 50000,
    isActive: true
  },
  {
    locationCode: "VEG-RACK-A1.1",
    site: "Prasad 01",
    warehouse: "Vegetable Room",
    room: "Vegetable Room",
    aisle: "A",
    rack: "1",
    level: "1",
    locationType: "storage",
    capacityKg: 10000,
    isActive: true
  },
  {
    locationCode: "STAGING-OUT-01",
    site: "Prasad 01",
    warehouse: "Warehouse 1",
    room: "Staging Area",
    bin: "01",
    locationType: "staging",
    capacityKg: 20000,
    isActive: true
  },
  {
    locationCode: "LOADING-DOCK-01",
    site: "Prasad 01",
    warehouse: "Warehouse 1",
    room: "Loading Dock",
    bin: "01",
    locationType: "loading",
    capacityKg: 20000,
    isActive: true
  },
  {
    locationCode: "RECEIVING-AREA",
    site: "Prasad 01",
    warehouse: "Warehouse 1",
    room: "Receiving",
    locationType: "receiving",
    capacityKg: 30000,
    isActive: true
  },
  {
    locationCode: "CHAMBER-1",
    site: "Prasad CS",
    warehouse: "Chamber 1",
    room: "Chamber 1",
    locationType: "storage",
    capacityKg: 10000,
    isActive: true
  },
  {
    locationCode: "CS02",
    site: "Kiat Ananda CS02",
    warehouse: "Cold Storage",
    room: "CS02",
    locationType: "storage",
    capacityKg: 10000,
    isActive: true
  }
];

/* ─── Inbound Documents ──────────────────────────────── */

export const inboundDocuments: InboundDocument[] = [
  {
    docNo: "ASN-2026-0501",
    asnDate: "2026-05-01",
    supplier: "Shelling Unit",
    expectedDate: "2026-05-01",
    status: "received",
    totalLines: 1,
    totalQtyKg: 79,
    createdBy: "Budi Santoso",
    lines: [
      {
        lineNo: 1,
        materialCode: "141000223",
        materialDescription: "Hybrid AV9 Raw Seed KG",
        lotNumber: "NPRHD2003",
        expectedQtyKg: 79,
        receivedQtyKg: 79,
        expDate: "2027-12-31",
        stockType: "Fresh Seed",
        status: "received"
      }
    ]
  },
  {
    docNo: "ASN-2026-0512",
    asnDate: "2026-05-12",
    supplier: "CV. Nusa Heulang",
    expectedDate: "2026-05-12",
    status: "received",
    totalLines: 1,
    totalQtyKg: 26.75,
    createdBy: "Budi Santoso",
    lines: [
      {
        lineNo: 1,
        materialCode: "160511350",
        materialDescription: "OP Chilli SHIMA 10gr",
        lotNumber: "230711069",
        expectedQtyKg: 30,
        receivedQtyKg: 26.75,
        expDate: "2028-06-30",
        stockType: "Fresh Seed",
        status: "variance"
      }
    ]
  },
  {
    docNo: "ASN-2026-0518",
    asnDate: "2026-05-18",
    supplier: "Production Unit",
    expectedDate: "2026-05-18",
    status: "received",
    totalLines: 1,
    totalQtyKg: 338,
    createdBy: "Budi Santoso",
    lines: [
      {
        lineNo: 1,
        materialCode: "151000155",
        materialDescription: "PS M AV4 AV5 & AV7 Clean Seed KG",
        lotNumber: "NPCYEB017A",
        expectedQtyKg: 338,
        receivedQtyKg: 338,
        expDate: "2027-08-15",
        stockType: "Parent Seed",
        status: "received"
      }
    ]
  },
  {
    docNo: "ASN-2026-0528",
    asnDate: "2026-05-28",
    supplier: "Field Production WH",
    expectedDate: "2026-05-30",
    status: "planned",
    totalLines: 2,
    totalQtyKg: 1500,
    createdBy: "Budi Santoso",
    lines: [
      {
        lineNo: 1,
        materialCode: "152000198",
        materialDescription: "Hybrid AV4 Clean Seed KG",
        lotNumber: "NPCCA0092",
        expectedQtyKg: 1000,
        receivedQtyKg: 0,
        expDate: "2028-01-31",
        stockType: "Fresh Seed",
        status: "pending"
      },
      {
        lineNo: 2,
        materialCode: "141000223",
        materialDescription: "Hybrid AV9 Raw Seed KG",
        lotNumber: "NPRHD2004",
        expectedQtyKg: 500,
        receivedQtyKg: 0,
        expDate: "2027-12-31",
        stockType: "Fresh Seed",
        status: "pending"
      }
    ]
  }
];

/* ─── Outbound Orders ────────────────────────────────── */

export const outboundOrders: OutboundOrder[] = [
  {
    docNo: "OUT-2026-0521",
    orderDate: "2026-05-21",
    requestedDate: "2026-05-23",
    destination: "Kiat Ananda CS02",
    status: "dispatched",
    totalLines: 1,
    totalQtyKg: 338,
    createdBy: "Budi Santoso",
    lines: [
      {
        lineNo: 1,
        materialCode: "151000155",
        materialDescription: "PS M AV4 AV5 & AV7 Clean Seed KG",
        requestedQtyKg: 338,
        allocatedQtyKg: 338,
        lpnCode: "LPN-20260521-000030",
        status: "dispatched"
      }
    ]
  },
  {
    docNo: "OUT-2026-0529",
    orderDate: "2026-05-29",
    requestedDate: "2026-06-02",
    destination: "Distributor Jawa Timur",
    status: "allocated",
    totalLines: 2,
    totalQtyKg: 1026.75,
    createdBy: "Budi Santoso",
    lines: [
      {
        lineNo: 1,
        materialCode: "141000223",
        materialDescription: "Hybrid AV9 Raw Seed KG",
        requestedQtyKg: 79,
        allocatedQtyKg: 79,
        lpnCode: "LPN-20260501-000001",
        status: "allocated"
      },
      {
        lineNo: 2,
        materialCode: "160511350",
        materialDescription: "OP Chilli SHIMA 10gr",
        requestedQtyKg: 947.75,
        allocatedQtyKg: 0,
        status: "pending"
      }
    ]
  },
  {
    docNo: "OUT-2026-0530",
    orderDate: "2026-05-30",
    requestedDate: "2026-06-05",
    destination: "Distributor Sumatera",
    status: "draft",
    totalLines: 1,
    totalQtyKg: 1000,
    createdBy: "Hendra Wijaya",
    lines: [
      {
        lineNo: 1,
        materialCode: "152000198",
        materialDescription: "Hybrid AV4 Clean Seed KG",
        requestedQtyKg: 1000,
        allocatedQtyKg: 0,
        status: "pending"
      }
    ]
  }
];

/* ─── Delivery Notes ──────────────────────────────────── */

export const deliveryNotes: DeliveryNote[] = [
  {
    dnNo: "DN-04251109",
    outboundDocNo: "OUT-2026-0521",
    dnDate: "2026-05-23",
    destination: "Kiat Ananda CS02",
    driver: "Rudi Hartono",
    vehicle: "B 1234 XYZ",
    status: "dispatched",
    totalLpns: 1,
    totalQtyKg: 338,
    lines: [
      {
        lpnCode: "LPN-20260521-000030",
        materialDescription: "PS M AV4 AV5 & AV7 Clean Seed KG",
        lotNumber: "NPCYEB017A",
        qtyKg: 338,
        status: "shipped"
      }
    ]
  },
  {
    dnNo: "DN-04251115",
    outboundDocNo: "OUT-2026-0529",
    dnDate: "2026-06-02",
    destination: "Distributor Jawa Timur",
    driver: "Sugiyono",
    vehicle: "D 5678 ABC",
    status: "dn_created",
    totalLpns: 1,
    totalQtyKg: 79,
    lines: [
      {
        lpnCode: "LPN-20260501-000001",
        materialDescription: "Hybrid AV9 Raw Seed KG",
        lotNumber: "NPRHD2003",
        qtyKg: 79,
        status: "staged"
      }
    ]
  }
];

/* ─── Cycle Count Sessions ───────────────────────────── */

export const cycleCountSessions: CycleCountSession[] = [
  {
    sessionId: "CC-2026-001",
    openDate: "2026-05-24",
    closeDate: "2026-05-24",
    status: "closed",
    scope: "WH1-A11.3, VEG-RACK-A1.1",
    openedBy: "Hendra Wijaya",
    lines: [
      {
        locationCode: "WH1-A11.3",
        lpnCode: "LPN-20260520-000020",
        materialDescription: "Hybrid AV4 Clean Seed KG",
        lotNumber: "NPCCA0090",
        bookQtyKg: 1000,
        countedQtyKg: 1000,
        variance: 0,
        status: "confirmed"
      },
      {
        locationCode: "VEG-RACK-A1.1",
        lpnCode: "LPN-20260512-000010",
        materialDescription: "OP Chilli SHIMA 10gr",
        lotNumber: "230711069",
        bookQtyKg: 26.75,
        countedQtyKg: 25.75,
        variance: -1,
        status: "variance"
      }
    ]
  },
  {
    sessionId: "CC-2026-002",
    openDate: "2026-05-29",
    status: "counting",
    scope: "WH1-A11.3",
    openedBy: "Hendra Wijaya",
    lines: [
      {
        locationCode: "WH1-A11.3",
        lpnCode: "LPN-20260501-000001",
        materialDescription: "Hybrid AV9 Raw Seed KG",
        lotNumber: "NPRHD2003",
        bookQtyKg: 79,
        countedQtyKg: 79,
        variance: 0,
        status: "counted"
      },
      {
        locationCode: "WH1-A11.3",
        lpnCode: "LPN-20260520-000020",
        materialDescription: "Hybrid AV4 Clean Seed KG",
        lotNumber: "NPCCA0090",
        bookQtyKg: 1000,
        countedQtyKg: null,
        variance: null,
        status: "pending"
      }
    ]
  }
];

/* ─── Stock Adjustments ──────────────────────────────── */

export const stockAdjustments: StockAdjustment[] = [
  {
    adjNo: "ADJ-000001",
    date: "2026-05-24",
    lpnCode: "LPN-20260512-000010",
    materialDescription: "OP Chilli SHIMA 10gr",
    locationCode: "VEG-RACK-A1.1",
    bookQtyKg: 26.75,
    actualQtyKg: 25.75,
    varianceKg: -1,
    reasonCode: "SHRINK",
    reasonLabel: "Susut / Penyusutan Natural",
    status: "approved",
    submittedBy: "Ahmad Fauzi",
    approvedBy: "Hendra Wijaya"
  },
  {
    adjNo: "ADJ-000002",
    date: "2026-05-29",
    lpnCode: "LPN-20260501-000001",
    materialDescription: "Hybrid AV9 Raw Seed KG",
    locationCode: "WH1-A11.3",
    bookQtyKg: 79,
    actualQtyKg: 79,
    varianceKg: 0,
    reasonCode: "CONFIRM",
    reasonLabel: "Konfirmasi — Tidak Ada Selisih",
    status: "approved",
    submittedBy: "Ahmad Fauzi",
    approvedBy: "Hendra Wijaya"
  }
];

export const reasonCodes = [
  { code: "SHRINK", label: "Susut / Penyusutan Natural" },
  { code: "DAMAGE", label: "Kerusakan Fisik" },
  { code: "RECOUNT", label: "Salah Hitung — Recount" },
  { code: "TRANSFER", label: "Pindah Lokasi Tidak Tercatat" },
  { code: "SAMPLING", label: "Diambil untuk Sampling / QC" },
  { code: "CONFIRM", label: "Konfirmasi — Tidak Ada Selisih" },
  { code: "OTHER", label: "Lainnya (isi keterangan)" },
];

/* ─── Stock Movements ────────────────────────────────── */

export const stockMovements: StockMovement[] = [
  {
    date: "2026-05-01",
    docNo: "IN-04251101",
    transactionType: "Goods Receipt",
    materialCode: "141000223",
    materialDescription: "Hybrid AV9 Raw Seed KG",
    lotNumber: "NPRHD2003",
    lpnCode: "LPN-20260501-000001",
    qtyKg: 79,
    movementQtyKg: 79,
    fromLocation: "SHELLING",
    toLocation: "RECEIVING-AREA",
    stockType: "Fresh Seed",
    statusAfter: "received",
    createdBy: "Checker A"
  },
  {
    date: "2026-05-01",
    docNo: "PUT-04251101",
    transactionType: "Putaway",
    materialCode: "141000223",
    materialDescription: "Hybrid AV9 Raw Seed KG",
    lotNumber: "NPRHD2003",
    lpnCode: "LPN-20260501-000001",
    qtyKg: 79,
    movementQtyKg: 0,
    fromLocation: "RECEIVING-AREA",
    toLocation: "WH1-A11.3",
    stockType: "Fresh Seed",
    statusAfter: "available",
    createdBy: "Operator A"
  },
  {
    date: "2026-05-12",
    docNo: "IN-04251109",
    transactionType: "Goods Receipt",
    materialCode: "160511350",
    materialDescription: "OP Chilli SHIMA 10gr",
    lotNumber: "230711069",
    lpnCode: "LPN-20260512-000010",
    qtyKg: 26.75,
    movementQtyKg: 26.75,
    fromLocation: "CV. NUSA HEULANG",
    toLocation: "RECEIVING-AREA",
    stockType: "Fresh Seed",
    statusAfter: "received",
    createdBy: "Checker B"
  },
  {
    date: "2026-05-12",
    docNo: "PUT-04251109",
    transactionType: "Putaway",
    materialCode: "160511350",
    materialDescription: "OP Chilli SHIMA 10gr",
    lotNumber: "230711069",
    lpnCode: "LPN-20260512-000010",
    qtyKg: 26.75,
    movementQtyKg: 0,
    fromLocation: "RECEIVING-AREA",
    toLocation: "VEG-RACK-A1.1",
    stockType: "Fresh Seed",
    statusAfter: "available",
    createdBy: "Operator B"
  },
  {
    date: "2026-05-18",
    docNo: "IN-04251108",
    transactionType: "Goods Receipt",
    materialCode: "151000155",
    materialDescription: "PS M AV4 AV5 & AV7 Clean Seed KG",
    lotNumber: "NPCYEB017A",
    lpnCode: "LPN-20260521-000030",
    qtyKg: 338,
    movementQtyKg: 338,
    fromLocation: "SENDER",
    toLocation: "RECEIVING-AREA",
    stockType: "Fresh Seed",
    statusAfter: "received",
    createdBy: "Checker C"
  },
  {
    date: "2026-05-18",
    docNo: "PUT-04251108",
    transactionType: "Putaway",
    materialCode: "151000155",
    materialDescription: "PS M AV4 AV5 & AV7 Clean Seed KG",
    lotNumber: "NPCYEB017A",
    lpnCode: "LPN-20260521-000030",
    qtyKg: 338,
    movementQtyKg: 0,
    fromLocation: "RECEIVING-AREA",
    toLocation: "WH1-A11.3",
    stockType: "Fresh Seed",
    statusAfter: "available",
    createdBy: "Operator C"
  },
  {
    date: "2026-05-20",
    docNo: "IN-04251112",
    transactionType: "Goods Receipt",
    materialCode: "152000198",
    materialDescription: "Hybrid AV4 Clean Seed KG",
    lotNumber: "NPCCA0090",
    lpnCode: "LPN-20260520-000020",
    qtyKg: 1000,
    movementQtyKg: 1000,
    fromLocation: "SENDER",
    toLocation: "RECEIVING-AREA",
    stockType: "Fresh Seed",
    statusAfter: "received",
    createdBy: "Checker A"
  },
  {
    date: "2026-05-20",
    docNo: "PUT-04251112",
    transactionType: "Putaway",
    materialCode: "152000198",
    materialDescription: "Hybrid AV4 Clean Seed KG",
    lotNumber: "NPCCA0090",
    lpnCode: "LPN-20260520-000020",
    qtyKg: 1000,
    movementQtyKg: 0,
    fromLocation: "RECEIVING-AREA",
    toLocation: "WH1-A11.3",
    stockType: "Fresh Seed",
    statusAfter: "available",
    createdBy: "Operator A"
  },
  {
    date: "2026-05-21",
    docNo: "OUT-04251109",
    transactionType: "Reservation",
    materialCode: "151000155",
    materialDescription: "PS M AV4 AV5 & AV7 Clean Seed KG",
    lotNumber: "NPCYEB017A",
    lpnCode: "LPN-20260521-000030",
    qtyKg: 338,
    movementQtyKg: 0,
    fromLocation: "WH1-A11.3",
    toLocation: "WH1-A11.3",
    stockType: "Fresh Seed",
    statusAfter: "reserved",
    createdBy: "Admin A"
  },
  {
    date: "2026-05-22",
    docNo: "PICK-04251109",
    transactionType: "Pick",
    materialCode: "151000155",
    materialDescription: "PS M AV4 AV5 & AV7 Clean Seed KG",
    lotNumber: "NPCYEB017A",
    lpnCode: "LPN-20260521-000030",
    qtyKg: 338,
    movementQtyKg: 0,
    fromLocation: "WH1-A11.3",
    toLocation: "STAGING-OUT-01",
    stockType: "Fresh Seed",
    statusAfter: "staged",
    createdBy: "Operator C"
  },
  {
    date: "2026-05-23",
    docNo: "DN-04251109",
    transactionType: "Dispatch",
    materialCode: "151000155",
    materialDescription: "PS M AV4 AV5 & AV7 Clean Seed KG",
    lotNumber: "NPCYEB017A",
    lpnCode: "LPN-20260521-000030",
    qtyKg: 338,
    movementQtyKg: -338,
    fromLocation: "STAGING-OUT-01",
    toLocation: "Kiat Ananda CS02",
    stockType: "Fresh Seed",
    statusAfter: "shipped",
    createdBy: "Checker C"
  },
  {
    date: "2026-05-24",
    docNo: "ADJ-000001",
    transactionType: "Adjustment",
    materialCode: "160511350",
    materialDescription: "OP Chilli SHIMA 10gr",
    lotNumber: "230711069",
    lpnCode: "LPN-20260512-000010",
    qtyKg: 1,
    movementQtyKg: -1,
    fromLocation: "VEG-RACK-A1.1",
    toLocation: "VEG-RACK-A1.1",
    stockType: "Fresh Seed",
    statusAfter: "available",
    createdBy: "Supervisor A"
  }
];

export const workflowSteps: WorkflowStep[] = [
  {
    workflow: "Inbound",
    step: 1,
    actor: "Planner / Customer",
    activity: "Create ASN",
    trigger: "Inbound shipment notice",
    scanRequired: "No",
    systemAction: "Register inbound order and expected lines",
    output: "ASN / Inbound Order",
    statusBefore: "-",
    statusAfter: "planned"
  },
  {
    workflow: "Receiving",
    step: 2,
    actor: "Receiving Checker",
    activity: "Receive Goods",
    trigger: "Truck arrival",
    scanRequired: "Optional ASN / document",
    systemAction: "Match received quantity against ASN",
    output: "Goods Receipt",
    statusBefore: "planned",
    statusAfter: "received_verified"
  },
  {
    workflow: "LPN Labeling",
    step: 3,
    actor: "Admin",
    activity: "Print LPN Labels",
    trigger: "Goods receipt confirmed",
    scanRequired: "No",
    systemAction: "Split receipt into LPNs by pack size",
    output: "LPN Labels",
    statusBefore: "received_verified",
    statusAfter: "label_printed"
  },
  {
    workflow: "Putaway",
    step: 4,
    actor: "Warehouse Operator",
    activity: "Confirm Putaway",
    trigger: "LPN ready at receiving area",
    scanRequired: "LPN + location",
    systemAction: "Validate LPN, destination, and storage rule",
    output: "Putaway Task Closed",
    statusBefore: "received",
    statusAfter: "available"
  },
  {
    workflow: "Allocation",
    step: 5,
    actor: "Admin/Supervisor",
    activity: "Allocate Stock",
    trigger: "Outbound order released",
    scanRequired: "No",
    systemAction: "Reserve available LPNs and create pick tasks",
    output: "Pick Wave",
    statusBefore: "available",
    statusAfter: "reserved"
  },
  {
    workflow: "Picking",
    step: 6,
    actor: "Warehouse Operator",
    activity: "Confirm Pick",
    trigger: "Picking task active",
    scanRequired: "Location + LPN",
    systemAction: "Validate pick task, location, SKU, lot, and qty",
    output: "Pick Task Closed",
    statusBefore: "reserved",
    statusAfter: "picked"
  },
  {
    workflow: "Staging",
    step: 7,
    actor: "Operator/Checker",
    activity: "Stage for Dispatch",
    trigger: "Picked LPN",
    scanRequired: "Staging location",
    systemAction: "Move picked LPN to staging lane",
    output: "Staged Load",
    statusBefore: "picked",
    statusAfter: "staged"
  },
  {
    workflow: "Dispatch",
    step: 8,
    actor: "Checker/Operator",
    activity: "Confirm Dispatch",
    trigger: "Delivery note ready",
    scanRequired: "DN + LPN",
    systemAction: "Validate load and close dispatch",
    output: "Dispatch Closed",
    statusBefore: "dn_created",
    statusAfter: "shipped"
  },
  {
    workflow: "Cycle Count",
    step: 9,
    actor: "Supervisor/Operator",
    activity: "Count Location",
    trigger: "Count session open",
    scanRequired: "Location + LPN",
    systemAction: "Compare book stock and counted stock",
    output: "Count Variance",
    statusBefore: "open",
    statusAfter: "counted"
  },
  {
    workflow: "Adjustment",
    step: 10,
    actor: "Supervisor",
    activity: "Approve Stock Adjustment",
    trigger: "Variance submitted",
    scanRequired: "No",
    systemAction: "Approve or reject inventory correction",
    output: "Adjusted Inventory",
    statusBefore: "counted",
    statusAfter: "adjusted/closed"
  }
];

export const modules: ModuleItem[] = [
  {
    module: "User & Role Access",
    route: "Sign In",
    features: "User login, role, and warehouse scope",
    tables: "profiles, roles",
    backend: "Secure sign in",
    priority: "MVP",
    notes: "Email/password atau SSO."
  },
  {
    module: "Control Tower",
    route: "Operations Overview",
    features: "Inventory KPIs, open tasks, and transaction monitoring",
    tables: "stock_movements, lpns",
    backend: "Live stock summary",
    priority: "MVP",
    notes: "Realtime/refresh periodik."
  },
  {
    module: "Item Master",
    route: "SKU Setup",
    features: "SKU, description, crop, pack size, and item status",
    tables: "materials",
    backend: "Item setup",
    priority: "MVP",
    notes: "Import Excel."
  },
  {
    module: "Location Master",
    route: "Warehouse Locations",
    features: "Warehouse, room, aisle, rack, bin, staging, and dock",
    tables: "locations",
    backend: "Location setup",
    priority: "MVP",
    notes: "Generate scan code for each active location."
  },
  {
    module: "ASN / Inbound Orders",
    route: "Inbound Orders",
    features: "ASN entry, inbound upload, expected SKU and lot quantity",
    tables: "inbound_documents, inbound_items",
    backend: "Plan review",
    priority: "MVP",
    notes: "Use item master and lot rules."
  },
  {
    module: "LPN Label Printing",
    route: "Labels",
    features: "Print and reprint LPN labels for received inventory",
    tables: "lpns, scan_links",
    backend: "Label batch",
    priority: "MVP",
    notes: "LPN and QR are used for scan execution."
  },
  {
    module: "Scan Workstation",
    route: "Scan Result",
    features: "Open LPN, location, item, or document detail from scan",
    tables: "scan_links",
    backend: "Scan lookup",
    priority: "MVP",
    notes: "Access follows user role."
  },
  {
    module: "Putaway",
    route: "Putaway",
    features: "Confirm LPN to storage location",
    tables: "stock_movements",
    backend: "Putaway posting",
    priority: "MVP",
    notes: "Checks LPN status and destination location."
  },
  {
    module: "Picking",
    route: "Picking",
    features: "Confirm pick task by location, LPN, and quantity",
    tables: "stock_movements",
    backend: "Pick confirmation",
    priority: "MVP",
    notes: "Supports partial pick handling."
  },
  {
    module: "Dispatch",
    route: "Delivery Note",
    features: "Load validation, DN confirmation, and stock issue",
    tables: "delivery_notes, stock_movements",
    backend: "Dispatch posting",
    priority: "MVP",
    notes: "Closes dispatch and updates inventory status."
  },
  {
    module: "Cycle Count",
    route: "Cycle Counts",
    features: "Count location, LPN, and actual quantity",
    tables: "cycle_count_*",
    backend: "Count submission",
    priority: "P1",
    notes: "Variance review before adjustment."
  },
  {
    module: "Offline Scan Queue",
    route: "Offline Scans",
    features: "Hold scan submissions while network is unavailable",
    tables: "sync_queue",
    backend: "Retry sync",
    priority: "P2",
    notes: "Useful for weak warehouse Wi-Fi."
  }
];

export const rolesAccess: RoleAccess[] = [
  {
    process: "Item Master",
    primaryRole: "Admin",
    raci: "R/A",
    access: "Full access",
    notes: "Maintain SKU, pack size, and item status"
  },
  {
    process: "Goods Receiving",
    primaryRole: "Receiving Checker",
    raci: "R",
    access: "Create",
    notes: "Confirm received quantity and variance"
  },
  {
    process: "Putaway",
    primaryRole: "Warehouse Operator",
    raci: "R",
    access: "Create",
    notes: "Confirm LPN into storage location"
  },
  {
    process: "Allocation / Reservation",
    primaryRole: "Admin/Supervisor",
    raci: "R/A",
    access: "Update/Approve",
    notes: "Reserve available inventory for pick tasks"
  },
  {
    process: "Dispatch",
    primaryRole: "Checker/Operator",
    raci: "R",
    access: "Create",
    notes: "Validate load and close dispatch"
  },
  {
    process: "Stock Adjustment",
    primaryRole: "Supervisor",
    raci: "A",
    access: "Approve",
    notes: "Approve inventory correction after variance review"
  },
  {
    process: "Inventory Overview",
    primaryRole: "WH Advanta Viewer",
    raci: "I",
    access: "View",
    notes: "Inventory and work progress monitoring"
  },
  {
    process: "Inventory Transactions",
    primaryRole: "Supervisor/Admin",
    raci: "A",
    access: "View",
    notes: "Trace scan, document, LPN, location, and user activity"
  }
];

export const scanScenarios: ScanScenario[] = [
  {
    scenario: "LPN Inquiry",
    mode: "Inventory Lookup",
    firstScan: "LPN QR / barcode",
    nextInput: "-",
    validation: "LPN exists and user has inventory access",
    result: "Show SKU, lot, quantity, current location, and status",
    error: "Show not found or access denied"
  },
  {
    scenario: "Putaway Confirmation",
    mode: "Putaway",
    firstScan: "LPN",
    nextInput: "Destination location",
    validation: "LPN is received and destination is active",
    result: "Close putaway task and update current location",
    error: "Block if LPN status or location is invalid"
  },
  {
    scenario: "Pick Confirmation",
    mode: "Picking",
    firstScan: "Pick location",
    nextInput: "LPN + picked quantity",
    validation: "Task is open, LPN is reserved, SKU and lot match",
    result: "Close pick task and move inventory to picked status",
    error: "Block wrong location, LPN, SKU, lot, or quantity"
  },
  {
    scenario: "Dispatch Confirmation",
    mode: "Dispatch",
    firstScan: "Delivery note",
    nextInput: "LPNs on load",
    validation: "Delivery note is released and all LPNs belong to the load",
    result: "Close dispatch and issue stock",
    error: "Block missing, extra, or already dispatched LPN"
  },
  {
    scenario: "Cycle Count Entry",
    mode: "Cycle Count",
    firstScan: "Count location",
    nextInput: "LPN + counted quantity",
    validation: "Count session is open and location is in scope",
    result: "Save count line and flag variance",
    error: "Flag missing, extra, or quantity mismatch"
  }
];

export const statusRules: StatusRule[] = [
  {
    status: "draft",
    previous: "-",
    next: "label_printed",
    trigger: "Admin generate label",
    rule: "LPN is not available for warehouse execution"
  },
  {
    status: "label_printed",
    previous: "draft",
    next: "received",
    trigger: "Label attachment confirmation",
    rule: "LPN label is applied and ready for receiving release"
  },
  {
    status: "received",
    previous: "label_printed",
    next: "available",
    trigger: "Putaway confirmation",
    rule: "Inventory becomes available in storage"
  },
  {
    status: "available",
    previous: "received/available",
    next: "reserved",
    trigger: "Outbound allocation",
    rule: "Inventory is reserved for a single outbound order"
  },
  {
    status: "reserved",
    previous: "available",
    next: "picked",
    trigger: "Picking scan",
    rule: "Inventory has been picked from storage"
  },
  {
    status: "picked",
    previous: "reserved",
    next: "staged",
    trigger: "Scan staging",
    rule: "Inventory is waiting in staging or loading area"
  },
  {
    status: "staged",
    previous: "picked",
    next: "shipped",
    trigger: "Dispatch confirmation",
    rule: "Inventory is issued from warehouse stock"
  }
];

export const rpcEndpoints: RpcEndpoint[] = [
  {
    name: "Scan lookup",
    type: "RPC",
    caller: "All roles",
    payload: "{ raw_value, workflow, device_info }",
    response: "entity_type, entity_id, display_payload",
    tables: "scan_links, scan_events",
    validation: "Validate scan code, entity, permission, and status",
    priority: "MVP"
  },
  {
    name: "Label batch",
    type: "RPC",
    caller: "Admin",
    payload: "{ inbound_item_id, package_size }",
    response: "lpns[], label_payload[]",
    tables: "inbound_items, lpns, scan_links",
    validation: "Split received quantity by standard pack size",
    priority: "MVP"
  },
  {
    name: "Putaway confirmation",
    type: "RPC",
    caller: "Operator",
    payload: "{ lpn_token, location_token, idempotency_key }",
    response: "movement_id",
    tables: "lpns, locations, stock_movements",
    validation: "LPN is ready, location is active, duplicate submit is blocked",
    priority: "MVP"
  },
  {
    name: "Stock allocation",
    type: "RPC",
    caller: "Admin/Supervisor",
    payload: "{ outbound_id, strategy/manual_lpn }",
    response: "picking_tasks[]",
    tables: "outbound_items, lpns, picking_tasks",
    validation: "Available stock is not already reserved",
    priority: "MVP"
  },
  {
    name: "Pick confirmation",
    type: "RPC",
    caller: "Operator",
    payload: "{ task_id, location_token, lpn_token, qty, idempotency_key }",
    response: "pick_result",
    tables: "picking_tasks, stock_movements",
    validation: "Task, location, LPN, and quantity match",
    priority: "MVP"
  },
  {
    name: "Dispatch confirmation",
    type: "RPC",
    caller: "Checker/Operator",
    payload: "{ dn_token, lpn_tokens[], idempotency_key }",
    response: "stock_out_result",
    tables: "stock_movements, lpns",
    validation: "Delivery note is valid and all LPNs match",
    priority: "MVP"
  },
  {
    name: "Adjustment approval",
    type: "RPC",
    caller: "Supervisor",
    payload: "{ count_line_id, approved_qty, reason }",
    response: "movement_id",
    tables: "stock_movements",
    validation: "Variance has reason code and approval",
    priority: "P1"
  },
  {
    name: "Offline sync",
    type: "Edge Function/RPC",
    caller: "Scanner app",
    payload: "{ events[] }",
    response: "sync_result[]",
    tables: "scan_events, stock_movements",
    validation: "Retry is safe and conflicts are visible",
    priority: "P2"
  }
];

export const processMap = [
  {
    step: "1",
    sender: "Send ASN",
    admin: "Create inbound order",
    checker: "",
    operator: "",
    system: "Inbound plan created",
    dashboard: "Expected receipts"
  },
  {
    step: "2",
    sender: "",
    admin: "",
    checker: "Confirm received qty",
    operator: "",
    system: "Receiving result saved",
    dashboard: "Receiving variance"
  },
  {
    step: "3",
    sender: "",
    admin: "Print LPN labels",
    checker: "",
    operator: "",
    system: "LPN labels ready",
    dashboard: "LPNs pending putaway"
  },
  {
    step: "4",
    sender: "",
    admin: "",
    checker: "Apply and confirm labels",
    operator: "",
    system: "Label validated",
    dashboard: "Received LPNs"
  },
  {
    step: "5",
    sender: "",
    admin: "",
    checker: "",
    operator: "Confirm putaway",
    system: "Putaway completed",
    dashboard: "Available inventory"
  },
  {
    step: "6",
    sender: "Submit outbound order",
    admin: "Release order",
    checker: "",
    operator: "",
    system: "Outbound request submitted",
    dashboard: "Open outbound demand"
  },
  {
    step: "7",
    sender: "",
    admin: "Allocate stock",
    checker: "",
    operator: "",
    system: "Stock reserved and tasks ready",
    dashboard: "Reserved inventory"
  },
  {
    step: "8",
    sender: "",
    admin: "",
    checker: "",
    operator: "Confirm pick task",
    system: "Picking confirmed",
    dashboard: "Picked inventory"
  },
  {
    step: "9",
    sender: "",
    admin: "",
    checker: "Validate staged load",
    operator: "Move to staging lane",
    system: "Staging confirmed",
    dashboard: "Loads ready to dispatch"
  },
  {
    step: "10",
    sender: "",
    admin: "",
    checker: "Confirm dispatch",
    operator: "Load vehicle",
    system: "Dispatch completed",
    dashboard: "Inventory issued"
  }
];

export const scanLinks = [
  {
    token: "A7K9Q2",
    entityType: "LPN",
    entityCode: "LPN-20260520-000020",
    title: "Hybrid AV4 Clean Seed KG",
    subtitle: "Lot NPCCA0090, 1,000 KG, Fresh Seed",
    status: "available"
  },
  {
    token: "LOC-A113",
    entityType: "Location",
    entityCode: "WH1-A11.3",
    title: "Warehouse 1 Aisle A Rack 11 Level 3",
    subtitle: "Storage, capacity 50,000 KG",
    status: "active"
  },
  {
    token: "DN-0425",
    entityType: "Delivery Note",
    entityCode: "DN-04251109",
    title: "Delivery Note DN-04251109",
    subtitle: "Destination Kiat Ananda CS02",
    status: "dn_created"
  }
];

export function currentStock() {
  const grouped = new Map<
    string,
    {
      lpnCode: string;
      materialCode: string;
      materialDescription: string;
      lotNumber: string;
      currentLocation: string;
      stockType: string;
      qtyCurrentKg: number;
      status: string;
      lastDocNo: string;
      lastUpdate: string;
    }
  >();

  for (const movement of stockMovements) {
    const existing = grouped.get(movement.lpnCode);
    grouped.set(movement.lpnCode, {
      lpnCode: movement.lpnCode,
      materialCode: movement.materialCode,
      materialDescription: movement.materialDescription,
      lotNumber: movement.lotNumber,
      currentLocation: movement.toLocation,
      stockType: movement.stockType,
      qtyCurrentKg: (existing?.qtyCurrentKg ?? 0) + movement.movementQtyKg,
      status: movement.statusAfter,
      lastDocNo: movement.docNo,
      lastUpdate: movement.date
    });
  }

  return Array.from(grouped.values());
}

export function dashboardMetrics() {
  const stock = currentStock();
  const totalStockKg = stock.reduce((sum, row) => sum + row.qtyCurrentKg, 0);
  const availableStockKg = stock
    .filter((row) => row.status === "available")
    .reduce((sum, row) => sum + row.qtyCurrentKg, 0);
  const shippedStockKg = stock
    .filter((row) => row.status === "shipped")
    .reduce((sum, row) => sum + Math.abs(row.qtyCurrentKg), 0);
  const activeLpnCount = stock.filter((row) => row.status === "available").length;
  const inboundKg = stockMovements
    .filter((row) => row.transactionType === "Goods Receipt")
    .reduce((sum, row) => sum + row.qtyKg, 0);
  const outboundKg = stockMovements
    .filter((row) => row.transactionType === "Dispatch")
    .reduce((sum, row) => sum + row.qtyKg, 0);

  return {
    totalStockKg,
    availableStockKg,
    shippedStockKg,
    activeLpnCount,
    inboundKg,
    outboundKg,
    movementCount: stockMovements.length,
    materialCount: materials.length,
    locationCount: locations.length
  };
}
