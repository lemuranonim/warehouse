create extension if not exists pgcrypto;

create table public.roles (
  id bigserial primary key,
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  default_warehouse text,
  warehouse_scope text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id bigint not null references public.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  warehouse_code text not null unique,
  name text not null,
  site text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid references public.warehouses(id),
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

create table public.materials (
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

create table public.lots (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.materials(id),
  lot_number text not null,
  stock_type text not null default 'Fresh Seed',
  exp_date date,
  created_at timestamptz not null default now(),
  unique (material_id, lot_number, stock_type)
);

create table public.inbound_documents (
  id uuid primary key default gen_random_uuid(),
  doc_no text not null unique,
  sender text,
  status text not null default 'planned'
    check (status in ('planned', 'received_verified', 'label_printed', 'closed', 'cancelled')),
  received_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.inbound_items (
  id uuid primary key default gen_random_uuid(),
  inbound_doc_id uuid not null references public.inbound_documents(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  lot_id uuid references public.lots(id),
  lot_number text not null,
  planned_qty_kg numeric(18, 3) not null,
  received_qty_kg numeric(18, 3),
  status text not null default 'planned',
  created_at timestamptz not null default now()
);

create table public.lpns (
  id uuid primary key default gen_random_uuid(),
  lpn_code text not null unique,
  material_id uuid not null references public.materials(id),
  lot_id uuid references public.lots(id),
  lot_number text not null,
  batch_rename text,
  exp_date date,
  qty_initial_kg numeric(18, 3) not null default 0,
  qty_current_kg numeric(18, 3) not null default 0,
  current_location_id uuid references public.locations(id),
  stock_type text not null default 'Fresh Seed',
  status text not null default 'draft'
    check (status in ('draft', 'label_printed', 'received', 'available', 'reserved', 'picked', 'staged', 'staged_verified', 'dn_created', 'shipped', 'closed', 'quarantine', 'damaged', 'void')),
  inbound_doc_id uuid references public.inbound_documents(id),
  is_void boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.scan_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  entity_type text not null check (entity_type in ('lpn', 'location', 'material', 'outbound', 'delivery_note')),
  entity_id uuid not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.outbound_documents (
  id uuid primary key default gen_random_uuid(),
  doc_no text not null unique,
  destination text,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'reserved', 'picking', 'staged', 'staged_verified', 'dn_created', 'shipped', 'closed', 'cancelled')),
  requested_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.outbound_items (
  id uuid primary key default gen_random_uuid(),
  outbound_doc_id uuid not null references public.outbound_documents(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  lot_id uuid references public.lots(id),
  lot_number text,
  requested_qty_kg numeric(18, 3) not null,
  allocated_qty_kg numeric(18, 3) not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table public.picking_tasks (
  id uuid primary key default gen_random_uuid(),
  outbound_item_id uuid not null references public.outbound_items(id) on delete cascade,
  lpn_id uuid not null references public.lpns(id),
  from_location_id uuid references public.locations(id),
  qty_kg numeric(18, 3) not null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'picked', 'staged', 'cancelled')),
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.delivery_notes (
  id uuid primary key default gen_random_uuid(),
  outbound_doc_id uuid not null references public.outbound_documents(id),
  dn_no text not null unique,
  status text not null default 'created'
    check (status in ('created', 'loaded', 'shipped', 'void')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  movement_date timestamptz not null default now(),
  transaction_type text not null
    check (transaction_type in ('Inbound', 'Putaway', 'Transfer', 'Reserve', 'Pick', 'Stage', 'Outbound', 'Adjustment', 'Cycle Count')),
  material_id uuid not null references public.materials(id),
  lpn_id uuid references public.lpns(id),
  qty_kg numeric(18, 3) not null default 0,
  movement_qty_kg numeric(18, 3) not null default 0,
  from_location_id uuid references public.locations(id),
  to_location_id uuid references public.locations(id),
  reference_type text,
  reference_id uuid,
  idempotency_key text not null unique,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.scan_events (
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
  user_id uuid references public.profiles(id),
  device_info jsonb not null default '{}'::jsonb
);

create table public.cycle_count_sessions (
  id uuid primary key default gen_random_uuid(),
  scope_location_id uuid references public.locations(id),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'counted', 'adjusted', 'closed', 'cancelled')),
  opened_by uuid references public.profiles(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.cycle_count_lines (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cycle_count_sessions(id) on delete cascade,
  location_id uuid references public.locations(id),
  lpn_id uuid references public.lpns(id),
  expected_qty_kg numeric(18, 3) not null default 0,
  actual_qty_kg numeric(18, 3) not null default 0,
  variance_qty_kg numeric(18, 3) generated always as (actual_qty_kg - expected_qty_kg) stored,
  status text not null default 'counted'
    check (status in ('counted', 'approved', 'rejected')),
  counted_by uuid references public.profiles(id),
  counted_at timestamptz not null default now()
);

create table public.sync_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  device_id text not null,
  payload jsonb not null,
  status text not null default 'queued'
    check (status in ('queued', 'synced', 'failed', 'conflict')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  synced_at timestamptz
);

create index idx_lpns_status on public.lpns(status);
create index idx_lpns_material on public.lpns(material_id);
create index idx_stock_movements_lpn on public.stock_movements(lpn_id, movement_date desc);
create index idx_scan_events_token on public.scan_events(token, scanned_at desc);
create index idx_scan_links_token on public.scan_links(token);

create or replace view public.current_stock_view as
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
from public.lpns l
join public.materials m on m.id = l.material_id
left join public.locations loc on loc.id = l.current_location_id
left join public.stock_movements sm on sm.lpn_id = l.id
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

create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = role_name
  );
$$;

create or replace function public.extract_scan_token(raw_value text)
returns text
language sql
immutable
as $$
  select upper(nullif(regexp_replace(trim(raw_value), '^.*/', ''), ''));
$$;

create or replace function public.prevent_stock_movement_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'stock_movements is append-only; create a correcting movement instead';
end;
$$;

create trigger stock_movements_append_only
before update or delete on public.stock_movements
for each row execute function public.prevent_stock_movement_mutation();

create or replace function public.resolve_scan_token(
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
  v_token text := public.extract_scan_token(raw_value);
  v_link public.scan_links%rowtype;
  v_payload jsonb := '{}'::jsonb;
begin
  select *
  into v_link
  from public.scan_links
  where token = v_token
    and is_active = true;

  if not found then
    insert into public.scan_events (raw_value, token, workflow, action, result, message, user_id, device_info)
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
    from public.lpns l
    join public.materials m on m.id = l.material_id
    left join public.locations loc on loc.id = l.current_location_id
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
    from public.locations
    where id = v_link.entity_id;
  else
    v_payload := jsonb_build_object('entity_id', v_link.entity_id);
  end if;

  insert into public.scan_events (
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

create or replace function public.putaway_lpn(
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
  v_lpn public.lpns%rowtype;
  v_location public.locations%rowtype;
  v_movement_id uuid;
begin
  select id into v_existing
  from public.stock_movements
  where stock_movements.idempotency_key = putaway_lpn.idempotency_key;

  if v_existing is not null then
    return v_existing;
  end if;

  select l.*
  into v_lpn
  from public.lpns l
  join public.scan_links sl on sl.entity_id = l.id and sl.entity_type = 'lpn'
  where sl.token = public.extract_scan_token(lpn_token)
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
  from public.locations loc
  left join public.scan_links sl on sl.entity_id = loc.id and sl.entity_type = 'location'
  where (sl.token = public.extract_scan_token(location_token) or loc.location_code = public.extract_scan_token(location_token))
    and loc.is_active = true
  limit 1;

  if not found then
    raise exception 'Location token not found or inactive';
  end if;

  insert into public.stock_movements (
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

  update public.lpns
  set current_location_id = v_location.id,
      status = 'available'
  where id = v_lpn.id;

  return v_movement_id;
end;
$$;

create or replace function public.attach_lpn_label(lpn_token text)
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
  from public.lpns l
  join public.scan_links sl on sl.entity_id = l.id and sl.entity_type = 'lpn'
  where sl.token = public.extract_scan_token(lpn_token)
    and sl.is_active = true
  for update;

  if not found then
    raise exception 'LPN token not found';
  end if;

  update public.lpns
  set status = 'received'
  where id = v_lpn_id
    and status in ('draft', 'label_printed');

  insert into public.scan_events (raw_value, token, entity_type, entity_id, workflow, action, result, message, user_id)
  values (lpn_token, public.extract_scan_token(lpn_token), 'lpn', v_lpn_id, 'receiving', 'attach_label', 'success', 'Label attached', auth.uid());

  return v_lpn_id;
end;
$$;

alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.warehouses enable row level security;
alter table public.locations enable row level security;
alter table public.materials enable row level security;
alter table public.lots enable row level security;
alter table public.inbound_documents enable row level security;
alter table public.inbound_items enable row level security;
alter table public.lpns enable row level security;
alter table public.scan_links enable row level security;
alter table public.outbound_documents enable row level security;
alter table public.outbound_items enable row level security;
alter table public.picking_tasks enable row level security;
alter table public.delivery_notes enable row level security;
alter table public.stock_movements enable row level security;
alter table public.scan_events enable row level security;
alter table public.cycle_count_sessions enable row level security;
alter table public.cycle_count_lines enable row level security;
alter table public.sync_queue enable row level security;

create policy roles_read on public.roles for select to authenticated using (true);
create policy profiles_own_read on public.profiles for select to authenticated using (id = auth.uid() or public.has_role('Admin') or public.has_role('Supervisor'));
create policy profiles_own_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy materials_read on public.materials for select to authenticated using (is_active or public.has_role('Admin'));
create policy materials_admin_write on public.materials for all to authenticated using (public.has_role('Admin')) with check (public.has_role('Admin'));

create policy locations_read on public.locations for select to authenticated using (is_active or public.has_role('Admin'));
create policy locations_admin_write on public.locations for all to authenticated using (public.has_role('Admin')) with check (public.has_role('Admin'));

create policy lots_read on public.lots for select to authenticated using (true);
create policy docs_admin_checker_read on public.inbound_documents for select to authenticated using (public.has_role('Admin') or public.has_role('Checker') or public.has_role('Supervisor'));
create policy docs_admin_write on public.inbound_documents for all to authenticated using (public.has_role('Admin')) with check (public.has_role('Admin'));
create policy inbound_items_read on public.inbound_items for select to authenticated using (public.has_role('Admin') or public.has_role('Checker') or public.has_role('Supervisor'));
create policy inbound_items_admin_write on public.inbound_items for all to authenticated using (public.has_role('Admin')) with check (public.has_role('Admin'));

create policy lpns_read on public.lpns for select to authenticated using (true);
create policy scan_links_read on public.scan_links for select to authenticated using (true);

create policy outbound_read on public.outbound_documents for select to authenticated using (true);
create policy outbound_admin_write on public.outbound_documents for all to authenticated using (public.has_role('Admin') or public.has_role('Supervisor')) with check (public.has_role('Admin') or public.has_role('Supervisor'));
create policy outbound_items_read on public.outbound_items for select to authenticated using (true);
create policy picking_tasks_read on public.picking_tasks for select to authenticated using (true);
create policy delivery_notes_read on public.delivery_notes for select to authenticated using (true);

create policy stock_movements_read on public.stock_movements for select to authenticated using (true);

create policy scan_events_insert_own on public.scan_events for insert to authenticated with check (user_id = auth.uid() or user_id is null);
create policy scan_events_read_admin on public.scan_events for select to authenticated using (public.has_role('Admin') or public.has_role('Supervisor'));

create policy cycle_count_read on public.cycle_count_sessions for select to authenticated using (public.has_role('Supervisor') or public.has_role('Operator Forklift'));
create policy cycle_count_supervisor_write on public.cycle_count_sessions for all to authenticated using (public.has_role('Supervisor')) with check (public.has_role('Supervisor'));
create policy cycle_count_lines_read on public.cycle_count_lines for select to authenticated using (public.has_role('Supervisor') or public.has_role('Operator Forklift'));
create policy cycle_count_lines_operator_insert on public.cycle_count_lines for insert to authenticated with check (public.has_role('Supervisor') or public.has_role('Operator Forklift'));

create policy sync_queue_own on public.sync_queue for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into public.roles (name, description) values
  ('Admin', 'Master data, inbound, labels, allocation, audit'),
  ('Checker', 'Receiving, verification, delivery note, shipping'),
  ('Operator Forklift', 'Putaway, picking, staging, transfer, cycle count scan'),
  ('Supervisor', 'Approval, adjustment, cycle count, audit'),
  ('WH Advanta Viewer', 'Dashboard and readonly stock visibility')
on conflict (name) do nothing;

insert into public.warehouses (id, warehouse_code, name, site) values
  ('10000000-0000-0000-0000-000000000001', 'PRASAD-01', 'Prasad 01', 'Prasad 01'),
  ('10000000-0000-0000-0000-000000000002', 'PRASAD-CS', 'Prasad Cold Storage', 'Prasad CS')
on conflict (warehouse_code) do nothing;

insert into public.materials (
  id, material_code, long_description, hybrid, stage, flagging, type, product, crop, status, order_unit, standard_package_kg, is_active
) values
  ('20000000-0000-0000-0000-000000000001', '152000198', 'Hybrid AV4 Clean Seed KG', 'PX03', 'DCS', 'YF', 'Commercial', 'ADV JAGO', 'Field Corn', 'WIP', 'Jumbo Bag 1 MT', 1000, true),
  ('20000000-0000-0000-0000-000000000002', '160511345', 'Hybrid B. CCMBR LAVANTA F1 20gr', 'CRPT133/RJHL1024', 'FG-Packed', 'RF', 'Commercial', 'LAVANTA', 'Vegetable', 'FG', 'Carton Box 2 KG', 2, true),
  ('20000000-0000-0000-0000-000000000003', '141000223', 'Hybrid AV9 Raw Seed KG', 'PX02', 'DSS', 'RF', 'Commercial', 'ADV JAGO', 'Field Corn', 'WIP', 'Jumbo Bag 1 MT', 1000, true),
  ('20000000-0000-0000-0000-000000000004', '160511350', 'OP Chilli SHIMA 10gr', 'CRPT133/RJHL1024', 'FG-Packed', 'RF', 'Commercial', 'SHIMA', 'Vegetable', 'FG', 'Carton Box 2 KG', 2, true),
  ('20000000-0000-0000-0000-000000000005', '151000155', 'PS M AV4 AV5 & AV7 Clean Seed KG', 'PX03-PX04-M', 'DCS', 'YF', 'Parent Seed', 'Non Commercial', 'Field Corn', 'WIP', 'Jumbo Bag 1 MT', 1000, true)
on conflict (material_code) do nothing;

insert into public.locations (
  id, warehouse_id, location_code, site, warehouse, room, aisle, rack, level, bin, location_type, capacity_kg, is_active
) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'WH1-A11.3', 'Prasad 01', 'Warehouse 1', 'Warehouse 1', 'A', '11', '3', null, 'storage', 50000, true),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'VEG-RACK-A1.1', 'Prasad 01', 'Vegetable Room', 'Vegetable Room', 'A', '1', '1', null, 'storage', 10000, true),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'STAGING-OUT-01', 'Prasad 01', 'Warehouse 1', 'Staging Area', null, null, null, '01', 'staging', 20000, true),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'LOADING-DOCK-01', 'Prasad 01', 'Warehouse 1', 'Loading Dock', null, null, null, '01', 'loading', 20000, true),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'RECEIVING-AREA', 'Prasad 01', 'Warehouse 1', 'Receiving', null, null, null, null, 'receiving', 30000, true),
  ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'CHAMBER-1', 'Prasad CS', 'Chamber 1', 'Chamber 1', null, null, null, null, 'storage', 10000, true),
  ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'CS02', 'Kiat Ananda CS02', 'Cold Storage', 'CS02', null, null, null, null, 'storage', 10000, true)
on conflict (location_code) do nothing;

insert into public.lpns (
  id, lpn_code, material_id, lot_number, qty_initial_kg, qty_current_kg, current_location_id, stock_type, status
) values
  ('40000000-0000-0000-0000-000000000001', 'LPN-20260501-000001', '20000000-0000-0000-0000-000000000003', 'NPRHD2003', 79, 79, '30000000-0000-0000-0000-000000000001', 'Fresh Seed', 'available'),
  ('40000000-0000-0000-0000-000000000002', 'LPN-20260512-000010', '20000000-0000-0000-0000-000000000004', '230711069', 26.75, 25.75, '30000000-0000-0000-0000-000000000002', 'Fresh Seed', 'available'),
  ('40000000-0000-0000-0000-000000000003', 'LPN-20260520-000020', '20000000-0000-0000-0000-000000000001', 'NPCCA0090', 1000, 1000, '30000000-0000-0000-0000-000000000001', 'Fresh Seed', 'available'),
  ('40000000-0000-0000-0000-000000000004', 'LPN-20260521-000030', '20000000-0000-0000-0000-000000000005', 'NPCYEB017A', 338, 0, '30000000-0000-0000-0000-000000000007', 'Fresh Seed', 'shipped')
on conflict (lpn_code) do nothing;

insert into public.scan_links (token, entity_type, entity_id) values
  ('A7K9Q2', 'lpn', '40000000-0000-0000-0000-000000000003'),
  ('LOC-A113', 'location', '30000000-0000-0000-0000-000000000001'),
  ('LOC-STG1', 'location', '30000000-0000-0000-0000-000000000003')
on conflict (token) do nothing;

insert into public.stock_movements (
  movement_date, transaction_type, material_id, lpn_id, qty_kg, movement_qty_kg, from_location_id, to_location_id, reference_type, idempotency_key
) values
  ('2026-05-01 08:00+07', 'Inbound', '20000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 79, 79, null, '30000000-0000-0000-0000-000000000005', 'inbound', 'seed-IN-04251101'),
  ('2026-05-01 10:00+07', 'Putaway', '20000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 79, 0, '30000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 'putaway', 'seed-PUT-04251101'),
  ('2026-05-12 08:00+07', 'Inbound', '20000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 26.75, 26.75, null, '30000000-0000-0000-0000-000000000005', 'inbound', 'seed-IN-04251109'),
  ('2026-05-12 10:00+07', 'Putaway', '20000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 26.75, 0, '30000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', 'putaway', 'seed-PUT-04251109'),
  ('2026-05-20 08:00+07', 'Inbound', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 1000, 1000, null, '30000000-0000-0000-0000-000000000005', 'inbound', 'seed-IN-04251112'),
  ('2026-05-20 10:00+07', 'Putaway', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000003', 1000, 0, '30000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', 'putaway', 'seed-PUT-04251112'),
  ('2026-05-18 08:00+07', 'Inbound', '20000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000004', 338, 338, null, '30000000-0000-0000-0000-000000000005', 'inbound', 'seed-IN-04251108'),
  ('2026-05-23 09:00+07', 'Outbound', '20000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000004', 338, -338, '30000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000007', 'delivery_note', 'seed-DN-04251109'),
  ('2026-05-24 09:00+07', 'Adjustment', '20000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 1, -1, '30000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'cycle_count', 'seed-ADJ-000001')
on conflict (idempotency_key) do nothing;
