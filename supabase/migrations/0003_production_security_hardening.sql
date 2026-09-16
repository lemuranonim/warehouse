-- Production security baseline for the shared Advanta Supabase project.
-- Apply after 0001 and 0002. This migration is intentionally additive for live environments.
begin;

alter table public.wms_profiles
  add column if not exists is_active boolean not null default true;

create or replace function public.wms_is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wms_profiles p
    join public.wms_user_roles ur on ur.user_id = p.id
    where p.id = auth.uid()
      and p.is_active = true
  );
$$;

create or replace function public.wms_has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wms_user_roles ur
    join public.wms_roles r on r.id = ur.role_id
    join public.wms_profiles p on p.id = ur.user_id
    where ur.user_id = auth.uid()
      and p.is_active = true
      and r.name = role_name
  );
$$;

create or replace function public.wms_has_warehouse_access(warehouse_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.wms_has_role('Admin')
    or public.wms_has_role('Supervisor')
    or exists (
      select 1
      from public.wms_profiles p
      where p.id = auth.uid()
        and p.is_active = true
        and warehouse_code is not null
        and (
          warehouse_code = p.default_warehouse
          or warehouse_code = any(p.warehouse_scope)
          or 'All' = any(p.warehouse_scope)
        )
    );
$$;

-- qty_current_kg is a materialized balance maintained from append-only movements.
-- Location-only movements (for example Putaway) no longer collapse the balance to zero.
create or replace view public.wms_current_stock_view with (security_invoker = true) as
select
  l.lpn_code,
  m.material_code,
  m.long_description as material_description,
  l.lot_number,
  loc.location_code as current_location,
  l.stock_type,
  -- Preserve the existing view column type (unconstrained numeric). PostgreSQL
  -- rejects CREATE OR REPLACE VIEW when a numeric typmod changes to numeric(18,3).
  l.qty_current_kg::numeric as qty_current_kg,
  l.status,
  max(sm.movement_date) as last_update
from public.wms_lpns l
join public.wms_materials m on m.id = l.material_id
left join public.wms_locations loc on loc.id = l.current_location_id
left join public.wms_stock_movements sm on sm.lpn_id = l.id
group by l.id, m.material_code, m.long_description, loc.location_code;

alter view public.wms_inventory_snapshot_reconciliation_view set (security_invoker = true);

create or replace function public.wms_apply_stock_movement_to_lpn()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.lpn_id is not null and new.movement_qty_kg <> 0 then
    update public.wms_lpns
    set qty_current_kg = qty_current_kg + new.movement_qty_kg
    where id = new.lpn_id
      and qty_current_kg + new.movement_qty_kg >= 0;
    if not found then
      raise exception using errcode = '23514', message = 'Stock movement would create a negative LPN balance';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists wms_stock_movement_apply_balance on public.wms_stock_movements;
create trigger wms_stock_movement_apply_balance
after insert on public.wms_stock_movements
for each row execute function public.wms_apply_stock_movement_to_lpn();

-- New writes are constrained immediately. NOT VALID avoids blocking deployment when
-- historical rows need remediation; validate these constraints after reconciliation.
alter table public.wms_locations
  add constraint wms_locations_capacity_positive_chk check (capacity_kg is null or capacity_kg > 0) not valid;
alter table public.wms_materials
  add constraint wms_materials_package_nonnegative_chk check (standard_package_kg >= 0) not valid;
alter table public.wms_inbound_items
  add constraint wms_inbound_planned_qty_nonnegative_chk check (planned_qty_kg >= 0) not valid,
  add constraint wms_inbound_received_qty_nonnegative_chk check (received_qty_kg is null or received_qty_kg >= 0) not valid;
alter table public.wms_lpns
  add constraint wms_lpn_initial_qty_nonnegative_chk check (qty_initial_kg >= 0) not valid,
  add constraint wms_lpn_current_qty_nonnegative_chk check (qty_current_kg >= 0) not valid;
alter table public.wms_outbound_items
  add constraint wms_outbound_requested_qty_nonnegative_chk check (requested_qty_kg >= 0) not valid,
  add constraint wms_outbound_allocated_qty_nonnegative_chk check (allocated_qty_kg >= 0) not valid;
alter table public.wms_picking_tasks
  add constraint wms_picking_qty_positive_chk check (qty_kg > 0) not valid;
alter table public.wms_stock_movements
  add constraint wms_movement_qty_nonnegative_chk check (qty_kg >= 0) not valid,
  add constraint wms_movement_idempotency_format_chk check (char_length(idempotency_key) between 8 and 200) not valid;
alter table public.wms_cycle_count_lines
  add constraint wms_cycle_expected_qty_nonnegative_chk check (expected_qty_kg >= 0) not valid,
  add constraint wms_cycle_actual_qty_nonnegative_chk check (actual_qty_kg >= 0) not valid;
alter table public.wms_scan_events
  add constraint wms_scan_raw_length_chk check (char_length(raw_value) between 1 and 512) not valid,
  add constraint wms_scan_device_info_size_chk check (octet_length(device_info::text) <= 4096) not valid;
alter table public.wms_sync_queue
  add constraint wms_sync_device_id_length_chk check (char_length(device_id) between 1 and 200) not valid,
  add constraint wms_sync_idempotency_length_chk check (char_length(idempotency_key) between 8 and 200) not valid,
  add constraint wms_sync_payload_size_chk check (octet_length(payload::text) <= 262144) not valid;

-- Replace permissive policies. Membership means an active row in wms_profiles, which
-- prevents users from another application in the shared auth.users pool seeing WMS data.
drop policy if exists wms_roles_read on public.wms_roles;
create policy wms_roles_read on public.wms_roles for select to authenticated
  using (public.wms_is_member());

drop policy if exists wms_profiles_own_read on public.wms_profiles;
drop policy if exists wms_profiles_own_update on public.wms_profiles;
create policy wms_profiles_scoped_read on public.wms_profiles for select to authenticated
  using (id = auth.uid() or public.wms_has_role('Admin') or public.wms_has_role('Supervisor'));
create policy wms_profiles_own_name_update on public.wms_profiles for update to authenticated
  using (id = auth.uid() and is_active = true)
  with check (id = auth.uid() and is_active = true);

create policy wms_user_roles_own_read on public.wms_user_roles for select to authenticated
  using (user_id = auth.uid() or public.wms_has_role('Admin') or public.wms_has_role('Supervisor'));

create policy wms_warehouses_member_read on public.wms_warehouses for select to authenticated
  using (public.wms_is_member() and (public.wms_has_warehouse_access(warehouse_code) or public.wms_has_role('Admin')));
create policy wms_warehouses_admin_write on public.wms_warehouses for all to authenticated
  using (public.wms_has_role('Admin')) with check (public.wms_has_role('Admin'));

drop policy if exists wms_materials_read on public.wms_materials;
create policy wms_materials_member_read on public.wms_materials for select to authenticated
  using (public.wms_is_member() and (is_active or public.wms_has_role('Admin')));

drop policy if exists wms_locations_read on public.wms_locations;
create policy wms_locations_scoped_read on public.wms_locations for select to authenticated
  using (
    public.wms_is_member()
    and (public.wms_has_warehouse_access(warehouse) or public.wms_has_role('Admin'))
    and (is_active or public.wms_has_role('Admin'))
  );

drop policy if exists wms_lots_read on public.wms_lots;
create policy wms_lots_member_read on public.wms_lots for select to authenticated
  using (public.wms_is_member());

drop policy if exists wms_docs_admin_checker_read on public.wms_inbound_documents;
create policy wms_inbound_documents_role_read on public.wms_inbound_documents for select to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Checker') or public.wms_has_role('Supervisor'));
drop policy if exists wms_inbound_items_read on public.wms_inbound_items;
create policy wms_inbound_items_role_read on public.wms_inbound_items for select to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Checker') or public.wms_has_role('Supervisor'));

drop policy if exists wms_lpns_read on public.wms_lpns;
create policy wms_lpns_scoped_read on public.wms_lpns for select to authenticated
  using (
    public.wms_is_member()
    and (
      current_location_id is null
      or exists (
        select 1 from public.wms_locations loc
        where loc.id = current_location_id
          and public.wms_has_warehouse_access(loc.warehouse)
      )
    )
  );

drop policy if exists wms_scan_links_read on public.wms_scan_links;
create policy wms_scan_links_admin_read on public.wms_scan_links for select to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Supervisor'));

drop policy if exists wms_outbound_read on public.wms_outbound_documents;
create policy wms_outbound_role_read on public.wms_outbound_documents for select to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Supervisor') or public.wms_has_role('Checker') or public.wms_has_role('Operator Forklift'));
drop policy if exists wms_outbound_items_read on public.wms_outbound_items;
create policy wms_outbound_items_role_read on public.wms_outbound_items for select to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Supervisor') or public.wms_has_role('Checker') or public.wms_has_role('Operator Forklift'));
drop policy if exists wms_picking_tasks_read on public.wms_picking_tasks;
create policy wms_picking_tasks_role_read on public.wms_picking_tasks for select to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Supervisor') or public.wms_has_role('Operator Forklift'));
drop policy if exists wms_delivery_notes_read on public.wms_delivery_notes;
create policy wms_delivery_notes_role_read on public.wms_delivery_notes for select to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Supervisor') or public.wms_has_role('Checker') or public.wms_has_role('Operator Forklift'));

drop policy if exists wms_stock_movements_read on public.wms_stock_movements;
create policy wms_stock_movements_scoped_read on public.wms_stock_movements for select to authenticated
  using (
    public.wms_is_member()
    and (
      public.wms_has_role('Admin')
      or public.wms_has_role('Supervisor')
      or exists (
        select 1 from public.wms_locations loc
        where loc.id in (from_location_id, to_location_id)
          and public.wms_has_warehouse_access(loc.warehouse)
      )
    )
  );

drop policy if exists wms_scan_events_insert_own on public.wms_scan_events;
revoke insert, update, delete on public.wms_scan_events from authenticated;

drop policy if exists wms_cycle_count_read on public.wms_cycle_count_sessions;
create policy wms_cycle_count_scoped_read on public.wms_cycle_count_sessions for select to authenticated
  using (
    (public.wms_has_role('Supervisor') or public.wms_has_role('Operator Forklift'))
    and (
      scope_location_id is null
      or exists (
        select 1 from public.wms_locations loc
        where loc.id = scope_location_id
          and public.wms_has_warehouse_access(loc.warehouse)
      )
    )
  );

drop policy if exists wms_cycle_count_lines_read on public.wms_cycle_count_lines;
create policy wms_cycle_count_lines_scoped_read on public.wms_cycle_count_lines for select to authenticated
  using (
    (public.wms_has_role('Supervisor') or public.wms_has_role('Operator Forklift'))
    and (
      location_id is null
      or exists (
        select 1 from public.wms_locations loc
        where loc.id = location_id
          and public.wms_has_warehouse_access(loc.warehouse)
      )
    )
  );
drop policy if exists wms_cycle_count_lines_operator_insert on public.wms_cycle_count_lines;
create policy wms_cycle_count_lines_scoped_insert on public.wms_cycle_count_lines for insert to authenticated
  with check (
    (public.wms_has_role('Supervisor') or public.wms_has_role('Operator Forklift'))
    and (
      location_id is null
      or exists (
        select 1 from public.wms_locations loc
        where loc.id = location_id
          and public.wms_has_warehouse_access(loc.warehouse)
      )
    )
  );

drop policy if exists wms_inventory_import_batches_read on public.wms_inventory_import_batches;
create policy wms_inventory_import_batches_role_read on public.wms_inventory_import_batches for select to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Supervisor'));
drop policy if exists wms_inventory_import_lines_read on public.wms_inventory_import_lines;
create policy wms_inventory_import_lines_role_read on public.wms_inventory_import_lines for select to authenticated
  using (public.wms_has_role('Admin') or public.wms_has_role('Supervisor'));

drop policy if exists wms_sync_queue_own on public.wms_sync_queue;
create policy wms_sync_queue_active_member_own on public.wms_sync_queue for all to authenticated
  using (user_id = auth.uid() and public.wms_is_member())
  with check (user_id = auth.uid() and public.wms_is_member());

-- Users may update only their display name. Administrative account changes should use
-- a separately audited server workflow rather than a broad table grant.
revoke update on public.wms_profiles from authenticated;
grant update (full_name) on public.wms_profiles to authenticated;

-- Anonymous users must have no privileges on WMS objects. The prefix filter is
-- essential because this public schema is shared with another Advanta application.
do $$
declare
  object_record record;
begin
  for object_record in
    select n.nspname, c.relname, c.relkind
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname like 'wms\_%' escape '\'
      and c.relkind in ('r', 'p', 'v', 'm', 'S')
  loop
    if object_record.relkind = 'S' then
      execute format('revoke all privileges on sequence %I.%I from anon', object_record.nspname, object_record.relname);
    else
      execute format('revoke all privileges on table %I.%I from anon', object_record.nspname, object_record.relname);
    end if;
  end loop;
end;
$$;

-- SECURITY DEFINER functions are denied by default, then explicitly granted.
revoke execute on function public.wms_is_member() from public, anon, authenticated;
revoke execute on function public.wms_has_role(text) from public, anon, authenticated;
revoke execute on function public.wms_has_warehouse_access(text) from public, anon, authenticated;
revoke execute on function public.wms_extract_scan_token(text) from public, anon, authenticated;
revoke execute on function public.wms_prevent_stock_movement_mutation() from public, anon, authenticated;
revoke execute on function public.wms_apply_stock_movement_to_lpn() from public, anon, authenticated;
revoke execute on function public.wms_resolve_scan_token(text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.wms_putaway_lpn(text, text, text) from public, anon, authenticated;
revoke execute on function public.wms_attach_lpn_label(text) from public, anon, authenticated;

grant execute on function public.wms_is_member() to authenticated;
grant execute on function public.wms_has_role(text) to authenticated;
grant execute on function public.wms_has_warehouse_access(text) to authenticated;
grant execute on function public.wms_resolve_scan_token(text, text, jsonb) to authenticated;
grant execute on function public.wms_putaway_lpn(text, text, text) to authenticated;
grant execute on function public.wms_attach_lpn_label(text) to authenticated;

create or replace function public.wms_resolve_scan_token(
  raw_value text,
  workflow text,
  device_info jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := public.wms_extract_scan_token(raw_value);
  v_link public.wms_scan_links%rowtype;
  v_payload jsonb := '{}'::jsonb;
  v_warehouse text;
begin
  if auth.uid() is null or not public.wms_is_member() then
    raise exception using errcode = '42501', message = 'WMS authentication required';
  end if;
  if raw_value is null or char_length(raw_value) not between 1 and 512 then
    raise exception using errcode = '22023', message = 'Invalid scan value';
  end if;
  if workflow is null or workflow !~ '^[A-Za-z][A-Za-z0-9 _-]{0,63}$' then
    raise exception using errcode = '22023', message = 'Invalid workflow';
  end if;
  if octet_length(coalesce(device_info, '{}'::jsonb)::text) > 4096 then
    raise exception using errcode = '22023', message = 'Device information is too large';
  end if;

  select * into v_link
  from public.wms_scan_links
  where token = v_token and is_active = true;

  if not found then
    insert into public.wms_scan_events (raw_value, token, workflow, action, result, message, user_id, device_info)
    values (raw_value, v_token, workflow, 'resolve', 'failed', 'Token not found or inactive', auth.uid(), coalesce(device_info, '{}'::jsonb));
    return jsonb_build_object('result', 'failed', 'message', 'Token not found or inactive', 'token', v_token);
  end if;

  if v_link.entity_type = 'lpn' then
    select loc.warehouse,
      jsonb_build_object(
        'lpn_code', l.lpn_code,
        'material_code', m.material_code,
        'description', m.long_description,
        'lot_number', l.lot_number,
        'qty_current_kg', l.qty_current_kg,
        'stock_type', l.stock_type,
        'status', l.status,
        'location_code', loc.location_code
      )
    into v_warehouse, v_payload
    from public.wms_lpns l
    join public.wms_materials m on m.id = l.material_id
    left join public.wms_locations loc on loc.id = l.current_location_id
    where l.id = v_link.entity_id;
    if v_warehouse is not null and not public.wms_has_warehouse_access(v_warehouse) then
      raise exception using errcode = '42501', message = 'Warehouse access denied';
    end if;
  elsif v_link.entity_type = 'location' then
    select loc.warehouse,
      jsonb_build_object(
        'location_code', loc.location_code,
        'site', loc.site,
        'warehouse', loc.warehouse,
        'location_type', loc.location_type,
        'is_active', loc.is_active
      )
    into v_warehouse, v_payload
    from public.wms_locations loc
    where loc.id = v_link.entity_id;
    if not public.wms_has_warehouse_access(v_warehouse) then
      raise exception using errcode = '42501', message = 'Warehouse access denied';
    end if;
  else
    v_payload := jsonb_build_object('entity_id', v_link.entity_id);
  end if;

  insert into public.wms_scan_events (
    raw_value, token, entity_type, entity_id, workflow, action, result, message, user_id, device_info
  ) values (
    raw_value, v_token, v_link.entity_type, v_link.entity_id, workflow, 'resolve', 'success',
    'Token resolved', auth.uid(), coalesce(device_info, '{}'::jsonb)
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
set search_path = ''
as $$
declare
  v_existing uuid;
  v_lpn public.wms_lpns%rowtype;
  v_location public.wms_locations%rowtype;
  v_movement_id uuid;
  v_location_load numeric(18,3);
begin
  if auth.uid() is null or not (
    public.wms_has_role('Admin') or public.wms_has_role('Supervisor') or public.wms_has_role('Operator Forklift')
  ) then
    raise exception using errcode = '42501', message = 'Putaway role required';
  end if;
  if idempotency_key is null or char_length(idempotency_key) not between 8 and 200 then
    raise exception using errcode = '22023', message = 'Invalid idempotency key';
  end if;

  select sm.id into v_existing
  from public.wms_stock_movements sm
  where sm.idempotency_key = wms_putaway_lpn.idempotency_key;
  if v_existing is not null then return v_existing; end if;

  select l.* into v_lpn
  from public.wms_lpns l
  join public.wms_scan_links sl on sl.entity_id = l.id and sl.entity_type = 'lpn'
  where sl.token = public.wms_extract_scan_token(lpn_token)
    and sl.is_active = true
  for update;
  if not found then raise exception 'LPN token not found or inactive'; end if;
  if v_lpn.status not in ('received', 'label_printed') then
    raise exception 'LPN status % cannot be putaway', v_lpn.status;
  end if;

  select loc.* into v_location
  from public.wms_locations loc
  left join public.wms_scan_links sl on sl.entity_id = loc.id and sl.entity_type = 'location'
  where (sl.token = public.wms_extract_scan_token(location_token)
      or loc.location_code = public.wms_extract_scan_token(location_token))
    and loc.is_active = true
    and loc.location_type in ('storage', 'quarantine')
  limit 1
  for update of loc;
  if not found then raise exception 'Storage location token not found or inactive'; end if;
  if not public.wms_has_warehouse_access(v_location.warehouse) then
    raise exception using errcode = '42501', message = 'Warehouse access denied';
  end if;

  if v_location.capacity_kg is not null then
    select coalesce(sum(l.qty_current_kg), 0) into v_location_load
    from public.wms_lpns l
    where l.current_location_id = v_location.id
      and l.id <> v_lpn.id
      and not l.is_void
      and l.status not in ('shipped', 'closed', 'void');
    if v_location_load + v_lpn.qty_current_kg > v_location.capacity_kg then
      raise exception 'Location capacity exceeded';
    end if;
  end if;

  insert into public.wms_stock_movements (
    transaction_type, material_id, lpn_id, qty_kg, movement_qty_kg,
    from_location_id, to_location_id, reference_type, idempotency_key, created_by
  ) values (
    'Putaway', v_lpn.material_id, v_lpn.id, v_lpn.qty_current_kg, 0,
    v_lpn.current_location_id, v_location.id, 'putaway', idempotency_key, auth.uid()
  ) returning id into v_movement_id;

  update public.wms_lpns
  set current_location_id = v_location.id, status = 'available'
  where id = v_lpn.id;

  return v_movement_id;
end;
$$;

create or replace function public.wms_attach_lpn_label(lpn_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lpn_id uuid;
begin
  if auth.uid() is null or not (public.wms_has_role('Admin') or public.wms_has_role('Checker')) then
    raise exception using errcode = '42501', message = 'Receiving role required';
  end if;

  select l.id into v_lpn_id
  from public.wms_lpns l
  join public.wms_scan_links sl on sl.entity_id = l.id and sl.entity_type = 'lpn'
  where sl.token = public.wms_extract_scan_token(lpn_token)
    and sl.is_active = true
  for update;
  if not found then raise exception 'LPN token not found'; end if;

  update public.wms_lpns
  set status = 'received'
  where id = v_lpn_id and status in ('draft', 'label_printed')
  returning id into v_lpn_id;
  if not found then raise exception 'LPN is not ready for label attachment'; end if;

  insert into public.wms_scan_events (
    raw_value, token, entity_type, entity_id, workflow, action, result, message, user_id
  ) values (
    lpn_token, public.wms_extract_scan_token(lpn_token), 'lpn', v_lpn_id,
    'receiving', 'attach_label', 'success', 'Label attached', auth.uid()
  );

  return v_lpn_id;
end;
$$;

create or replace function public.wms_dashboard_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null or not public.wms_is_member() then
    raise exception using errcode = '42501', message = 'WMS authentication required';
  end if;

  with accessible_lpns as (
    select l.*
    from public.wms_lpns l
    left join public.wms_locations loc on loc.id = l.current_location_id
    where l.current_location_id is null
       or public.wms_has_warehouse_access(loc.warehouse)
  ), accessible_movements as (
    select sm.*
    from public.wms_stock_movements sm
    left join public.wms_locations source_loc on source_loc.id = sm.from_location_id
    left join public.wms_locations target_loc on target_loc.id = sm.to_location_id
    where public.wms_has_role('Admin')
       or public.wms_has_role('Supervisor')
       or public.wms_has_warehouse_access(source_loc.warehouse)
       or public.wms_has_warehouse_access(target_loc.warehouse)
  )
  select jsonb_build_object(
    'totalStockKg', coalesce((select sum(qty_current_kg) from accessible_lpns where not is_void and status not in ('shipped', 'closed', 'void')), 0),
    'availableStockKg', coalesce((select sum(qty_current_kg) from accessible_lpns where not is_void and status = 'available'), 0),
    'activeLpnCount', (select count(*) from accessible_lpns where not is_void and status = 'available'),
    'inboundKg', coalesce((select sum(abs(movement_qty_kg)) from accessible_movements where transaction_type = 'Inbound'), 0),
    'outboundKg', coalesce((select sum(abs(movement_qty_kg)) from accessible_movements where transaction_type = 'Outbound'), 0),
    'movementCount', (select count(*) from accessible_movements),
    'materialCount', (select count(*) from public.wms_materials where is_active),
    'locationCount', (select count(*) from public.wms_locations loc where is_active and public.wms_has_warehouse_access(loc.warehouse))
  ) into v_result;

  return v_result;
end;
$$;

-- CREATE OR REPLACE restores PUBLIC execute in some deployment workflows; enforce grants last.
revoke execute on function public.wms_resolve_scan_token(text, text, jsonb) from public, anon;
revoke execute on function public.wms_putaway_lpn(text, text, text) from public, anon;
revoke execute on function public.wms_attach_lpn_label(text) from public, anon;
revoke execute on function public.wms_dashboard_metrics() from public, anon;
grant execute on function public.wms_resolve_scan_token(text, text, jsonb) to authenticated;
grant execute on function public.wms_putaway_lpn(text, text, text) to authenticated;
grant execute on function public.wms_attach_lpn_label(text) to authenticated;
grant execute on function public.wms_dashboard_metrics() to authenticated;

commit;
