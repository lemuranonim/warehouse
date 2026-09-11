# Warehouse Digitalization Blueprint

## Peran File Acuan

- PDF Incoming Note: contoh format output laporan penerimaan.
- PDF Delivery Note: contoh format output laporan pengiriman.
- `Sample Database WH Prasad 1.xlsx`: sumber database historis dan struktur master/inventory untuk migrasi.

Nomor dokumen, lot, kuantitas, dan nama pihak yang terlihat di PDF contoh tidak dimasukkan sebagai transaksi WMS.

## Prinsip

- Setiap package/pallet memiliki LPN unik.
- QR menyimpan link/token pendek, bukan detail stok.
- Semua scan menulis `wms_scan_events`.
- Stok tidak diedit manual; perubahan stok berasal dari `wms_stock_movements`.
- Dashboard membaca `wms_current_stock_view`.
- Akses dibatasi role dan RLS Supabase.
- Laporan dibentuk dari data WMS pada saat preview/export.

## Workflow MVP

1. Admin mengimpor dan memvalidasi database lama dari workbook.
2. Supervisor meninjau rekonsiliasi sebelum saldo awal atau koreksi diposting ke ledger.
3. Inbound plan dibuat oleh Admin atau WH Advanta.
4. Checker melakukan receiving verification dan discrepancy.
5. Admin menghasilkan LPN/package dan label QR.
6. Checker scan label attachment.
7. Operator scan LPN dan lokasi untuk putaway.
8. Admin/Supervisor membuat outbound allocation dan reservation.
9. Operator picking, memindahkan ke staging, dan Checker memverifikasi load.
10. Delivery note dibuat dari data pengiriman WMS dan dapat diekspor dalam format PDF acuan.
11. Operator melakukan final shipping scan dan Supervisor menangani cycle count/adjustment.

## Output Laporan

- Header menyimpan tanggal dokumen, From, To, Address, Truck ID, Prepare by, DO No, nomor formulir, edition, revision, dan effective date.
- Detail mempertahankan line number, material code, description, lot, qty, UOM, dan remark.
- Sign-off Warehouse In-Charge, Transporter, Receiver, dan Data Entry Receiving disimpan terpisah.
- Preview web memakai format tabel PDF acuan serta mode cetak Letter portrait.

## Migrasi Database Excel

- Product List menjadi acuan pemetaan master material.
- P01, P02 Latest, P02, KA01, KS01, dan SAP dinormalisasi ke struktur staging inventory.
- Setiap batch menyimpan file, sheet, jenis sumber, gudang, jumlah baris, status, dan pengguna import.
- Setiap baris menyimpan nomor baris sumber untuk audit dan pesan validasi untuk perbaikan.
- Snapshot tidak langsung menimpa stok; view rekonsiliasi membandingkannya dengan saldo ledger per material dan lot.

## Supabase Surfaces

- Semua objek WMS berada di schema `public` dengan awalan `wms_`; Supabase Auth tetap memakai `auth.users` bersama `advanta-cc`.
- Tables: `wms_materials`, `wms_locations`, `wms_lpns`, `wms_scan_links`, `wms_scan_events`, `wms_stock_movements`, `wms_inbound_*`, `wms_outbound_*`, `wms_picking_tasks`, `wms_delivery_notes`, `wms_document_signoffs`, `wms_inventory_import_*`, `wms_cycle_count_*`.
- Views: `wms_current_stock_view`, `wms_inventory_snapshot_reconciliation_view`.
- RPC MVP: `wms_resolve_scan_token`, `wms_generate_lpn_labels`, `wms_attach_lpn_label`, `wms_putaway_lpn`, `wms_allocate_outbound`, `wms_pick_lpn`, `wms_stage_lpn`, `wms_verify_outbound`, `wms_create_delivery_note`, `wms_ship_delivery_note`.
