# Warehouse Digitalization WMS

Project Next.js + Supabase untuk digitalisasi workflow warehouse berbasis LPN, QR/barcode, scan event, stock movement ledger, dan dashboard realtime.

Blueprint awal diambil dari `Warehouse_Digitalization_Workflow_Final.xlsx`, lalu diterjemahkan menjadi:

- Next.js App Router untuk Admin, Checker, Operator, Supervisor, dan Scanner PWA.
- Supabase Postgres/Auth/RLS sebagai backend utama.
- Ledger `stock_movements` sebagai sumber kebenaran stok.
- QR/link token pendek di `/s/[token]` untuk resolve LPN, location, material, outbound, dan delivery note.
- SQL migration dengan tabel, seed, view `current_stock_view`, policy RLS, dan RPC inti.

## Menjalankan Project

```bash
npm install
npm run dev
```

Buat `.env.local` dari `.env.example`, lalu isi:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Supabase

Jalankan SQL di [supabase/migrations/0001_initial_schema.sql](./supabase/migrations/0001_initial_schema.sql) pada SQL editor Supabase atau melalui Supabase CLI.

## Route Utama

- `/` dashboard KPI, movement, workflow, dan process map.
- `/admin` cockpit modul dan akses.
- `/operator/scan` scanner PWA keyboard/token mode.
- `/s/A7K9Q2` contoh resolver QR LPN.
- `/admin/materials`, `/admin/locations`, `/admin/inbound`, `/admin/outbound`, `/admin/labels`, `/admin/audit`.
- `/checker/receiving`, `/checker/shipping`.
- `/operator/putaway`, `/operator/picking`, `/operator/cycle-count`, `/operator/lookup`.
- `/supervisor/adjustments`.
