# Warehouse Digitalization Blueprint

Sumber: `Warehouse_Digitalization_Workflow_Final.xlsx`.

## Prinsip

- Setiap package/pallet memiliki LPN unik.
- QR menyimpan link/token pendek, bukan detail stok.
- Semua scan menulis `scan_events`.
- Stok tidak diedit manual; perubahan stok berasal dari `stock_movements`.
- Dashboard membaca `current_stock_view`.
- Akses dibatasi role + RLS Supabase.

## Workflow MVP

1. Inbound plan dibuat oleh Admin atau WH Advanta.
2. Checker melakukan receiving verification dan discrepancy.
3. Admin generate LPN/package dan label QR.
4. Checker scan label attachment.
5. Operator scan LPN dan lokasi untuk putaway.
6. Admin/Supervisor membuat outbound allocation dan reservation.
7. Operator picking scan lokasi, LPN, dan qty.
8. Operator move to staging.
9. Checker verify staging dan membuat delivery note.
10. Checker/Operator final shipping scan.
11. Supervisor membuka cycle count.
12. Operator scan actual location/LPN/qty.
13. Supervisor approve adjustment.

## Supabase Surfaces

- Tables: `materials`, `locations`, `lpns`, `scan_links`, `scan_events`, `stock_movements`, `inbound_*`, `outbound_*`, `picking_tasks`, `delivery_notes`, `cycle_count_*`.
- View: `current_stock_view`.
- RPC MVP: `resolve_scan_token`, `generate_lpn_labels`, `attach_lpn_label`, `putaway_lpn`, `allocate_outbound`, `pick_lpn`, `stage_lpn`, `verify_outbound`, `create_delivery_note`, `ship_delivery_note`.
