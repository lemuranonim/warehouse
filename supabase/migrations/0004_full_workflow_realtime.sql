-- Complete transactional WMS workflow and realtime baseline.
-- Apply after 0001, 0002, and 0003.
begin;

create table if not exists public.wms_stock_types (
  code text primary key,
  label text not null unique,
  description text,
  color text not null default 'blue'
    check (color in ('green', 'blue', 'amber', 'red', 'violet', 'cyan', 'gray')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.wms_stock_types (code, label, description, color) values
  ('FS', 'Fresh Seed', 'Benih segar langsung dari produksi atau supplier', 'green'),
  ('RS', 'Return Seed', 'Benih retur dari distributor atau lapangan', 'amber'),
  ('DS', 'Demo Seed', 'Benih untuk demonstrasi plot dan uji lapang', 'blue'),
  ('QS', 'Quarantine Seed', 'Benih dalam karantina menunggu hasil pemeriksaan', 'red'),
  ('PS', 'Parent Seed', 'Benih induk untuk produksi generasi berikutnya', 'violet')
on conflict (code) do update set
  label = excluded.label,
  description = excluded.description,
  color = excluded.color;

alter table public.wms_profiles
  add column if not exists email text;

alter table public.wms_inventory_import_batches
  add column if not exists content_hash text;

create unique index if not exists wms_inventory_import_batches_content_hash_uidx
  on public.wms_inventory_import_batches(content_hash)
  where content_hash is not null;

update public.wms_profiles p
set email = lower(u.email)
from auth.users u
where u.id = p.id
  and p.email is distinct from lower(u.email);

create unique index if not exists wms_profiles_email_uidx
  on public.wms_profiles (lower(email))
  where email is not null;

alter table public.wms_inbound_items
  add column if not exists exp_date date,
  add column if not exists stock_type text not null default 'Fresh Seed';

alter table public.wms_picking_tasks
  add column if not exists picked_lpn_id uuid references public.wms_lpns(id),
  add column if not exists picked_at timestamptz,
  add column if not exists staged_at timestamptz;

alter table public.wms_outbound_documents
  add column if not exists shipped_at timestamptz;

alter table public.wms_delivery_notes
  add column if not exists shipped_at timestamptz;

alter table public.wms_cycle_count_lines
  add column if not exists is_counted boolean not null default false,
  add column if not exists reviewed_by uuid references public.wms_profiles(id),
  add column if not exists reviewed_at timestamptz;

create table if not exists public.wms_adjustment_requests (
  id uuid primary key default gen_random_uuid(),
  lpn_id uuid not null references public.wms_lpns(id),
  qty_before_kg numeric(18,3) not null check (qty_before_kg >= 0),
  qty_after_kg numeric(18,3) not null check (qty_after_kg >= 0),
  reason_code text not null check (char_length(reason_code) between 2 and 50),
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  submitted_by uuid not null references public.wms_profiles(id),
  reviewed_by uuid references public.wms_profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists wms_adjustment_requests_status_idx
  on public.wms_adjustment_requests(status, created_at desc);

create table if not exists public.wms_audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  user_id uuid references public.wms_profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists wms_audit_log_entity_idx
  on public.wms_audit_log(entity_type, entity_id, occurred_at desc);
create index if not exists wms_audit_log_user_idx
  on public.wms_audit_log(user_id, occurred_at desc);

create table if not exists public.wms_operation_keys (
  idempotency_key text primary key,
  operation text not null,
  result_id uuid,
  user_id uuid references public.wms_profiles(id),
  created_at timestamptz not null default now(),
  constraint wms_operation_key_length_chk
    check (char_length(idempotency_key) between 8 and 200)
);

create table if not exists public.wms_action_rate_limits (
  user_id uuid not null references public.wms_profiles(id) on delete cascade,
  operation text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (user_id, operation, window_start)
);

create index if not exists wms_inbound_items_document_idx
  on public.wms_inbound_items(inbound_doc_id, status);
create index if not exists wms_outbound_items_document_idx
  on public.wms_outbound_items(outbound_doc_id, status);
create index if not exists wms_picking_tasks_document_idx
  on public.wms_picking_tasks(outbound_item_id, status);
create index if not exists wms_lpns_location_status_idx
  on public.wms_lpns(current_location_id, status)
  where not is_void;

create or replace function public.wms_check_rate_limit(
  operation_name text,
  max_requests integer default 120,
  window_seconds integer default 60
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_count integer;
begin
  if auth.uid() is null then raise exception using errcode='42501', message='WMS authentication required'; end if;
  if operation_name is null or char_length(operation_name) not between 2 and 80
    or max_requests not between 1 and 1000 or window_seconds not between 10 and 3600
  then raise exception using errcode='22023', message='Invalid rate limit configuration'; end if;
  v_window := to_timestamp(floor(extract(epoch from clock_timestamp()) / window_seconds) * window_seconds);
  insert into public.wms_action_rate_limits (user_id, operation, window_start, request_count)
  values (auth.uid(), operation_name, v_window, 1)
  on conflict (user_id, operation, window_start) do update
    set request_count = public.wms_action_rate_limits.request_count + 1
  returning request_count into v_count;
  if v_count > max_requests then
    raise exception using errcode='54000', message='Too many workflow requests; wait for the next rate-limit window';
  end if;
  delete from public.wms_action_rate_limits where window_start < now() - interval '2 days';
end;
$$;

create or replace function public.wms_require_any_role(allowed_roles text[])
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.wms_is_member() then
    raise exception using errcode = '42501', message = 'WMS authentication required';
  end if;
  if not exists (
    select 1
    from public.wms_user_roles ur
    join public.wms_roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.name = any(allowed_roles)
  ) then
    raise exception using errcode = '42501', message = 'WMS role is not authorized for this operation';
  end if;
  perform public.wms_check_rate_limit('workflow_mutation', 120, 60);
end;
$$;

create or replace function public.wms_record_audit(
  action_name text,
  entity_name text,
  entity_uuid uuid,
  before_payload jsonb default null,
  after_payload jsonb default null,
  request_key text default null,
  extra_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.wms_audit_log (
    user_id, action, entity_type, entity_id, before_data, after_data, request_id, metadata
  ) values (
    auth.uid(), left(action_name, 100), left(entity_name, 100), entity_uuid,
    before_payload, after_payload, left(request_key, 200), coalesce(extra_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function public.wms_upsert_warehouse(
  warehouse_code text,
  warehouse_name text,
  site_name text default null,
  active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.wms_require_any_role(array['Admin']);
  if warehouse_code is null or warehouse_code !~ '^[A-Za-z0-9][A-Za-z0-9 ._/-]{0,49}$' then
    raise exception using errcode = '22023', message = 'Invalid warehouse code';
  end if;
  if warehouse_name is null or char_length(trim(warehouse_name)) not between 2 and 120 then
    raise exception using errcode = '22023', message = 'Invalid warehouse name';
  end if;

  insert into public.wms_warehouses (warehouse_code, name, site, is_active)
  values (trim(warehouse_code), trim(warehouse_name), nullif(trim(site_name), ''), active)
  on conflict (warehouse_code) do update set
    name = excluded.name,
    site = excluded.site,
    is_active = excluded.is_active
  returning id into v_id;

  perform public.wms_record_audit('upsert', 'warehouse', v_id, null,
    jsonb_build_object('warehouse_code', trim(warehouse_code), 'name', trim(warehouse_name), 'active', active));
  return v_id;
end;
$$;

create or replace function public.wms_upsert_location(
  location_code text,
  warehouse_code text,
  location_type text,
  capacity_kg numeric default null,
  site_name text default null,
  room_name text default null,
  aisle_name text default null,
  rack_name text default null,
  level_name text default null,
  bin_name text default null,
  active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_warehouse public.wms_warehouses%rowtype;
  v_token text;
begin
  perform public.wms_require_any_role(array['Admin']);
  if location_code is null or location_code !~ '^[A-Za-z0-9][A-Za-z0-9 ._/-]{0,79}$' then
    raise exception using errcode = '22023', message = 'Invalid location code';
  end if;
  if location_type not in ('storage', 'staging', 'loading', 'receiving', 'quarantine') then
    raise exception using errcode = '22023', message = 'Invalid location type';
  end if;
  if capacity_kg is not null and capacity_kg <= 0 then
    raise exception using errcode = '22023', message = 'Location capacity must be positive';
  end if;

  select * into v_warehouse
  from public.wms_warehouses
  where wms_warehouses.warehouse_code = wms_upsert_location.warehouse_code
    and is_active = true;
  if not found then raise exception 'Active warehouse % not found', warehouse_code; end if;

  insert into public.wms_locations (
    warehouse_id, location_code, site, warehouse, room, aisle, rack, level, bin,
    location_type, capacity_kg, is_active
  ) values (
    v_warehouse.id, trim(location_code), coalesce(nullif(trim(site_name), ''), v_warehouse.site),
    v_warehouse.warehouse_code, nullif(trim(room_name), ''), nullif(trim(aisle_name), ''),
    nullif(trim(rack_name), ''), nullif(trim(level_name), ''), nullif(trim(bin_name), ''),
    location_type, capacity_kg, active
  )
  on conflict (location_code) do update set
    warehouse_id = excluded.warehouse_id,
    site = excluded.site,
    warehouse = excluded.warehouse,
    room = excluded.room,
    aisle = excluded.aisle,
    rack = excluded.rack,
    level = excluded.level,
    bin = excluded.bin,
    location_type = excluded.location_type,
    capacity_kg = excluded.capacity_kg,
    is_active = excluded.is_active
  returning id into v_id;

  v_token := 'LOC-' || upper(substr(replace(v_id::text, '-', ''), 1, 16));
  insert into public.wms_scan_links (token, entity_type, entity_id, is_active)
  values (v_token, 'location', v_id, active)
  on conflict (token) do update set is_active = excluded.is_active;

  perform public.wms_record_audit('upsert', 'location', v_id, null,
    jsonb_build_object('location_code', trim(location_code), 'warehouse', v_warehouse.warehouse_code,
      'location_type', location_type, 'capacity_kg', capacity_kg, 'active', active));
  return v_id;
end;
$$;

create or replace function public.wms_upsert_material(
  material_code text,
  material_description text,
  hybrid_name text default null,
  stage_name text default null,
  flagging_name text default null,
  material_type text default null,
  product_name text default null,
  crop_name text default null,
  material_status text default 'active',
  order_unit_name text default 'KG',
  package_kg numeric default 0,
  active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform public.wms_require_any_role(array['Admin']);
  if material_code is null or material_code !~ '^[A-Za-z0-9][A-Za-z0-9._/-]{0,49}$' then
    raise exception using errcode = '22023', message = 'Invalid material code';
  end if;
  if material_description is null or char_length(trim(material_description)) not between 2 and 240 then
    raise exception using errcode = '22023', message = 'Invalid material description';
  end if;
  if package_kg < 0 then raise exception using errcode = '22023', message = 'Package size cannot be negative'; end if;

  insert into public.wms_materials (
    material_code, long_description, hybrid, stage, flagging, type, product, crop,
    status, order_unit, standard_package_kg, is_active
  ) values (
    trim(material_code), trim(material_description), nullif(trim(hybrid_name), ''),
    nullif(trim(stage_name), ''), nullif(trim(flagging_name), ''), nullif(trim(material_type), ''),
    nullif(trim(product_name), ''), nullif(trim(crop_name), ''), trim(material_status),
    coalesce(nullif(trim(order_unit_name), ''), 'KG'), package_kg, active
  )
  on conflict (material_code) do update set
    long_description = excluded.long_description,
    hybrid = excluded.hybrid,
    stage = excluded.stage,
    flagging = excluded.flagging,
    type = excluded.type,
    product = excluded.product,
    crop = excluded.crop,
    status = excluded.status,
    order_unit = excluded.order_unit,
    standard_package_kg = excluded.standard_package_kg,
    is_active = excluded.is_active
  returning id into v_id;

  perform public.wms_record_audit('upsert', 'material', v_id, null,
    jsonb_build_object('material_code', trim(material_code), 'description', trim(material_description), 'active', active));
  return v_id;
end;
$$;

create or replace function public.wms_upsert_stock_type(
  stock_code text,
  stock_label text,
  stock_description text default null,
  stock_color text default 'blue',
  active boolean default true
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.wms_require_any_role(array['Admin']);
  if stock_code is null or stock_code !~ '^[A-Z0-9]{2,10}$' then
    raise exception using errcode = '22023', message = 'Invalid stock type code';
  end if;
  if stock_label is null or char_length(trim(stock_label)) not between 2 and 80 then
    raise exception using errcode = '22023', message = 'Invalid stock type label';
  end if;
  if stock_color not in ('green', 'blue', 'amber', 'red', 'violet', 'cyan', 'gray') then
    raise exception using errcode = '22023', message = 'Invalid stock type color';
  end if;
  insert into public.wms_stock_types (code, label, description, color, is_active)
  values (stock_code, trim(stock_label), nullif(trim(stock_description), ''), stock_color, active)
  on conflict (code) do update set
    label = excluded.label,
    description = excluded.description,
    color = excluded.color,
    is_active = excluded.is_active;
  return stock_code;
end;
$$;

create or replace function public.wms_set_profile_access(
  user_email text,
  profile_name text,
  role_name text,
  default_warehouse_code text default null,
  warehouse_codes text[] default '{}',
  active boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_role_id bigint;
begin
  perform public.wms_require_any_role(array['Admin']);
  select id into v_user_id from auth.users where lower(email) = lower(trim(user_email));
  if not found then raise exception 'Supabase Auth user not found'; end if;
  select id into v_role_id from public.wms_roles where name = role_name;
  if not found then raise exception 'WMS role not found'; end if;

  insert into public.wms_profiles (id, email, full_name, default_warehouse, warehouse_scope, is_active)
  values (
    v_user_id, lower(trim(user_email)), nullif(trim(profile_name), ''),
    nullif(trim(default_warehouse_code), ''), coalesce(warehouse_codes, '{}'), active
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    default_warehouse = excluded.default_warehouse,
    warehouse_scope = excluded.warehouse_scope,
    is_active = excluded.is_active;

  insert into public.wms_user_roles (user_id, role_id)
  values (v_user_id, v_role_id)
  on conflict (user_id, role_id) do nothing;

  perform public.wms_record_audit('grant_role', 'profile', v_user_id, null,
    jsonb_build_object('email', lower(trim(user_email)), 'role', role_name,
      'default_warehouse', default_warehouse_code, 'warehouse_scope', warehouse_codes, 'active', active));
  return v_user_id;
end;
$$;

create or replace function public.wms_create_inbound(
  doc_no text,
  sender_name text,
  document_date date,
  destination_name text,
  items jsonb,
  idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc_id uuid;
  v_item jsonb;
  v_material public.wms_materials%rowtype;
  v_qty numeric(18,3);
begin
  perform public.wms_require_any_role(array['Admin']);
  if idempotency_key is null or char_length(idempotency_key) not between 8 and 200 then
    raise exception using errcode = '22023', message = 'Invalid idempotency key';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(idempotency_key, 0));
  select result_id into v_doc_id from public.wms_operation_keys where wms_operation_keys.idempotency_key = wms_create_inbound.idempotency_key;
  if v_doc_id is not null then return v_doc_id; end if;
  if doc_no is null or char_length(trim(doc_no)) not between 3 and 80 then raise exception 'Invalid inbound document number'; end if;
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) not between 1 and 500 then
    raise exception 'Inbound must contain between 1 and 500 lines';
  end if;

  insert into public.wms_inbound_documents (
    doc_no, sender, status, created_by, document_date, destination, prepared_by_name
  ) values (
    trim(doc_no), nullif(trim(sender_name), ''), 'planned', auth.uid(), document_date,
    nullif(trim(destination_name), ''), (select full_name from public.wms_profiles where id = auth.uid())
  ) returning id into v_doc_id;

  for v_item in select value from jsonb_array_elements(items)
  loop
    select * into v_material
    from public.wms_materials
    where material_code = trim(v_item->>'material_code') and is_active = true;
    if not found then raise exception 'Active material % not found', v_item->>'material_code'; end if;
    if coalesce(char_length(trim(v_item->>'lot_number')), 0) not between 1 and 120 then
      raise exception 'Invalid lot number on inbound line';
    end if;
    if not exists (
      select 1 from public.wms_stock_types st
      where st.label = coalesce(nullif(trim(v_item->>'stock_type'), ''), 'Fresh Seed') and st.is_active
    ) then raise exception 'Active stock type % not found', v_item->>'stock_type'; end if;
    v_qty := (v_item->>'planned_qty_kg')::numeric;
    if v_qty <= 0 then raise exception 'Planned quantity must be positive'; end if;
    insert into public.wms_inbound_items (
      inbound_doc_id, material_id, lot_number, planned_qty_kg, received_qty_kg,
      status, line_no, source_description, uom, remark, exp_date, stock_type
    ) values (
      v_doc_id, v_material.id, trim(v_item->>'lot_number'), v_qty, 0, 'planned',
      coalesce((v_item->>'line_no')::integer,
        (select coalesce(max(line_no), 0) + 1 from public.wms_inbound_items where inbound_doc_id = v_doc_id)),
      v_material.long_description, coalesce(nullif(trim(v_item->>'uom'), ''), 'KG'),
      nullif(trim(v_item->>'remark'), ''), nullif(v_item->>'exp_date', '')::date,
      coalesce(nullif(trim(v_item->>'stock_type'), ''), 'Fresh Seed')
    );
  end loop;

  insert into public.wms_operation_keys (idempotency_key, operation, result_id, user_id)
  values (idempotency_key, 'create_inbound', v_doc_id, auth.uid());
  perform public.wms_record_audit('create', 'inbound_document', v_doc_id, null,
    jsonb_build_object('doc_no', trim(doc_no), 'line_count', jsonb_array_length(items)), idempotency_key);
  return v_doc_id;
end;
$$;

create or replace function public.wms_receive_inbound_item(
  inbound_item_id uuid,
  actual_qty_kg numeric,
  lpn_code text default null,
  idempotency_key text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing uuid;
  v_item public.wms_inbound_items%rowtype;
  v_lot_id uuid;
  v_lpn_id uuid := gen_random_uuid();
  v_lpn_code text;
  v_token text;
  v_received numeric(18,3);
begin
  perform public.wms_require_any_role(array['Admin', 'Checker']);
  if idempotency_key is null or char_length(idempotency_key) not between 8 and 200 then
    raise exception using errcode = '22023', message = 'Invalid idempotency key';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(idempotency_key, 0));
  select result_id into v_existing from public.wms_operation_keys where wms_operation_keys.idempotency_key = wms_receive_inbound_item.idempotency_key;
  if v_existing is not null then return v_existing; end if;
  if actual_qty_kg is null or actual_qty_kg <= 0 then raise exception 'Received quantity must be positive'; end if;

  select * into v_item from public.wms_inbound_items where id = inbound_item_id for update;
  if not found then raise exception 'Inbound line not found'; end if;
  v_received := coalesce(v_item.received_qty_kg, 0) + actual_qty_kg;
  if v_received > v_item.planned_qty_kg then raise exception 'Received quantity exceeds the planned quantity'; end if;

  insert into public.wms_lots (material_id, lot_number, stock_type, exp_date)
  values (v_item.material_id, v_item.lot_number, v_item.stock_type, v_item.exp_date)
  on conflict (material_id, lot_number, stock_type) do update set
    exp_date = coalesce(excluded.exp_date, public.wms_lots.exp_date)
  returning id into v_lot_id;

  v_lpn_code := coalesce(nullif(trim(lpn_code), ''),
    'LPN-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substr(replace(v_lpn_id::text, '-', ''), 1, 8)));
  insert into public.wms_lpns (
    id, lpn_code, material_id, lot_id, lot_number, exp_date, qty_initial_kg,
    qty_current_kg, stock_type, status, inbound_doc_id
  ) values (
    v_lpn_id, v_lpn_code, v_item.material_id, v_lot_id, v_item.lot_number, v_item.exp_date,
    actual_qty_kg, 0, v_item.stock_type, 'label_printed', v_item.inbound_doc_id
  );

  v_token := 'LPN-' || upper(substr(replace(v_lpn_id::text, '-', ''), 1, 16));
  insert into public.wms_scan_links (token, entity_type, entity_id)
  values (v_token, 'lpn', v_lpn_id);

  insert into public.wms_stock_movements (
    transaction_type, material_id, lpn_id, qty_kg, movement_qty_kg,
    reference_type, reference_id, idempotency_key, created_by
  ) values (
    'Inbound', v_item.material_id, v_lpn_id, actual_qty_kg, actual_qty_kg,
    'inbound_item', v_item.id, idempotency_key || ':movement', auth.uid()
  );

  update public.wms_inbound_items
  set received_qty_kg = v_received,
      status = case when v_received = planned_qty_kg then 'received' else 'partial' end,
      lot_id = v_lot_id
  where id = v_item.id;

  update public.wms_inbound_documents d
  set status = case when exists (
      select 1 from public.wms_inbound_items i
      where i.inbound_doc_id = d.id and coalesce(i.received_qty_kg, 0) < i.planned_qty_kg
    ) then 'planned' else 'received_verified' end,
      received_at = case when not exists (
        select 1 from public.wms_inbound_items i
        where i.inbound_doc_id = d.id and coalesce(i.received_qty_kg, 0) < i.planned_qty_kg
      ) then now() else d.received_at end
  where d.id = v_item.inbound_doc_id;

  insert into public.wms_operation_keys (idempotency_key, operation, result_id, user_id)
  values (idempotency_key, 'receive_inbound_item', v_lpn_id, auth.uid());
  perform public.wms_record_audit('receive', 'lpn', v_lpn_id, null,
    jsonb_build_object('lpn_code', v_lpn_code, 'qty_kg', actual_qty_kg, 'token', v_token), idempotency_key);
  return v_lpn_id;
end;
$$;

create or replace function public.wms_create_outbound(
  doc_no text,
  destination_name text,
  document_date date,
  origin_name text,
  items jsonb,
  idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc_id uuid;
  v_item jsonb;
  v_material public.wms_materials%rowtype;
  v_qty numeric(18,3);
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor']);
  if idempotency_key is null or char_length(idempotency_key) not between 8 and 200 then raise exception 'Invalid idempotency key'; end if;
  perform pg_advisory_xact_lock(hashtextextended(idempotency_key, 0));
  select result_id into v_doc_id from public.wms_operation_keys where wms_operation_keys.idempotency_key = wms_create_outbound.idempotency_key;
  if v_doc_id is not null then return v_doc_id; end if;
  if doc_no is null or char_length(trim(doc_no)) not between 3 and 80 then raise exception 'Invalid outbound document number'; end if;
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) not between 1 and 500 then raise exception 'Outbound must contain between 1 and 500 lines'; end if;

  insert into public.wms_outbound_documents (
    doc_no, destination, status, requested_by, document_date, origin, prepared_by_name
  ) values (
    trim(doc_no), nullif(trim(destination_name), ''), 'submitted', auth.uid(), document_date,
    nullif(trim(origin_name), ''), (select full_name from public.wms_profiles where id = auth.uid())
  ) returning id into v_doc_id;

  for v_item in select value from jsonb_array_elements(items)
  loop
    select * into v_material from public.wms_materials
    where material_code = trim(v_item->>'material_code') and is_active = true;
    if not found then raise exception 'Active material % not found', v_item->>'material_code'; end if;
    if char_length(coalesce(v_item->>'lot_number', '')) > 120 then raise exception 'Invalid lot number on outbound line'; end if;
    v_qty := (v_item->>'requested_qty_kg')::numeric;
    if v_qty <= 0 then raise exception 'Requested quantity must be positive'; end if;
    insert into public.wms_outbound_items (
      outbound_doc_id, material_id, lot_number, requested_qty_kg, line_no,
      source_description, uom, remark
    ) values (
      v_doc_id, v_material.id, nullif(trim(v_item->>'lot_number'), ''), v_qty,
      coalesce((v_item->>'line_no')::integer,
        (select coalesce(max(line_no), 0) + 1 from public.wms_outbound_items where outbound_doc_id = v_doc_id)),
      v_material.long_description, coalesce(nullif(trim(v_item->>'uom'), ''), 'KG'), nullif(trim(v_item->>'remark'), '')
    );
  end loop;

  insert into public.wms_operation_keys (idempotency_key, operation, result_id, user_id)
  values (idempotency_key, 'create_outbound', v_doc_id, auth.uid());
  perform public.wms_record_audit('create', 'outbound_document', v_doc_id, null,
    jsonb_build_object('doc_no', trim(doc_no), 'line_count', jsonb_array_length(items)), idempotency_key);
  return v_doc_id;
end;
$$;

create or replace function public.wms_allocate_outbound(
  outbound_document_id uuid,
  idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc public.wms_outbound_documents%rowtype;
  v_item public.wms_outbound_items%rowtype;
  v_lpn public.wms_lpns%rowtype;
  v_remaining numeric(18,3);
  v_allocate numeric(18,3);
  v_existing uuid;
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor']);
  if idempotency_key is null or char_length(idempotency_key) not between 8 and 200 then raise exception 'Invalid idempotency key'; end if;
  perform pg_advisory_xact_lock(hashtextextended(idempotency_key, 0));
  select result_id into v_existing from public.wms_operation_keys where wms_operation_keys.idempotency_key = wms_allocate_outbound.idempotency_key;
  if v_existing is not null then return v_existing; end if;
  select * into v_doc from public.wms_outbound_documents where id = outbound_document_id for update;
  if not found then raise exception 'Outbound document not found'; end if;
  if v_doc.status not in ('submitted', 'draft') then raise exception 'Outbound status % cannot be allocated', v_doc.status; end if;

  for v_item in select * from public.wms_outbound_items where outbound_doc_id = v_doc.id order by line_no, created_at for update
  loop
    v_remaining := v_item.requested_qty_kg;
    for v_lpn in
      select l.* from public.wms_lpns l
      left join public.wms_locations loc on loc.id = l.current_location_id
      where l.material_id = v_item.material_id
        and (v_item.lot_number is null or l.lot_number = v_item.lot_number)
        and l.status = 'available' and not l.is_void and l.qty_current_kg > 0
        and (loc.warehouse is null or public.wms_has_warehouse_access(loc.warehouse))
      order by l.exp_date asc nulls last, l.created_at asc
      for update of l skip locked
    loop
      exit when v_remaining <= 0;
      v_allocate := least(v_remaining, v_lpn.qty_current_kg);
      insert into public.wms_picking_tasks (
        outbound_item_id, lpn_id, from_location_id, qty_kg, status
      ) values (v_item.id, v_lpn.id, v_lpn.current_location_id, v_allocate, 'open');
      update public.wms_lpns set status = 'reserved' where id = v_lpn.id;
      insert into public.wms_stock_movements (
        transaction_type, material_id, lpn_id, qty_kg, movement_qty_kg,
        from_location_id, to_location_id, reference_type, reference_id,
        idempotency_key, created_by
      ) values (
        'Reserve', v_lpn.material_id, v_lpn.id, v_allocate, 0,
        v_lpn.current_location_id, v_lpn.current_location_id, 'outbound_item', v_item.id,
        idempotency_key || ':reserve:' || v_lpn.id::text, auth.uid()
      );
      v_remaining := v_remaining - v_allocate;
    end loop;
    if v_remaining > 0 then raise exception 'Insufficient available stock for outbound line %', coalesce(v_item.line_no, 0); end if;
    update public.wms_outbound_items set allocated_qty_kg = requested_qty_kg, status = 'allocated' where id = v_item.id;
  end loop;

  update public.wms_outbound_documents set status = 'reserved' where id = v_doc.id;
  insert into public.wms_operation_keys (idempotency_key, operation, result_id, user_id)
  values (idempotency_key, 'allocate_outbound', v_doc.id, auth.uid());
  perform public.wms_record_audit('allocate', 'outbound_document', v_doc.id, to_jsonb(v_doc),
    jsonb_build_object('status', 'reserved'), idempotency_key);
  return v_doc.id;
end;
$$;

create or replace function public.wms_pick_task(
  picking_task_id uuid,
  idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.wms_picking_tasks%rowtype;
  v_lpn public.wms_lpns%rowtype;
  v_result_lpn uuid;
  v_child_code text;
  v_token text;
  v_existing uuid;
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor', 'Operator Forklift']);
  if idempotency_key is null or char_length(idempotency_key) not between 8 and 200 then raise exception 'Invalid idempotency key'; end if;
  perform pg_advisory_xact_lock(hashtextextended(idempotency_key, 0));
  select result_id into v_existing from public.wms_operation_keys where wms_operation_keys.idempotency_key = wms_pick_task.idempotency_key;
  if v_existing is not null then return v_existing; end if;
  select * into v_task from public.wms_picking_tasks where id = picking_task_id for update;
  if not found then raise exception 'Picking task not found'; end if;
  if v_task.status <> 'open' then raise exception 'Picking task is not open'; end if;
  select * into v_lpn from public.wms_lpns where id = v_task.lpn_id for update;
  if not found or v_lpn.status <> 'reserved' then raise exception 'Reserved LPN not found'; end if;

  if v_task.qty_kg < v_lpn.qty_current_kg then
    v_result_lpn := gen_random_uuid();
    v_child_code := v_lpn.lpn_code || '-P' || upper(substr(replace(v_result_lpn::text, '-', ''), 1, 5));
    insert into public.wms_lpns (
      id, lpn_code, material_id, lot_id, lot_number, batch_rename, exp_date,
      qty_initial_kg, qty_current_kg, current_location_id, stock_type, status, inbound_doc_id
    ) values (
      v_result_lpn, v_child_code, v_lpn.material_id, v_lpn.lot_id, v_lpn.lot_number,
      v_lpn.batch_rename, v_lpn.exp_date, v_task.qty_kg, 0, v_lpn.current_location_id,
      v_lpn.stock_type, 'picked', v_lpn.inbound_doc_id
    );
    v_token := 'LPN-' || upper(substr(replace(v_result_lpn::text, '-', ''), 1, 16));
    insert into public.wms_scan_links (token, entity_type, entity_id) values (v_token, 'lpn', v_result_lpn);
    insert into public.wms_stock_movements (
      transaction_type, material_id, lpn_id, qty_kg, movement_qty_kg, from_location_id,
      to_location_id, reference_type, reference_id, idempotency_key, created_by
    ) values
      ('Pick', v_lpn.material_id, v_lpn.id, v_task.qty_kg, -v_task.qty_kg,
        v_lpn.current_location_id, v_lpn.current_location_id, 'picking_task', v_task.id,
        idempotency_key || ':source', auth.uid()),
      ('Pick', v_lpn.material_id, v_result_lpn, v_task.qty_kg, v_task.qty_kg,
        v_lpn.current_location_id, v_lpn.current_location_id, 'picking_task', v_task.id,
        idempotency_key || ':split', auth.uid());
    update public.wms_lpns set status = 'available' where id = v_lpn.id;
  else
    v_result_lpn := v_lpn.id;
    insert into public.wms_stock_movements (
      transaction_type, material_id, lpn_id, qty_kg, movement_qty_kg, from_location_id,
      to_location_id, reference_type, reference_id, idempotency_key, created_by
    ) values (
      'Pick', v_lpn.material_id, v_lpn.id, v_task.qty_kg, 0, v_lpn.current_location_id,
      v_lpn.current_location_id, 'picking_task', v_task.id, idempotency_key || ':movement', auth.uid()
    );
    update public.wms_lpns set status = 'picked' where id = v_lpn.id;
  end if;

  update public.wms_picking_tasks
  set status = 'picked', assigned_to = coalesce(assigned_to, auth.uid()), picked_lpn_id = v_result_lpn, picked_at = now()
  where id = v_task.id;
  update public.wms_outbound_items set status = 'picking' where id = v_task.outbound_item_id;
  update public.wms_outbound_documents d set status = 'picking'
  where exists (select 1 from public.wms_outbound_items i where i.id = v_task.outbound_item_id and i.outbound_doc_id = d.id);

  insert into public.wms_operation_keys (idempotency_key, operation, result_id, user_id)
  values (idempotency_key, 'pick_task', v_result_lpn, auth.uid());
  perform public.wms_record_audit('pick', 'picking_task', v_task.id, to_jsonb(v_task),
    jsonb_build_object('status', 'picked', 'picked_lpn_id', v_result_lpn), idempotency_key);
  return v_result_lpn;
end;
$$;

create or replace function public.wms_stage_task(
  picking_task_id uuid,
  staging_location_code text,
  idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.wms_picking_tasks%rowtype;
  v_lpn public.wms_lpns%rowtype;
  v_location public.wms_locations%rowtype;
  v_doc_id uuid;
  v_existing uuid;
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor', 'Operator Forklift']);
  if idempotency_key is null or char_length(idempotency_key) not between 8 and 200 then raise exception 'Invalid idempotency key'; end if;
  perform pg_advisory_xact_lock(hashtextextended(idempotency_key, 0));
  select result_id into v_existing from public.wms_operation_keys where wms_operation_keys.idempotency_key = wms_stage_task.idempotency_key;
  if v_existing is not null then return v_existing; end if;
  select * into v_task from public.wms_picking_tasks where id = picking_task_id for update;
  if not found or v_task.status <> 'picked' then raise exception 'Picking task is not ready for staging'; end if;
  select * into v_lpn from public.wms_lpns where id = coalesce(v_task.picked_lpn_id, v_task.lpn_id) for update;
  select * into v_location from public.wms_locations
  where location_code = staging_location_code and is_active = true and location_type in ('staging', 'loading')
  for update;
  if not found then raise exception 'Active staging location not found'; end if;
  if not public.wms_has_warehouse_access(v_location.warehouse) then raise exception using errcode='42501', message='Warehouse access denied'; end if;

  insert into public.wms_stock_movements (
    transaction_type, material_id, lpn_id, qty_kg, movement_qty_kg, from_location_id,
    to_location_id, reference_type, reference_id, idempotency_key, created_by
  ) values (
    'Stage', v_lpn.material_id, v_lpn.id, v_task.qty_kg, 0, v_lpn.current_location_id,
    v_location.id, 'picking_task', v_task.id, idempotency_key || ':movement', auth.uid()
  );
  update public.wms_lpns set current_location_id = v_location.id, status = 'staged' where id = v_lpn.id;
  update public.wms_picking_tasks set status = 'staged', staged_at = now() where id = v_task.id;
  select i.outbound_doc_id into v_doc_id from public.wms_outbound_items i where i.id = v_task.outbound_item_id;
  if not exists (
    select 1 from public.wms_picking_tasks pt
    join public.wms_outbound_items oi on oi.id = pt.outbound_item_id
    where oi.outbound_doc_id = v_doc_id and pt.status <> 'staged'
  ) then
    update public.wms_outbound_documents set status = 'staged' where id = v_doc_id;
    update public.wms_outbound_items set status = 'staged' where outbound_doc_id = v_doc_id;
  end if;

  insert into public.wms_operation_keys (idempotency_key, operation, result_id, user_id)
  values (idempotency_key, 'stage_task', v_task.id, auth.uid());
  perform public.wms_record_audit('stage', 'picking_task', v_task.id, to_jsonb(v_task),
    jsonb_build_object('status', 'staged', 'location', staging_location_code), idempotency_key);
  return v_task.id;
end;
$$;

create or replace function public.wms_create_delivery_note(
  outbound_document_id uuid,
  delivery_note_no text,
  idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc public.wms_outbound_documents%rowtype;
  v_dn_id uuid;
  v_existing uuid;
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor', 'Checker']);
  if idempotency_key is null or char_length(idempotency_key) not between 8 and 200 then raise exception 'Invalid idempotency key'; end if;
  perform pg_advisory_xact_lock(hashtextextended(idempotency_key, 0));
  select result_id into v_existing from public.wms_operation_keys where wms_operation_keys.idempotency_key = wms_create_delivery_note.idempotency_key;
  if v_existing is not null then return v_existing; end if;
  select * into v_doc from public.wms_outbound_documents where id = outbound_document_id for update;
  if not found or v_doc.status <> 'staged' then raise exception 'Outbound document is not fully staged'; end if;
  if delivery_note_no is null or char_length(trim(delivery_note_no)) not between 3 and 80 then raise exception 'Invalid delivery note number'; end if;

  insert into public.wms_delivery_notes (
    outbound_doc_id, dn_no, status, created_by, document_date, origin, destination,
    address, truck_id, prepared_by_name
  ) values (
    v_doc.id, trim(delivery_note_no), 'created', auth.uid(), coalesce(v_doc.document_date, current_date),
    v_doc.origin, v_doc.destination, v_doc.address, v_doc.truck_id,
    coalesce(v_doc.prepared_by_name, (select full_name from public.wms_profiles where id = auth.uid()))
  ) returning id into v_dn_id;
  update public.wms_outbound_documents set status = 'dn_created' where id = v_doc.id;
  update public.wms_lpns l set status = 'dn_created'
  where l.id in (
    select coalesce(pt.picked_lpn_id, pt.lpn_id)
    from public.wms_picking_tasks pt
    join public.wms_outbound_items oi on oi.id = pt.outbound_item_id
    where oi.outbound_doc_id = v_doc.id
  );
  insert into public.wms_scan_links (token, entity_type, entity_id)
  values ('DN-' || upper(substr(replace(v_dn_id::text, '-', ''), 1, 16)), 'delivery_note', v_dn_id);
  insert into public.wms_operation_keys (idempotency_key, operation, result_id, user_id)
  values (idempotency_key, 'create_delivery_note', v_dn_id, auth.uid());
  perform public.wms_record_audit('create', 'delivery_note', v_dn_id, null,
    jsonb_build_object('dn_no', trim(delivery_note_no), 'outbound_document_id', v_doc.id), idempotency_key);
  return v_dn_id;
end;
$$;

create or replace function public.wms_dispatch_outbound(
  outbound_document_id uuid,
  idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc public.wms_outbound_documents%rowtype;
  v_task record;
  v_lpn public.wms_lpns%rowtype;
  v_existing uuid;
  v_task_count integer;
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor', 'Checker']);
  if idempotency_key is null or char_length(idempotency_key) not between 8 and 200 then raise exception 'Invalid idempotency key'; end if;
  perform pg_advisory_xact_lock(hashtextextended(idempotency_key, 0));
  select result_id into v_existing from public.wms_operation_keys where wms_operation_keys.idempotency_key = wms_dispatch_outbound.idempotency_key;
  if v_existing is not null then return v_existing; end if;
  select * into v_doc from public.wms_outbound_documents where id = outbound_document_id for update;
  if not found or v_doc.status <> 'dn_created' then raise exception 'Outbound document is not ready for dispatch'; end if;
  if not exists (select 1 from public.wms_delivery_notes where outbound_doc_id = v_doc.id and status = 'created') then
    raise exception 'Active delivery note not found';
  end if;
  select count(*) into v_task_count
  from public.wms_picking_tasks pt
  join public.wms_outbound_items oi on oi.id = pt.outbound_item_id
  where oi.outbound_doc_id = v_doc.id and pt.status = 'staged';
  if v_task_count = 0 then raise exception 'No staged picking tasks found for dispatch'; end if;
  if exists (
    select 1 from public.wms_picking_tasks pt
    join public.wms_outbound_items oi on oi.id = pt.outbound_item_id
    where oi.outbound_doc_id = v_doc.id and pt.status <> 'staged'
  ) then raise exception 'All picking tasks must be staged before dispatch'; end if;

  for v_task in
    select pt.* from public.wms_picking_tasks pt
    join public.wms_outbound_items oi on oi.id = pt.outbound_item_id
    where oi.outbound_doc_id = v_doc.id and pt.status = 'staged'
    order by pt.created_at
  loop
    select * into v_lpn from public.wms_lpns where id = coalesce(v_task.picked_lpn_id, v_task.lpn_id) for update;
    insert into public.wms_stock_movements (
      transaction_type, material_id, lpn_id, qty_kg, movement_qty_kg,
      from_location_id, reference_type, reference_id, idempotency_key, created_by
    ) values (
      'Outbound', v_lpn.material_id, v_lpn.id, v_task.qty_kg, -v_task.qty_kg,
      v_lpn.current_location_id, 'outbound_document', v_doc.id,
      idempotency_key || ':task:' || v_task.id::text, auth.uid()
    );
    update public.wms_lpns
    set status = case when qty_current_kg = 0 then 'shipped' else 'available' end,
        current_location_id = case when qty_current_kg = 0 then null else current_location_id end
    where id = v_lpn.id;
  end loop;

  update public.wms_outbound_items set status = 'shipped' where outbound_doc_id = v_doc.id;
  update public.wms_delivery_notes set status = 'shipped', shipped_at = now() where outbound_doc_id = v_doc.id and status = 'created';
  update public.wms_outbound_documents set status = 'shipped', shipped_at = now() where id = v_doc.id;
  insert into public.wms_operation_keys (idempotency_key, operation, result_id, user_id)
  values (idempotency_key, 'dispatch_outbound', v_doc.id, auth.uid());
  perform public.wms_record_audit('dispatch', 'outbound_document', v_doc.id, to_jsonb(v_doc),
    jsonb_build_object('status', 'shipped', 'shipped_at', now()), idempotency_key);
  return v_doc.id;
end;
$$;

create or replace function public.wms_open_cycle_count(location_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_location public.wms_locations%rowtype;
  v_session_id uuid;
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor']);
  select * into v_location from public.wms_locations where id = location_id and is_active = true;
  if not found then raise exception 'Active location not found'; end if;
  if not public.wms_has_warehouse_access(v_location.warehouse) then raise exception using errcode='42501', message='Warehouse access denied'; end if;
  if exists (select 1 from public.wms_cycle_count_sessions where scope_location_id = location_id and status in ('open', 'in_progress', 'counted')) then
    raise exception 'An active cycle count already exists for this location';
  end if;
  insert into public.wms_cycle_count_sessions (scope_location_id, status, opened_by)
  values (location_id, 'open', auth.uid()) returning id into v_session_id;
  insert into public.wms_cycle_count_lines (
    session_id, location_id, lpn_id, expected_qty_kg, actual_qty_kg, status, counted_by, is_counted
  )
  select v_session_id, location_id, l.id, l.qty_current_kg, 0, 'counted', null, false
  from public.wms_lpns l
  where l.current_location_id = location_id and not l.is_void and l.status not in ('shipped', 'closed', 'void');
  perform public.wms_record_audit('open', 'cycle_count_session', v_session_id, null,
    jsonb_build_object('location_id', location_id));
  return v_session_id;
end;
$$;

create or replace function public.wms_submit_cycle_count(
  cycle_count_line_id uuid,
  actual_qty_kg numeric
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_line public.wms_cycle_count_lines%rowtype;
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor', 'Operator Forklift']);
  if actual_qty_kg is null or actual_qty_kg < 0 then raise exception 'Actual quantity cannot be negative'; end if;
  select * into v_line from public.wms_cycle_count_lines where id = cycle_count_line_id for update;
  if not found then raise exception 'Cycle count line not found'; end if;
  if not exists (select 1 from public.wms_cycle_count_sessions where id = v_line.session_id and status in ('open', 'in_progress')) then
    raise exception 'Cycle count session is not open';
  end if;
  if v_line.location_id is not null and not exists (
    select 1 from public.wms_locations loc where loc.id = v_line.location_id and public.wms_has_warehouse_access(loc.warehouse)
  ) then raise exception using errcode='42501', message='Warehouse access denied'; end if;
  update public.wms_cycle_count_lines
  set actual_qty_kg = wms_submit_cycle_count.actual_qty_kg, counted_by = auth.uid(), counted_at = now(), is_counted = true
  where id = v_line.id;
  update public.wms_cycle_count_sessions set status = case when not exists (
    select 1 from public.wms_cycle_count_lines l where l.session_id = v_line.session_id and not l.is_counted
  ) then 'counted' else 'in_progress' end where id = v_line.session_id;
  perform public.wms_record_audit('count', 'cycle_count_line', v_line.id, to_jsonb(v_line),
    jsonb_build_object('actual_qty_kg', actual_qty_kg));
  return v_line.id;
end;
$$;

create or replace function public.wms_review_cycle_count(
  cycle_count_session_id uuid,
  approve boolean,
  idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.wms_cycle_count_sessions%rowtype;
  v_line public.wms_cycle_count_lines%rowtype;
  v_lpn public.wms_lpns%rowtype;
  v_existing uuid;
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor']);
  if idempotency_key is null or char_length(idempotency_key) not between 8 and 200 then raise exception 'Invalid idempotency key'; end if;
  perform pg_advisory_xact_lock(hashtextextended(idempotency_key, 0));
  select result_id into v_existing from public.wms_operation_keys where wms_operation_keys.idempotency_key = wms_review_cycle_count.idempotency_key;
  if v_existing is not null then return v_existing; end if;
  select * into v_session from public.wms_cycle_count_sessions where id = cycle_count_session_id for update;
  if not found or v_session.status <> 'counted' then raise exception 'Cycle count is not ready for review'; end if;

  for v_line in select * from public.wms_cycle_count_lines where session_id = v_session.id for update
  loop
    if not v_line.is_counted then raise exception 'All cycle count lines must be counted'; end if;
    if approve then
      select * into v_lpn from public.wms_lpns where id = v_line.lpn_id for update;
      if v_lpn.qty_current_kg <> v_line.expected_qty_kg then raise exception 'Stock changed after count; reopen cycle count'; end if;
      if v_line.variance_qty_kg <> 0 then
        insert into public.wms_stock_movements (
          transaction_type, material_id, lpn_id, qty_kg, movement_qty_kg,
          from_location_id, to_location_id, reference_type, reference_id,
          idempotency_key, created_by
        ) values (
          'Cycle Count', v_lpn.material_id, v_lpn.id, abs(v_line.variance_qty_kg), v_line.variance_qty_kg,
          v_lpn.current_location_id, v_lpn.current_location_id, 'cycle_count_line', v_line.id,
          idempotency_key || ':line:' || v_line.id::text, auth.uid()
        );
      end if;
      update public.wms_cycle_count_lines set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now() where id = v_line.id;
    else
      update public.wms_cycle_count_lines set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now() where id = v_line.id;
    end if;
  end loop;
  update public.wms_cycle_count_sessions set status = case when approve then 'closed' else 'cancelled' end, closed_at = now() where id = v_session.id;
  insert into public.wms_operation_keys (idempotency_key, operation, result_id, user_id)
  values (idempotency_key, 'review_cycle_count', v_session.id, auth.uid());
  perform public.wms_record_audit(case when approve then 'approve' else 'reject' end,
    'cycle_count_session', v_session.id, to_jsonb(v_session), jsonb_build_object('approved', approve), idempotency_key);
  return v_session.id;
end;
$$;

create or replace function public.wms_request_adjustment(
  lpn_token text,
  target_qty_kg numeric,
  reason_code text,
  note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lpn public.wms_lpns%rowtype;
  v_request_id uuid;
  v_warehouse text;
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor', 'Operator Forklift']);
  if target_qty_kg is null or target_qty_kg < 0 then raise exception 'Target quantity cannot be negative'; end if;
  select l.* into v_lpn
  from public.wms_lpns l
  join public.wms_scan_links sl on sl.entity_id = l.id and sl.entity_type = 'lpn' and sl.is_active
  where sl.token = public.wms_extract_scan_token(lpn_token)
  for update of l;
  if not found then raise exception 'Active LPN token not found'; end if;
  select warehouse into v_warehouse from public.wms_locations where id = v_lpn.current_location_id;
  if v_warehouse is not null and not public.wms_has_warehouse_access(v_warehouse) then raise exception using errcode='42501', message='Warehouse access denied'; end if;
  if exists (select 1 from public.wms_adjustment_requests where lpn_id = v_lpn.id and status = 'pending') then raise exception 'Pending adjustment already exists for this LPN'; end if;
  insert into public.wms_adjustment_requests (
    lpn_id, qty_before_kg, qty_after_kg, reason_code, note, submitted_by
  ) values (
    v_lpn.id, v_lpn.qty_current_kg, target_qty_kg, upper(trim(reason_code)), nullif(trim(note), ''), auth.uid()
  ) returning id into v_request_id;
  perform public.wms_record_audit('request', 'adjustment', v_request_id, null,
    jsonb_build_object('lpn_id', v_lpn.id, 'qty_before_kg', v_lpn.qty_current_kg,
      'qty_after_kg', target_qty_kg, 'reason_code', upper(trim(reason_code))));
  return v_request_id;
end;
$$;

create or replace function public.wms_review_adjustment(
  adjustment_request_id uuid,
  approve boolean,
  idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.wms_adjustment_requests%rowtype;
  v_lpn public.wms_lpns%rowtype;
  v_existing uuid;
  v_delta numeric(18,3);
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor']);
  if idempotency_key is null or char_length(idempotency_key) not between 8 and 200 then raise exception 'Invalid idempotency key'; end if;
  perform pg_advisory_xact_lock(hashtextextended(idempotency_key, 0));
  select result_id into v_existing from public.wms_operation_keys where wms_operation_keys.idempotency_key = wms_review_adjustment.idempotency_key;
  if v_existing is not null then return v_existing; end if;
  select * into v_request from public.wms_adjustment_requests where id = adjustment_request_id for update;
  if not found or v_request.status <> 'pending' then raise exception 'Adjustment request is not pending'; end if;
  select * into v_lpn from public.wms_lpns where id = v_request.lpn_id for update;
  if v_lpn.qty_current_kg <> v_request.qty_before_kg then raise exception 'LPN balance changed after adjustment request'; end if;
  if approve then
    v_delta := v_request.qty_after_kg - v_request.qty_before_kg;
    if v_delta <> 0 then
      insert into public.wms_stock_movements (
        transaction_type, material_id, lpn_id, qty_kg, movement_qty_kg,
        from_location_id, to_location_id, reference_type, reference_id,
        idempotency_key, created_by
      ) values (
        'Adjustment', v_lpn.material_id, v_lpn.id, abs(v_delta), v_delta,
        v_lpn.current_location_id, v_lpn.current_location_id, v_request.reason_code, v_request.id,
        idempotency_key || ':movement', auth.uid()
      );
    end if;
    update public.wms_adjustment_requests set status='approved', reviewed_by=auth.uid(), reviewed_at=now() where id=v_request.id;
    update public.wms_lpns set status = case when qty_current_kg = 0 then 'closed' else status end where id = v_lpn.id;
  else
    update public.wms_adjustment_requests set status='rejected', reviewed_by=auth.uid(), reviewed_at=now() where id=v_request.id;
  end if;
  insert into public.wms_operation_keys (idempotency_key, operation, result_id, user_id)
  values (idempotency_key, 'review_adjustment', v_request.id, auth.uid());
  perform public.wms_record_audit(case when approve then 'approve' else 'reject' end,
    'adjustment', v_request.id, to_jsonb(v_request), jsonb_build_object('approved', approve), idempotency_key);
  return v_request.id;
end;
$$;

create or replace function public.wms_import_material_master(
  source_file_name text,
  source_sheet_name text,
  file_content_hash text,
  rows_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch_id uuid;
  v_row jsonb;
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor']);
  if source_file_name is null or char_length(trim(source_file_name)) not between 1 and 180 then raise exception 'Invalid source file name'; end if;
  if file_content_hash is null or char_length(file_content_hash) not between 32 and 200 then raise exception 'Invalid content hash'; end if;
  if rows_payload is null or jsonb_typeof(rows_payload) <> 'array' or jsonb_array_length(rows_payload) not between 1 and 20000 then
    raise exception 'Material import requires between 1 and 20000 rows';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(file_content_hash, 0));
  select id into v_batch_id from public.wms_inventory_import_batches where content_hash = file_content_hash;
  if v_batch_id is not null then return v_batch_id; end if;
  insert into public.wms_inventory_import_batches (
    source_file, source_sheet, source_kind, row_count, status, imported_by, content_hash
  ) values (
    trim(source_file_name), trim(source_sheet_name), 'material_master',
    jsonb_array_length(rows_payload), 'posted', auth.uid(), file_content_hash
  ) returning id into v_batch_id;

  for v_row in select value from jsonb_array_elements(rows_payload)
  loop
    if coalesce(trim(v_row->>'material_code'), '') = '' then raise exception 'Material code is required'; end if;
    insert into public.wms_materials (
      material_code, long_description, hybrid, stage, flagging, type, product, crop,
      status, order_unit, standard_package_kg, is_active
    ) values (
      trim(v_row->>'material_code'), coalesce(nullif(trim(v_row->>'material_description'),''), trim(v_row->>'material_code')),
      nullif(trim(v_row->>'hybrid'),''), nullif(trim(v_row->>'stage'),''), nullif(trim(v_row->>'flagging'),''),
      nullif(trim(v_row->>'material_type'),''), nullif(trim(v_row->>'product'),''), nullif(trim(v_row->>'crop'),''),
      coalesce(nullif(trim(v_row->>'inventory_status'),''),'active'), 'KG', 0, true
    ) on conflict (material_code) do update set
      long_description = excluded.long_description,
      hybrid = coalesce(excluded.hybrid, public.wms_materials.hybrid),
      stage = coalesce(excluded.stage, public.wms_materials.stage),
      flagging = coalesce(excluded.flagging, public.wms_materials.flagging),
      type = coalesce(excluded.type, public.wms_materials.type),
      product = coalesce(excluded.product, public.wms_materials.product),
      crop = coalesce(excluded.crop, public.wms_materials.crop),
      status = excluded.status,
      is_active = true;
  end loop;
  perform public.wms_record_audit('import', 'material_master_batch', v_batch_id, null,
    jsonb_build_object('source_file', source_file_name, 'source_sheet', source_sheet_name,
      'row_count', jsonb_array_length(rows_payload)));
  return v_batch_id;
end;
$$;

create or replace function public.wms_stage_inventory_batch(
  source_file_name text,
  source_sheet_name text,
  warehouse_name text,
  snapshot_date date,
  file_content_hash text,
  rows_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch_id uuid;
  v_row jsonb;
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor']);
  if source_file_name is null or char_length(trim(source_file_name)) not between 1 and 180 then raise exception 'Invalid source file name'; end if;
  if source_sheet_name is null or char_length(trim(source_sheet_name)) not between 1 and 120 then raise exception 'Invalid source sheet name'; end if;
  if file_content_hash is null or char_length(file_content_hash) not between 32 and 200 then raise exception 'Invalid content hash'; end if;
  if rows_payload is null or jsonb_typeof(rows_payload) <> 'array' or jsonb_array_length(rows_payload) not between 1 and 20000 then
    raise exception 'Inventory staging requires between 1 and 20000 rows';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(file_content_hash, 0));
  select id into v_batch_id from public.wms_inventory_import_batches where content_hash = file_content_hash;
  if v_batch_id is not null then return v_batch_id; end if;

  insert into public.wms_inventory_import_batches (
    source_file, source_sheet, source_kind, warehouse, source_date, row_count,
    status, imported_by, content_hash
  ) values (
    trim(source_file_name), trim(source_sheet_name), 'inventory_snapshot', nullif(trim(warehouse_name), ''),
    snapshot_date, jsonb_array_length(rows_payload), 'validated', auth.uid(), file_content_hash
  ) returning id into v_batch_id;

  for v_row in select value from jsonb_array_elements(rows_payload)
  loop
    if coalesce(trim(v_row->>'material_code'), '') = ''
      or coalesce(trim(v_row->>'lot_number'), '') = ''
      or coalesce(trim(v_row->>'warehouse'), '') = ''
      or coalesce((v_row->>'qty_kg')::numeric, 0) <= 0
      or coalesce(v_row->>'validation_result', 'blocked') = 'blocked'
    then raise exception 'Blocked or invalid inventory row %', v_row->>'source_row'; end if;

    insert into public.wms_inventory_import_lines (
      batch_id, source_row, stock_date, material_code, material_description, hybrid,
      stage, flagging, lot_number, qty_kg, warehouse, material_type, product, crop,
      inventory_status, return_classification, ageing_days, sap_qty_kg, note, remark,
      source_hash, validation_result, validation_message
    ) values (
      v_batch_id, (v_row->>'source_row')::integer, nullif(v_row->>'stock_date','')::date,
      trim(v_row->>'material_code'), nullif(trim(v_row->>'material_description'),''),
      nullif(trim(v_row->>'hybrid'),''), nullif(trim(v_row->>'stage'),''),
      nullif(trim(v_row->>'flagging'),''), trim(v_row->>'lot_number'), (v_row->>'qty_kg')::numeric,
      trim(v_row->>'warehouse'), nullif(trim(v_row->>'material_type'),''),
      nullif(trim(v_row->>'product'),''), nullif(trim(v_row->>'crop'),''),
      nullif(trim(v_row->>'inventory_status'),''), nullif(trim(v_row->>'return_classification'),''),
      nullif(v_row->>'ageing_days','')::integer, nullif(v_row->>'sap_qty_kg','')::numeric,
      nullif(trim(v_row->>'note'),''), nullif(trim(v_row->>'remark'),''),
      file_content_hash || ':' || (v_row->>'source_row'),
      coalesce(nullif(v_row->>'validation_result',''), 'valid'), nullif(v_row->>'validation_message','')
    );
  end loop;
  perform public.wms_record_audit('stage', 'inventory_import_batch', v_batch_id, null,
    jsonb_build_object('source_file', source_file_name, 'source_sheet', source_sheet_name,
      'row_count', jsonb_array_length(rows_payload)));
  return v_batch_id;
end;
$$;

create or replace function public.wms_post_inventory_batch(
  inventory_batch_id uuid,
  idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch public.wms_inventory_import_batches%rowtype;
  v_line public.wms_inventory_import_lines%rowtype;
  v_material_id uuid;
  v_lot_id uuid;
  v_location_id uuid;
  v_lpn_id uuid;
  v_existing uuid;
  v_stock_type text;
begin
  perform public.wms_require_any_role(array['Admin', 'Supervisor']);
  if idempotency_key is null or char_length(idempotency_key) not between 8 and 200 then raise exception 'Invalid idempotency key'; end if;
  perform pg_advisory_xact_lock(hashtextextended(idempotency_key, 0));
  select result_id into v_existing from public.wms_operation_keys where wms_operation_keys.idempotency_key = wms_post_inventory_batch.idempotency_key;
  if v_existing is not null then return v_existing; end if;
  select * into v_batch from public.wms_inventory_import_batches where id = inventory_batch_id for update;
  if not found or v_batch.status not in ('uploaded', 'validated') then raise exception 'Inventory batch is not ready for posting'; end if;
  if exists (select 1 from public.wms_inventory_import_lines where batch_id = v_batch.id and validation_result = 'blocked') then
    raise exception 'Inventory batch contains blocked rows';
  end if;
  if not exists (select 1 from public.wms_inventory_import_lines where batch_id = v_batch.id) then raise exception 'Inventory batch is empty'; end if;
  if exists (select 1 from public.wms_inventory_import_lines where batch_id = v_batch.id and qty_kg <= 0) then
    raise exception 'Inventory batch contains zero or negative quantity';
  end if;

  for v_line in select * from public.wms_inventory_import_lines where batch_id = v_batch.id order by source_row
  loop
    select id into v_location_id from public.wms_locations
    where warehouse = v_line.warehouse and is_active and location_type in ('storage', 'receiving')
    order by case when location_type='receiving' then 0 else 1 end, created_at limit 1;
    if v_location_id is null then raise exception 'No active receiving/storage location for warehouse %', v_line.warehouse; end if;
    insert into public.wms_materials (
      material_code, long_description, hybrid, stage, flagging, type, product, crop,
      status, order_unit, standard_package_kg, is_active
    ) values (
      v_line.material_code, coalesce(nullif(v_line.material_description,''), v_line.material_code),
      v_line.hybrid, v_line.stage, v_line.flagging, v_line.material_type, v_line.product,
      v_line.crop, coalesce(nullif(v_line.inventory_status,''),'active'), 'KG', 0, true
    ) on conflict (material_code) do update set
      long_description = coalesce(nullif(excluded.long_description,''), public.wms_materials.long_description),
      hybrid = coalesce(excluded.hybrid, public.wms_materials.hybrid),
      stage = coalesce(excluded.stage, public.wms_materials.stage),
      flagging = coalesce(excluded.flagging, public.wms_materials.flagging),
      type = coalesce(excluded.type, public.wms_materials.type),
      product = coalesce(excluded.product, public.wms_materials.product),
      crop = coalesce(excluded.crop, public.wms_materials.crop)
    returning id into v_material_id;
    v_stock_type := case
      when lower(trim(coalesce(v_line.return_classification,''))) like 'non%return%' then 'Fresh Seed'
      when lower(coalesce(v_line.return_classification,'')) like '%return%' then 'Return Seed'
      else 'Fresh Seed'
    end;
    insert into public.wms_lots (material_id, lot_number, stock_type)
    values (v_material_id, v_line.lot_number, v_stock_type)
    on conflict (material_id, lot_number, stock_type) do update set lot_number=excluded.lot_number
    returning id into v_lot_id;
    v_lpn_id := gen_random_uuid();
    insert into public.wms_lpns (
      id, lpn_code, material_id, lot_id, lot_number, qty_initial_kg, qty_current_kg,
      current_location_id, stock_type, status
    ) values (
      v_lpn_id, 'IMP-' || upper(substr(replace(v_batch.id::text,'-',''),1,6)) || '-' || lpad(v_line.source_row::text,5,'0'),
      v_material_id, v_lot_id, v_line.lot_number, v_line.qty_kg, 0, v_location_id,
      v_stock_type, 'available'
    );
    insert into public.wms_scan_links (token, entity_type, entity_id)
    values ('LPN-' || upper(substr(replace(v_lpn_id::text,'-',''),1,16)), 'lpn', v_lpn_id);
    insert into public.wms_stock_movements (
      transaction_type, material_id, lpn_id, qty_kg, movement_qty_kg,
      to_location_id, reference_type, reference_id, idempotency_key, created_by
    ) values (
      'Inbound', v_material_id, v_lpn_id, v_line.qty_kg, v_line.qty_kg,
      v_location_id, 'inventory_import_line', v_line.id,
      idempotency_key || ':line:' || v_line.id::text, auth.uid()
    );
    update public.wms_inventory_import_lines set material_id=v_material_id, validation_result='valid', validation_message='Posted to WMS ledger' where id=v_line.id;
  end loop;
  update public.wms_inventory_import_batches set status='posted' where id=v_batch.id;
  insert into public.wms_operation_keys (idempotency_key, operation, result_id, user_id)
  values (idempotency_key, 'post_inventory_batch', v_batch.id, auth.uid());
  perform public.wms_record_audit('post', 'inventory_import_batch', v_batch.id, to_jsonb(v_batch),
    jsonb_build_object('status','posted'), idempotency_key);
  return v_batch.id;
end;
$$;

create or replace view public.wms_inventory_detail_view
with (security_invoker = true)
as
select
  l.id as lpn_id,
  l.lpn_code,
  l.material_id,
  m.material_code,
  m.long_description as material_description,
  l.lot_id,
  l.lot_number,
  l.exp_date,
  l.current_location_id,
  loc.location_code as current_location,
  loc.warehouse,
  l.stock_type,
  l.qty_current_kg,
  l.status,
  l.inbound_doc_id,
  l.is_void,
  l.created_at,
  (select sl.token from public.wms_scan_links sl where sl.entity_type='lpn' and sl.entity_id=l.id and sl.is_active limit 1) as scan_token
from public.wms_lpns l
join public.wms_materials m on m.id=l.material_id
left join public.wms_locations loc on loc.id=l.current_location_id;

alter table public.wms_stock_types enable row level security;
alter table public.wms_adjustment_requests enable row level security;
alter table public.wms_audit_log enable row level security;
alter table public.wms_operation_keys enable row level security;
alter table public.wms_action_rate_limits enable row level security;

-- All business writes must pass through audited SECURITY DEFINER RPCs. Legacy
-- browser-write policies are removed so PostgREST cannot bypass workflow rules.
drop policy if exists wms_warehouses_admin_write on public.wms_warehouses;
drop policy if exists wms_locations_admin_write on public.wms_locations;
drop policy if exists wms_materials_admin_write on public.wms_materials;
drop policy if exists wms_docs_admin_write on public.wms_inbound_documents;
drop policy if exists wms_inbound_items_admin_write on public.wms_inbound_items;
drop policy if exists wms_outbound_admin_write on public.wms_outbound_documents;
drop policy if exists wms_cycle_count_supervisor_write on public.wms_cycle_count_sessions;
drop policy if exists wms_cycle_count_lines_scoped_insert on public.wms_cycle_count_lines;
drop policy if exists wms_inventory_import_batches_write on public.wms_inventory_import_batches;
drop policy if exists wms_inventory_import_lines_write on public.wms_inventory_import_lines;
drop policy if exists wms_document_signoffs_write on public.wms_document_signoffs;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'wms_user_roles', 'wms_warehouses', 'wms_locations', 'wms_materials', 'wms_lots',
    'wms_inbound_documents', 'wms_inbound_items', 'wms_lpns', 'wms_scan_links',
    'wms_outbound_documents', 'wms_outbound_items', 'wms_picking_tasks',
    'wms_delivery_notes', 'wms_stock_movements', 'wms_scan_events',
    'wms_cycle_count_sessions', 'wms_cycle_count_lines', 'wms_document_signoffs',
    'wms_inventory_import_batches', 'wms_inventory_import_lines', 'wms_stock_types',
    'wms_adjustment_requests', 'wms_audit_log', 'wms_operation_keys',
    'wms_action_rate_limits'
  ]
  loop
    execute format('revoke insert, update, delete on table public.%I from authenticated', table_name);
  end loop;
end;
$$;

drop policy if exists wms_cycle_count_scoped_read on public.wms_cycle_count_sessions;
create policy wms_cycle_count_scoped_read on public.wms_cycle_count_sessions for select to authenticated
  using (
    (public.wms_has_role('Admin') or public.wms_has_role('Supervisor') or public.wms_has_role('Operator Forklift'))
    and (
      scope_location_id is null
      or exists (
        select 1 from public.wms_locations loc
        where loc.id = scope_location_id and public.wms_has_warehouse_access(loc.warehouse)
      )
    )
  );

drop policy if exists wms_cycle_count_lines_scoped_read on public.wms_cycle_count_lines;
create policy wms_cycle_count_lines_scoped_read on public.wms_cycle_count_lines for select to authenticated
  using (
    (public.wms_has_role('Admin') or public.wms_has_role('Supervisor') or public.wms_has_role('Operator Forklift'))
    and (
      location_id is null
      or exists (
        select 1 from public.wms_locations loc
        where loc.id = location_id and public.wms_has_warehouse_access(loc.warehouse)
      )
    )
  );

drop policy if exists wms_stock_types_member_read on public.wms_stock_types;
create policy wms_stock_types_member_read on public.wms_stock_types for select to authenticated
  using (public.wms_is_member());
drop policy if exists wms_adjustment_requests_role_read on public.wms_adjustment_requests;
create policy wms_adjustment_requests_role_read on public.wms_adjustment_requests for select to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Supervisor') or submitted_by=auth.uid());
drop policy if exists wms_audit_log_admin_read on public.wms_audit_log;
create policy wms_audit_log_admin_read on public.wms_audit_log for select to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Supervisor'));

grant select on public.wms_stock_types, public.wms_adjustment_requests, public.wms_audit_log to authenticated;
grant select on public.wms_inventory_detail_view to authenticated;
revoke all on public.wms_operation_keys from public, anon, authenticated;
revoke all on public.wms_action_rate_limits from public, anon, authenticated;
revoke all on sequence public.wms_audit_log_id_seq from public, anon, authenticated;
revoke insert, update, delete on public.wms_adjustment_requests from authenticated;
revoke insert, update, delete on public.wms_audit_log from authenticated;

do $$
declare
  function_signature text;
begin
  foreach function_signature in array array[
    'public.wms_check_rate_limit(text,integer,integer)',
    'public.wms_require_any_role(text[])',
    'public.wms_record_audit(text,text,uuid,jsonb,jsonb,text,jsonb)',
    'public.wms_upsert_warehouse(text,text,text,boolean)',
    'public.wms_upsert_location(text,text,text,numeric,text,text,text,text,text,text,boolean)',
    'public.wms_upsert_material(text,text,text,text,text,text,text,text,text,text,numeric,boolean)',
    'public.wms_upsert_stock_type(text,text,text,text,boolean)',
    'public.wms_set_profile_access(text,text,text,text,text[],boolean)',
    'public.wms_create_inbound(text,text,date,text,jsonb,text)',
    'public.wms_receive_inbound_item(uuid,numeric,text,text)',
    'public.wms_create_outbound(text,text,date,text,jsonb,text)',
    'public.wms_allocate_outbound(uuid,text)',
    'public.wms_pick_task(uuid,text)',
    'public.wms_stage_task(uuid,text,text)',
    'public.wms_create_delivery_note(uuid,text,text)',
    'public.wms_dispatch_outbound(uuid,text)',
    'public.wms_open_cycle_count(uuid)',
    'public.wms_submit_cycle_count(uuid,numeric)',
    'public.wms_review_cycle_count(uuid,boolean,text)',
    'public.wms_request_adjustment(text,numeric,text,text)',
    'public.wms_review_adjustment(uuid,boolean,text)',
    'public.wms_import_material_master(text,text,text,jsonb)',
    'public.wms_stage_inventory_batch(text,text,text,date,text,jsonb)',
    'public.wms_post_inventory_batch(uuid,text)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', function_signature);
  end loop;
end;
$$;

grant execute on function public.wms_upsert_warehouse(text,text,text,boolean) to authenticated;
grant execute on function public.wms_upsert_location(text,text,text,numeric,text,text,text,text,text,text,boolean) to authenticated;
grant execute on function public.wms_upsert_material(text,text,text,text,text,text,text,text,text,text,numeric,boolean) to authenticated;
grant execute on function public.wms_upsert_stock_type(text,text,text,text,boolean) to authenticated;
grant execute on function public.wms_set_profile_access(text,text,text,text,text[],boolean) to authenticated;
grant execute on function public.wms_create_inbound(text,text,date,text,jsonb,text) to authenticated;
grant execute on function public.wms_receive_inbound_item(uuid,numeric,text,text) to authenticated;
grant execute on function public.wms_create_outbound(text,text,date,text,jsonb,text) to authenticated;
grant execute on function public.wms_allocate_outbound(uuid,text) to authenticated;
grant execute on function public.wms_pick_task(uuid,text) to authenticated;
grant execute on function public.wms_stage_task(uuid,text,text) to authenticated;
grant execute on function public.wms_create_delivery_note(uuid,text,text) to authenticated;
grant execute on function public.wms_dispatch_outbound(uuid,text) to authenticated;
grant execute on function public.wms_open_cycle_count(uuid) to authenticated;
grant execute on function public.wms_submit_cycle_count(uuid,numeric) to authenticated;
grant execute on function public.wms_review_cycle_count(uuid,boolean,text) to authenticated;
grant execute on function public.wms_request_adjustment(text,numeric,text,text) to authenticated;
grant execute on function public.wms_review_adjustment(uuid,boolean,text) to authenticated;
grant execute on function public.wms_import_material_master(text,text,text,jsonb) to authenticated;
grant execute on function public.wms_stage_inventory_batch(text,text,text,date,text,jsonb) to authenticated;
grant execute on function public.wms_post_inventory_batch(uuid,text) to authenticated;

do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname='supabase_realtime') then
    foreach table_name in array array[
      'wms_materials', 'wms_warehouses', 'wms_locations', 'wms_lpns',
      'wms_stock_movements', 'wms_inbound_documents', 'wms_inbound_items',
      'wms_outbound_documents', 'wms_outbound_items', 'wms_picking_tasks',
      'wms_delivery_notes', 'wms_cycle_count_sessions', 'wms_cycle_count_lines',
      'wms_adjustment_requests', 'wms_inventory_import_batches', 'wms_scan_events'
    ]
    loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname='supabase_realtime' and schemaname='public' and tablename=table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end;
$$;

commit;
