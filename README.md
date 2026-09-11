# Warehouse Digitalization WMS

Project Next.js + Supabase untuk digitalisasi workflow warehouse berbasis LPN, QR/barcode, scan event, stock movement ledger, dan dashboard realtime.

Blueprint awal diambil dari `Warehouse_Digitalization_Workflow_Final.xlsx`, kemudian disesuaikan dengan format laporan dan database lama Warehouse Prasad:

- Next.js App Router untuk Admin, Checker, Operator, Supervisor, dan Scanner PWA.
- Supabase Postgres/Auth/RLS sebagai backend utama.
- Ledger `wms_stock_movements` sebagai sumber kebenaran stok.
- QR/link token pendek di `/s/[token]` untuk resolve LPN, location, material, outbound, dan delivery note.
- SQL migration terisolasi dengan awalan `wms_`, view `wms_current_stock_view`, policy RLS, dan RPC inti.
- Incoming Note dan Delivery Note dihasilkan dari data WMS memakai tata letak PDF acuan; isi PDF tidak diimpor sebagai transaksi.
- Pembaca workbook `.xlsx` untuk validasi sheet database lama, staging snapshot inventory, dan rekonsiliasi terhadap ledger WMS.

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

Project ini dirancang berbagi Supabase dan `auth.users` dengan `advanta-cc`. Seluruh tabel, view, function, trigger, index, dan policy WMS memakai awalan `wms_` agar tidak berbenturan dengan objek aplikasi yang sudah ada.

Jalankan SQL di [supabase/migrations/0001_initial_schema.sql](./supabase/migrations/0001_initial_schema.sql) pada SQL editor Supabase atau melalui Supabase CLI. Setelah berhasil, jalankan migrasi `0002`.

## Route Utama

- `/` dashboard KPI, movement, workflow, dan process map.
- `/admin` cockpit modul dan akses.
- `/operator/scan` scanner PWA keyboard/token mode.
- `/s/A7K9Q2` contoh resolver QR LPN.
- `/admin/materials`, `/admin/locations`, `/admin/inbound`, `/admin/outbound`, `/admin/labels`, `/admin/audit`.
- `/admin/inventory` untuk membaca, memetakan, dan memvalidasi workbook database lama sebelum posting.
- `/documents/incoming/[docNo]` dan `/documents/delivery/[docNo]` untuk preview/cetak dokumen.
- `/checker/receiving`, `/checker/shipping`.
- `/operator/putaway`, `/operator/picking`, `/operator/cycle-count`, `/operator/lookup`.
- `/supervisor/adjustments`.

## Migrasi Lanjutan

Jalankan `supabase/migrations/0002_operational_documents_and_inventory_import.sql` setelah migrasi awal. Migrasi ini menambah metadata laporan, sign-off, batch import workbook, baris staging snapshot, dan view rekonsiliasi. Migrasi tidak memasukkan transaksi dari PDF acuan maupun mengubah tabel milik `advanta-cc`.
