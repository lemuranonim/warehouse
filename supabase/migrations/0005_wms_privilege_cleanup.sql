begin;

-- Supabase may grant broad table privileges to API roles through database-level
-- defaults. RLS protects row operations, but it does not protect TRUNCATE and
-- should not be the only barrier against schema-adjacent privileges. Normalize
-- every WMS relation after all feature tables and views have been created.
do $$
declare
  object_record record;
begin
  for object_record in
    select n.nspname, c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname like 'wms\_%' escape '\'
      and c.relkind in ('r', 'p', 'v', 'm')
  loop
    execute format(
      'revoke all privileges on table %I.%I from public, anon',
      object_record.nspname,
      object_record.relname
    );

    execute format(
      'revoke truncate, references, trigger on table %I.%I from authenticated',
      object_record.nspname,
      object_record.relname
    );

    if object_record.relname not in ('wms_profiles', 'wms_sync_queue') then
      execute format(
        'revoke insert, update, delete on table %I.%I from authenticated',
        object_record.nspname,
        object_record.relname
      );
    end if;
  end loop;

  for object_record in
    select n.nspname, c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname like 'wms\_%' escape '\'
      and c.relkind = 'S'
  loop
    execute format(
      'revoke all privileges on sequence %I.%I from public, anon, authenticated',
      object_record.nspname,
      object_record.relname
    );
  end loop;
end;
$$;

-- A member may edit only their own display name (RLS in migration 0003).
revoke insert, update, delete on public.wms_profiles from authenticated;
grant update (full_name) on public.wms_profiles to authenticated;

-- These are strictly internal to SECURITY DEFINER workflow functions.
revoke all privileges on table public.wms_operation_keys
  from public, anon, authenticated;
revoke all privileges on table public.wms_action_rate_limits
  from public, anon, authenticated;

commit;
