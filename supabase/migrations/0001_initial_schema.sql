-- WMS objects use the wms_ prefix so this migration can safely share the advanta-cc Supabase project.
begin;

create extension if not exists pgcrypto;

create table public.wms_roles (
  id bigserial primary key,
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.wms_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  default_warehouse text,
  warehouse_scope text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.wms_user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.wms_profiles(id) on delete cascade,
  role_id bigint not null references public.wms_roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

create table public.wms_warehouses (
  id uuid primary key default gen_random_uuid(),
  warehouse_code text not null unique,
  name text not null,
  site text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.wms_locations (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid references public.wms_warehouses(id),
  location_code text not null unique,
  site text,
  warehouse text,
  room text,
  aisle text,
  rack text,
  level text,
  bin text,
  location_type text not null default 'storage'
    check (location_type in ('storage', 'staging', 'loading', 'receiving', 'quarantine')),
  capacity_kg numeric(18, 3),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.wms_materials (
  id uuid primary key default gen_random_uuid(),
  material_code text not null unique,
  long_description text not null,
  hybrid text,
  stage text,
  flagging text,
  type text,
  product text,
  crop text,
  status text not null default 'active',
  order_unit text,
  standard_package_kg numeric(18, 3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.wms_lots (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.wms_materials(id),
  lot_number text not null,
  stock_type text not null default 'Fresh Seed',
  exp_date date,
  created_at timestamptz not null default now(),
  unique (material_id, lot_number, stock_type)
);

create table public.wms_inbound_documents (
  id uuid primary key default gen_random_uuid(),
  doc_no text not null unique,
  sender text,
  status text not null default 'planned'
    check (status in ('planned', 'received_verified', 'label_printed', 'closed', 'cancelled')),
  received_at timestamptz,
  created_by uuid references public.wms_profiles(id),
  created_at timestamptz not null default now()
);

create table public.wms_inbound_items (
  id uuid primary key default gen_random_uuid(),
  inbound_doc_id uuid not null references public.wms_inbound_documents(id) on delete cascade,
  material_id uuid not null references public.wms_materials(id),
  lot_id uuid references public.wms_lots(id),
  lot_number text not null,
  planned_qty_kg numeric(18, 3) not null,
  received_qty_kg numeric(18, 3),
  status text not null default 'planned',
  created_at timestamptz not null default now()
);

create table public.wms_lpns (
  id uuid primary key default gen_random_uuid(),
  lpn_code text not null unique,
  material_id uuid not null references public.wms_materials(id),
  lot_id uuid references public.wms_lots(id),
  lot_number text not null,
  batch_rename text,
  exp_date date,
  qty_initial_kg numeric(18, 3) not null default 0,
  qty_current_kg numeric(18, 3) not null default 0,
  current_location_id uuid references public.wms_locations(id),
  stock_type text not null default 'Fresh Seed',
  status text not null default 'draft'
    check (status in ('draft', 'label_printed', 'received', 'available', 'reserved', 'picked', 'staged', 'staged_verified', 'dn_created', 'shipped', 'closed', 'quarantine', 'damaged', 'void')),
  inbound_doc_id uuid references public.wms_inbound_documents(id),
  is_void boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.wms_scan_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  entity_type text not null check (entity_type in ('lpn', 'location', 'material', 'outbound', 'delivery_note')),
  entity_id uuid not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.wms_outbound_documents (
  id uuid primary key default gen_random_uuid(),
  doc_no text not null unique,
  destination text,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'reserved', 'picking', 'staged', 'staged_verified', 'dn_created', 'shipped', 'closed', 'cancelled')),
  requested_by uuid references public.wms_profiles(id),
  created_at timestamptz not null default now()
);

create table public.wms_outbound_items (
  id uuid primary key default gen_random_uuid(),
  outbound_doc_id uuid not null references public.wms_outbound_documents(id) on delete cascade,
  material_id uuid not null references public.wms_materials(id),
  lot_id uuid references public.wms_lots(id),
  lot_number text,
  requested_qty_kg numeric(18, 3) not null,
  allocated_qty_kg numeric(18, 3) not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table public.wms_picking_tasks (
  id uuid primary key default gen_random_uuid(),
  outbound_item_id uuid not null references public.wms_outbound_items(id) on delete cascade,
  lpn_id uuid not null references public.wms_lpns(id),
  from_location_id uuid references public.wms_locations(id),
  qty_kg numeric(18, 3) not null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'picked', 'staged', 'cancelled')),
  assigned_to uuid references public.wms_profiles(id),
  created_at timestamptz not null default now()
);

create table public.wms_delivery_notes (
  id uuid primary key default gen_random_uuid(),
  outbound_doc_id uuid not null references public.wms_outbound_documents(id),
  dn_no text not null unique,
  status text not null default 'created'
    check (status in ('created', 'loaded', 'shipped', 'void')),
  created_by uuid references public.wms_profiles(id),
  created_at timestamptz not null default now()
);

create table public.wms_stock_movements (
  id uuid primary key default gen_random_uuid(),
  movement_date timestamptz not null default now(),
  transaction_type text not null
    check (transaction_type in ('Inbound', 'Putaway', 'Transfer', 'Reserve', 'Pick', 'Stage', 'Outbound', 'Adjustment', 'Cycle Count')),
  material_id uuid not null references public.wms_materials(id),
  lpn_id uuid references public.wms_lpns(id),
  qty_kg numeric(18, 3) not null default 0,
  movement_qty_kg numeric(18, 3) not null default 0,
  from_location_id uuid references public.wms_locations(id),
  to_location_id uuid references public.wms_locations(id),
  reference_type text,
  reference_id uuid,
  idempotency_key text not null unique,
  created_by uuid references public.wms_profiles(id),
  created_at timestamptz not null default now()
);

create table public.wms_scan_events (
  id uuid primary key default gen_random_uuid(),
  scanned_at timestamptz not null default now(),
  raw_value text not null,
  token text,
  entity_type text,
  entity_id uuid,
  workflow text not null,
  action text,
  result text not null check (result in ('success', 'warning', 'failed', 'blocked')),
  message text,
  user_id uuid references public.wms_profiles(id),
  device_info jsonb not null default '{}'::jsonb
);

create table public.wms_cycle_count_sessions (
  id uuid primary key default gen_random_uuid(),
  scope_location_id uuid references public.wms_locations(id),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'counted', 'adjusted', 'closed', 'cancelled')),
  opened_by uuid references public.wms_profiles(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.wms_cycle_count_lines (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.wms_cycle_count_sessions(id) on delete cascade,
  location_id uuid references public.wms_locations(id),
  lpn_id uuid references public.wms_lpns(id),
  expected_qty_kg numeric(18, 3) not null default 0,
  actual_qty_kg numeric(18, 3) not null default 0,
  variance_qty_kg numeric(18, 3) generated always as (actual_qty_kg - expected_qty_kg) stored,
  status text not null default 'counted'
    check (status in ('counted', 'approved', 'rejected')),
  counted_by uuid references public.wms_profiles(id),
  counted_at timestamptz not null default now()
);

create table public.wms_sync_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.wms_profiles(id),
  device_id text not null,
  payload jsonb not null,
  status text not null default 'queued'
    check (status in ('queued', 'synced', 'failed', 'conflict')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  synced_at timestamptz
);

create index wms_idx_lpns_status on public.wms_lpns(status);
create index wms_idx_lpns_material on public.wms_lpns(material_id);
create index wms_idx_stock_movements_lpn on public.wms_stock_movements(lpn_id, movement_date desc);
create index wms_idx_scan_events_token on public.wms_scan_events(token, scanned_at desc);
create index wms_idx_scan_links_token on public.wms_scan_links(token);

create or replace view public.wms_current_stock_view as
select
  l.lpn_code,
  m.material_code,
  m.long_description as material_description,
  l.lot_number,
  loc.location_code as current_location,
  l.stock_type,
  coalesce(sum(sm.movement_qty_kg), l.qty_current_kg) as qty_current_kg,
  l.status,
  max(sm.movement_date) as last_update
from public.wms_lpns l
join public.wms_materials m on m.id = l.material_id
left join public.wms_locations loc on loc.id = l.current_location_id
left join public.wms_stock_movements sm on sm.lpn_id = l.id
group by
  l.id,
  l.lpn_code,
  m.material_code,
  m.long_description,
  l.lot_number,
  loc.location_code,
  l.stock_type,
  l.qty_current_kg,
  l.status;

create or replace function public.wms_has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.wms_user_roles ur
    join public.wms_roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = role_name
  );
$$;

create or replace function public.wms_extract_scan_token(raw_value text)
returns text
language sql
immutable
as $$
  select upper(nullif(regexp_replace(trim(raw_value), '^.*/', ''), ''));
$$;

create or replace function public.wms_prevent_stock_movement_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'wms_stock_movements is append-only; create a correcting movement instead';
end;
$$;

create trigger wms_stock_movements_append_only
before update or delete on public.wms_stock_movements
for each row execute function public.wms_prevent_stock_movement_mutation();

create or replace function public.wms_resolve_scan_token(
  raw_value text,
  workflow text,
  device_info jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := public.wms_extract_scan_token(raw_value);
  v_link public.wms_scan_links%rowtype;
  v_payload jsonb := '{}'::jsonb;
begin
  select *
  into v_link
  from public.wms_scan_links
  where token = v_token
    and is_active = true;

  if not found then
    insert into public.wms_scan_events (raw_value, token, workflow, action, result, message, user_id, device_info)
    values (raw_value, v_token, workflow, 'resolve', 'failed', 'Token not found or inactive', auth.uid(), device_info);

    return jsonb_build_object(
      'result', 'failed',
      'message', 'Token not found or inactive',
      'token', v_token
    );
  end if;

  if v_link.entity_type = 'lpn' then
    select jsonb_build_object(
      'lpn_code', l.lpn_code,
      'material_code', m.material_code,
      'description', m.long_description,
      'lot_number', l.lot_number,
      'qty_current_kg', l.qty_current_kg,
      'stock_type', l.stock_type,
      'status', l.status,
      'location_code', loc.location_code
    )
    into v_payload
    from public.wms_lpns l
    join public.wms_materials m on m.id = l.material_id
    left join public.wms_locations loc on loc.id = l.current_location_id
    where l.id = v_link.entity_id;
  elsif v_link.entity_type = 'location' then
    select jsonb_build_object(
      'location_code', location_code,
      'site', site,
      'warehouse', warehouse,
      'location_type', location_type,
      'is_active', is_active
    )
    into v_payload
    from public.wms_locations
    where id = v_link.entity_id;
  else
    v_payload := jsonb_build_object('entity_id', v_link.entity_id);
  end if;

  insert into public.wms_scan_events (
    raw_value,
    token,
    entity_type,
    entity_id,
    workflow,
    action,
    result,
    message,
    user_id,
    device_info
  )
  values (
    raw_value,
    v_token,
    v_link.entity_type,
    v_link.entity_id,
    workflow,
    'resolve',
    'success',
    'Token resolved',
    auth.uid(),
    device_info
  );

  return jsonb_build_object(
    'result', 'success',
    'token', v_token,
    'entity_type', v_link.entity_type,
    'entity_id', v_link.entity_id,
    'display_payload', coalesce(v_payload, '{}'::jsonb)
  );
end;
$$;

create or replace function public.wms_putaway_lpn(
  lpn_token text,
  location_token text,
  idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing uuid;
  v_lpn public.wms_lpns%rowtype;
  v_location public.wms_locations%rowtype;
  v_movement_id uuid;
begin
  select id into v_existing
  from public.wms_stock_movements
  where wms_stock_movements.idempotency_key = wms_putaway_lpn.idempotency_key;

  if v_existing is not null then
    return v_existing;
  end if;

  select l.*
  into v_lpn
  from public.wms_lpns l
  join public.wms_scan_links sl on sl.entity_id = l.id and sl.entity_type = 'lpn'
  where sl.token = public.wms_extract_scan_token(lpn_token)
    and sl.is_active = true
  for update;

  if not found then
    raise exception 'LPN token not found or inactive';
  end if;

  if v_lpn.status not in ('received', 'label_printed') then
    raise exception 'LPN status % cannot be putaway', v_lpn.status;
  end if;

  select loc.*
  into v_location
  from public.wms_locations loc
  left join public.wms_scan_links sl on sl.entity_id = loc.id and sl.entity_type = 'location'
  where (sl.token = public.wms_extract_scan_token(location_token) or loc.location_code = public.wms_extract_scan_token(location_token))
    and loc.is_active = true
  limit 1;

  if not found then
    raise exception 'Location token not found or inactive';
  end if;

  insert into public.wms_stock_movements (
    transaction_type,
    material_id,
    lpn_id,
    qty_kg,
    movement_qty_kg,
    from_location_id,
    to_location_id,
    reference_type,
    idempotency_key,
    created_by
  )
  values (
    'Putaway',
    v_lpn.material_id,
    v_lpn.id,
    v_lpn.qty_current_kg,
    0,
    v_lpn.current_location_id,
    v_location.id,
    'putaway',
    idempotency_key,
    auth.uid()
  )
  returning id into v_movement_id;

  update public.wms_lpns
  set current_location_id = v_location.id,
      status = 'available'
  where id = v_lpn.id;

  return v_movement_id;
end;
$$;

create or replace function public.wms_attach_lpn_label(lpn_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lpn_id uuid;
begin
  select l.id
  into v_lpn_id
  from public.wms_lpns l
  join public.wms_scan_links sl on sl.entity_id = l.id and sl.entity_type = 'lpn'
  where sl.token = public.wms_extract_scan_token(lpn_token)
    and sl.is_active = true
  for update;

  if not found then
    raise exception 'LPN token not found';
  end if;

  update public.wms_lpns
  set status = 'received'
  where id = v_lpn_id
    and status in ('draft', 'label_printed');

  insert into public.wms_scan_events (raw_value, token, entity_type, entity_id, workflow, action, result, message, user_id)
  values (lpn_token, public.wms_extract_scan_token(lpn_token), 'lpn', v_lpn_id, 'receiving', 'attach_label', 'success', 'Label attached', auth.uid());

  return v_lpn_id;
end;
$$;

alter table public.wms_roles enable row level security;
alter table public.wms_profiles enable row level security;
alter table public.wms_user_roles enable row level security;
alter table public.wms_warehouses enable row level security;
alter table public.wms_locations enable row level security;
alter table public.wms_materials enable row level security;
alter table public.wms_lots enable row level security;
alter table public.wms_inbound_documents enable row level security;
alter table public.wms_inbound_items enable row level security;
alter table public.wms_lpns enable row level security;
alter table public.wms_scan_links enable row level security;
alter table public.wms_outbound_documents enable row level security;
alter table public.wms_outbound_items enable row level security;
alter table public.wms_picking_tasks enable row level security;
alter table public.wms_delivery_notes enable row level security;
alter table public.wms_stock_movements enable row level security;
alter table public.wms_scan_events enable row level security;
alter table public.wms_cycle_count_sessions enable row level security;
alter table public.wms_cycle_count_lines enable row level security;
alter table public.wms_sync_queue enable row level security;

create policy wms_roles_read on public.wms_roles for select to authenticated using (true);
create policy wms_profiles_own_read on public.wms_profiles for select to authenticated using (id = auth.uid() or public.wms_has_role('Admin') or public.wms_has_role('Supervisor'));
create policy wms_profiles_own_update on public.wms_profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy wms_materials_read on public.wms_materials for select to authenticated using (is_active or public.wms_has_role('Admin'));
create policy wms_materials_admin_write on public.wms_materials for all to authenticated using (public.wms_has_role('Admin')) with check (public.wms_has_role('Admin'));

create policy wms_locations_read on public.wms_locations for select to authenticated using (is_active or public.wms_has_role('Admin'));
create policy wms_locations_admin_write on public.wms_locations for all to authenticated using (public.wms_has_role('Admin')) with check (public.wms_has_role('Admin'));

create policy wms_lots_read on public.wms_lots for select to authenticated using (true);
create policy wms_docs_admin_checker_read on public.wms_inbound_documents for select to authenticated using (public.wms_has_role('Admin') or public.wms_has_role('Checker') or public.wms_has_role('Supervisor'));
create policy wms_docs_admin_write on public.wms_inbound_documents for all to authenticated using (public.wms_has_role('Admin')) with check (public.wms_has_role('Admin'));
create policy wms_inbound_items_read on public.wms_inbound_items for select to authenticated using (public.wms_has_role('Admin') or public.wms_has_role('Checker') or public.wms_has_role('Supervisor'));
create policy wms_inbound_items_admin_write on public.wms_inbound_items for all to authenticated using (public.wms_has_role('Admin')) with check (public.wms_has_role('Admin'));

create policy wms_lpns_read on public.wms_lpns for select to authenticated using (true);
create policy wms_scan_links_read on public.wms_scan_links for select to authenticated using (true);

create policy wms_outbound_read on public.wms_outbound_documents for select to authenticated using (true);
create policy wms_outbound_admin_write on public.wms_outbound_documents for all to authenticated using (public.wms_has_role('Admin') or public.wms_has_role('Supervisor')) with check (public.wms_has_role('Admin') or public.wms_has_role('Supervisor'));
create policy wms_outbound_items_read on public.wms_outbound_items for select to authenticated using (true);
create policy wms_picking_tasks_read on public.wms_picking_tasks for select to authenticated using (true);
create policy wms_delivery_notes_read on public.wms_delivery_notes for select to authenticated using (true);

create policy wms_stock_movements_read on public.wms_stock_movements for select to authenticated using (true);

create policy wms_scan_events_insert_own on public.wms_scan_events for insert to authenticated with check (user_id = auth.uid() or user_id is null);
create policy wms_scan_events_read_admin on public.wms_scan_events for select to authenticated using (public.wms_has_role('Admin') or public.wms_has_role('Supervisor'));

create policy wms_cycle_count_read on public.wms_cycle_count_sessions for select to authenticated using (public.wms_has_role('Supervisor') or public.wms_has_role('Operator Forklift'));
create policy wms_cycle_count_supervisor_write on public.wms_cycle_count_sessions for all to authenticated using (public.wms_has_role('Supervisor')) with check (public.wms_has_role('Supervisor'));
create policy wms_cycle_count_lines_read on public.wms_cycle_count_lines for select to authenticated using (public.wms_has_role('Supervisor') or public.wms_has_role('Operator Forklift'));
create policy wms_cycle_count_lines_operator_insert on public.wms_cycle_count_lines for insert to authenticated with check (public.wms_has_role('Supervisor') or public.wms_has_role('Operator Forklift'));

create policy wms_sync_queue_own on public.wms_sync_queue for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into public.wms_roles (name, description) values
  ('Admin', 'Master data, inbound, labels, allocation, audit'),
  ('Checker', 'Receiving, verification, delivery note, shipping'),
  ('Operator Forklift', 'Putaway, picking, staging, transfer, cycle count scan'),
  ('Supervisor', 'Approval, adjustment, cycle count, audit'),
  ('WH Advanta Viewer', 'Dashboard and readonly stock visibility')
on conflict (name) do nothing;

-- Operational warehouses, materials, locations, LPNs, and stock balances are intentionally
-- not seeded. They must come from the reviewed historical workbook import or live WMS activity.

commit;
