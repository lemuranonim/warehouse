# Warehouse Digitalization WMS

Warehouse Management System PT Advanta Seeds Indonesia berbasis Next.js dan Supabase. Sistem menggunakan LPN, QR/barcode, role-based access, ledger append-only, audit trail, idempotency, dan pembaruan data real-time.

## Status fitur

Fitur yang sudah terhubung ke fondasi live:

- login/logout Supabase dan refresh session berbasis cookie;
- otorisasi Admin, Checker, Operator Forklift, Supervisor, dan WH Advanta Viewer;
- dashboard live ter-scope warehouse;
- lookup token scanner dengan audit event;
- putaway LPN atomik dengan idempotency key dan validasi kapasitas lokasi;
- staging dan posting workbook `.xlsx` atomik dengan deduplikasi hash, pembatasan ukuran, dan proteksi ZIP bomb;
- master warehouse, lokasi, material, stock type, dan akses user;
- inbound, receiving, LPN, putaway, outbound FEFO, picking/split LPN, staging, DN, dan dispatch;
- cycle count, approval adjustment, label QR, dokumen cetak, audit trail, offline fallback, health check, dan security headers;
- realtime refresh berbasis Supabase Realtime untuk seluruh tabel operasional.

Mutasi bisnis tidak dilakukan langsung dari browser ke tabel. Semua write operasional melewati RPC tervalidasi sesuai role dan dicatat di audit trail. Go-live tetap membutuhkan master data aktual dan UAT proses warehouse.

## Menjalankan secara lokal

Persyaratan: Node.js 20.9 atau lebih baru dan project Supabase yang sudah dimigrasikan.

```bash
npm install
npm run dev
```

Salin `.env.example` menjadi `.env.local`, kemudian isi:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WMS_DATA_MODE=demo
WMS_IMPORT_MAX_BYTES=20971520
```

Gunakan `demo` selama review UI. Mode ini read-only dan scanner tidak menjalankan RPC. Gunakan `live` hanya setelah migrasi keamanan, provisioning user, dan UAT selesai. Jangan menaruh service-role key di aplikasi ini.

## Database dan keamanan

Project dirancang berbagi Supabase Auth dengan aplikasi Advanta lain. Semua objek warehouse menggunakan prefix `wms_`. Terapkan migrasi secara berurutan:

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_operational_documents_and_inventory_import.sql`
3. `supabase/migrations/0003_production_security_hardening.sql`
4. `supabase/migrations/0004_full_workflow_realtime.sql`
5. `supabase/migrations/0005_wms_privilege_cleanup.sql`

Migrasi `0003` sampai `0005` wajib sebelum mode live. Migrasi `0004` menambahkan seluruh RPC workflow, audit trail, idempotency, import atomik, RLS write lockdown, dan publikasi realtime. Migrasi `0005` mencabut default privilege API yang tidak dilindungi oleh RLS.

Runbook deployment, provisioning role, batas modul, dan checklist UAT tersedia di [docs/PRODUCTION_READINESS.md](./docs/PRODUCTION_READINESS.md).

## Pemeriksaan sebelum deploy

```bash
npm run check
npm audit --omit=dev
```

`npm run check` menjalankan lint, typecheck, unit test, dan production build. Endpoint monitoring tersedia di `/api/health` dan tidak membocorkan kredensial atau detail database.

## Route utama

- `/` — dashboard dan status sumber data.
- `/admin` — control tower dan pengelolaan.
- `/admin/inventory` — validasi, staging, dan posting workbook inventory.
- `/operator/scan` — scan workstation.
- `/operator/putaway` — workflow putaway.
- `/checker/receiving` dan `/checker/shipping` — workflow checker.
- `/documents/incoming/[docNo]` dan `/documents/delivery/[docNo]` — preview/cetak dokumen.
- `/s/[token]` — resolver token QR yang tetap membutuhkan session WMS.
