-- Keep authorization and recent operational lists fast as WMS volume grows.
begin;

create or replace function public.wms_current_access()
returns table (
  user_id uuid,
  email text,
  full_name text,
  default_warehouse text,
  warehouse_scope text[],
  roles text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profile.id,
    profile.email,
    profile.full_name,
    profile.default_warehouse,
    profile.warehouse_scope,
    array_agg(distinct role.name order by role.name)
  from public.wms_profiles as profile
  join public.wms_user_roles as assignment on assignment.user_id = profile.id
  join public.wms_roles as role on role.id = assignment.role_id
  where profile.id = auth.uid()
    and profile.is_active = true
  group by
    profile.id,
    profile.email,
    profile.full_name,
    profile.default_warehouse,
    profile.warehouse_scope;
$$;

revoke all on function public.wms_current_access() from public, anon;
grant execute on function public.wms_current_access() to authenticated;

-- These indexes support the newest-first operational screens without scanning
-- the full history once documents, scans, movements, and audits become large.
create index if not exists wms_inbound_documents_created_at_idx
  on public.wms_inbound_documents(created_at desc);
create index if not exists wms_inbound_items_created_at_idx
  on public.wms_inbound_items(created_at desc);
create index if not exists wms_outbound_documents_created_at_idx
  on public.wms_outbound_documents(created_at desc);
create index if not exists wms_outbound_items_created_at_idx
  on public.wms_outbound_items(created_at desc);
create index if not exists wms_picking_tasks_created_at_idx
  on public.wms_picking_tasks(created_at desc);
create index if not exists wms_picking_tasks_status_created_at_idx
  on public.wms_picking_tasks(status, created_at desc);
create index if not exists wms_delivery_notes_created_at_idx
  on public.wms_delivery_notes(created_at desc);
create index if not exists wms_stock_movements_movement_date_idx
  on public.wms_stock_movements(movement_date desc);
create index if not exists wms_scan_events_scanned_at_idx
  on public.wms_scan_events(scanned_at desc);
create index if not exists wms_cycle_count_sessions_opened_at_idx
  on public.wms_cycle_count_sessions(opened_at desc);
create index if not exists wms_cycle_count_lines_counted_at_idx
  on public.wms_cycle_count_lines(counted_at desc);
create index if not exists wms_inventory_import_batches_created_at_idx
  on public.wms_inventory_import_batches(created_at desc);
create index if not exists wms_audit_log_occurred_at_idx
  on public.wms_audit_log(occurred_at desc);

-- Master stock types and append-only audit entries are also visible live on
-- their own screens. Add them once without disturbing an existing publication.
do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['wms_stock_types', 'wms_audit_log']
    loop
      if not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end;
$$;

commit;
