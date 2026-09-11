-- WMS objects use the wms_ prefix so this migration can safely share the advanta-cc Supabase project.
begin;

-- Report metadata follows the Incoming Note and Delivery Note PDF layouts.
-- The PDFs are format references only; this migration intentionally seeds no PDF transactions.

alter table public.wms_inbound_documents
  add column if not exists document_date date,
  add column if not exists do_no text,
  add column if not exists destination text,
  add column if not exists address text,
  add column if not exists truck_id text,
  add column if not exists prepared_by_name text,
  add column if not exists source_file text,
  add column if not exists form_document_no text,
  add column if not exists edition_no text,
  add column if not exists revision_no text,
  add column if not exists effective_date date;

alter table public.wms_inbound_items
  add column if not exists line_no integer,
  add column if not exists source_description text,
  add column if not exists uom text not null default 'KG',
  add column if not exists remark text;

alter table public.wms_outbound_documents
  add column if not exists document_date date,
  add column if not exists do_no text,
  add column if not exists origin text,
  add column if not exists address text,
  add column if not exists truck_id text,
  add column if not exists prepared_by_name text,
  add column if not exists source_file text;

alter table public.wms_outbound_items
  add column if not exists line_no integer,
  add column if not exists source_description text,
  add column if not exists uom text not null default 'KG',
  add column if not exists remark text;

alter table public.wms_delivery_notes
  add column if not exists document_date date,
  add column if not exists origin text,
  add column if not exists destination text,
  add column if not exists address text,
  add column if not exists truck_id text,
  add column if not exists prepared_by_name text,
  add column if not exists source_file text,
  add column if not exists form_document_no text,
  add column if not exists edition_no text,
  add column if not exists revision_no text,
  add column if not exists effective_date date;

create table if not exists public.wms_document_signoffs (
  id uuid primary key default gen_random_uuid(),
  inbound_document_id uuid references public.wms_inbound_documents(id) on delete cascade,
  delivery_note_id uuid references public.wms_delivery_notes(id) on delete cascade,
  signoff_role text not null
    check (signoff_role in ('Warehouse In-Charge', 'Transporter', 'Receiver', 'Data Entry Receiving')),
  signer_name text,
  signed_date date,
  signature_asset_path text,
  created_at timestamptz not null default now(),
  constraint wms_document_signoffs_single_parent check (
    num_nonnulls(inbound_document_id, delivery_note_id) = 1
  )
);

create unique index if not exists wms_document_signoffs_inbound_role_uidx
  on public.wms_document_signoffs(inbound_document_id, signoff_role)
  where inbound_document_id is not null;

create unique index if not exists wms_document_signoffs_delivery_role_uidx
  on public.wms_document_signoffs(delivery_note_id, signoff_role)
  where delivery_note_id is not null;

-- The historical Excel workbook is ingested into staging first. Posting remains an
-- explicit reviewed step so the append-only stock ledger stays the source of truth.
create table if not exists public.wms_inventory_import_batches (
  id uuid primary key default gen_random_uuid(),
  source_file text not null,
  source_sheet text not null,
  source_kind text not null default 'inventory_snapshot'
    check (source_kind in ('inventory_snapshot', 'material_master', 'sap_reference', 'legacy_archive')),
  warehouse text,
  source_date date,
  row_count integer not null default 0 check (row_count >= 0),
  status text not null default 'uploaded'
    check (status in ('uploaded', 'validated', 'posted', 'failed', 'cancelled')),
  imported_by uuid references public.wms_profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.wms_inventory_import_lines (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.wms_inventory_import_batches(id) on delete cascade,
  source_row integer not null check (source_row > 0),
  stock_date date,
  material_id uuid references public.wms_materials(id),
  material_code text not null,
  material_description text,
  hybrid text,
  stage text,
  flagging text,
  lot_number text not null,
  qty_kg numeric(18, 3) not null,
  warehouse text not null,
  material_type text,
  product text,
  crop text,
  inventory_status text,
  return_classification text,
  ageing_days integer,
  sap_qty_kg numeric(18, 3),
  note text,
  remark text,
  source_hash text,
  validation_result text not null default 'pending'
    check (validation_result in ('pending', 'valid', 'warning', 'blocked')),
  validation_message text,
  created_at timestamptz not null default now(),
  unique (batch_id, source_row)
);

create index if not exists wms_inventory_import_lines_material_lot_idx
  on public.wms_inventory_import_lines(material_code, lot_number);

create index if not exists wms_inventory_import_lines_warehouse_idx
  on public.wms_inventory_import_lines(warehouse);

create or replace view public.wms_inventory_snapshot_reconciliation_view as
with wms_lot_stock as (
  select material_code, lot_number, sum(qty_current_kg) as wms_qty_kg
  from public.wms_current_stock_view
  group by material_code, lot_number
)
select
  line.id,
  line.batch_id,
  batch.source_file,
  batch.source_sheet,
  line.source_row,
  line.stock_date,
  line.material_code,
  line.material_description,
  line.lot_number,
  line.warehouse,
  line.qty_kg as snapshot_qty_kg,
  coalesce(wms.wms_qty_kg, 0) as wms_qty_kg,
  line.qty_kg - coalesce(wms.wms_qty_kg, 0) as variance_qty_kg,
  line.validation_result,
  line.validation_message
from public.wms_inventory_import_lines line
join public.wms_inventory_import_batches batch on batch.id = line.batch_id
left join wms_lot_stock wms
  on wms.material_code = line.material_code
 and wms.lot_number = line.lot_number;

alter table public.wms_document_signoffs enable row level security;
alter table public.wms_inventory_import_batches enable row level security;
alter table public.wms_inventory_import_lines enable row level security;

create policy wms_document_signoffs_read
  on public.wms_document_signoffs for select to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Checker') or public.wms_has_role('Supervisor'));

create policy wms_document_signoffs_write
  on public.wms_document_signoffs for all to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Checker') or public.wms_has_role('Supervisor'))
  with check (public.wms_has_role('Admin') or public.wms_has_role('Checker') or public.wms_has_role('Supervisor'));

create policy wms_inventory_import_batches_read
  on public.wms_inventory_import_batches for select to authenticated using (true);

create policy wms_inventory_import_batches_write
  on public.wms_inventory_import_batches for all to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Supervisor'))
  with check (public.wms_has_role('Admin') or public.wms_has_role('Supervisor'));

create policy wms_inventory_import_lines_read
  on public.wms_inventory_import_lines for select to authenticated using (true);

create policy wms_inventory_import_lines_write
  on public.wms_inventory_import_lines for all to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Supervisor'))
  with check (public.wms_has_role('Admin') or public.wms_has_role('Supervisor'));

commit;
