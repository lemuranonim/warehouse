begin;

-- PostgreSQL treats ON CONFLICT column names as ambiguous when a PL/pgSQL input
-- parameter has the same name. Use explicit unique constraints so the admin
-- master-data RPCs work in production without changing their public signatures.
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
  on conflict on constraint wms_warehouses_warehouse_code_key do update set
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
  on conflict on constraint wms_locations_location_code_key do update set
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
  on conflict on constraint wms_materials_material_code_key do update set
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

commit;
