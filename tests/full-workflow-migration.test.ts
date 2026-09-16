import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(join(process.cwd(), "supabase", "migrations", "0004_full_workflow_realtime.sql"), "utf8").toLowerCase();
const privilegeCleanup = readFileSync(join(process.cwd(), "supabase", "migrations", "0005_wms_privilege_cleanup.sql"), "utf8").toLowerCase();
const upsertFix = readFileSync(join(process.cwd(), "supabase", "migrations", "0006_fix_master_upsert_conflicts.sql"), "utf8").toLowerCase();

describe("full workflow realtime migration", () => {
  it("covers every transactional workflow with server-side RPCs", () => {
    for (const name of [
      "wms_create_inbound", "wms_receive_inbound_item", "wms_create_outbound",
      "wms_allocate_outbound", "wms_pick_task", "wms_stage_task",
      "wms_create_delivery_note", "wms_dispatch_outbound", "wms_open_cycle_count",
      "wms_submit_cycle_count", "wms_review_cycle_count", "wms_request_adjustment",
      "wms_review_adjustment", "wms_import_material_master", "wms_stage_inventory_batch", "wms_post_inventory_batch",
    ]) expect(migration).toContain(`function public.${name}`);
  });

  it("pins the search path on every privileged workflow function", () => {
    const headers = migration.split("create or replace function").slice(1).map(definition => definition.split("as $$")[0]);
    const privileged = headers.filter(header => header.includes("security definer"));
    expect(privileged.length).toBeGreaterThan(15);
    expect(privileged.every(header => header.includes("set search_path = ''"))).toBe(true);
  });

  it("uses idempotency, append-only movements, audit, and realtime publication", () => {
    expect(migration).toContain("wms_operation_keys");
    expect(migration).toContain("wms_record_audit");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("alter publication supabase_realtime add table");
    expect(migration).toContain("content_hash");
  });

  it("rate-limits authenticated workflow mutations without exposing the counter table", () => {
    expect(migration).toContain("function public.wms_check_rate_limit");
    expect(migration).toContain("wms_check_rate_limit('workflow_mutation', 120, 60)");
    expect(migration).toContain("alter table public.wms_action_rate_limits enable row level security");
    expect(migration).toContain("revoke all on public.wms_action_rate_limits from public, anon, authenticated");
    expect(migration).toContain("'public.wms_check_rate_limit(text,integer,integer)'");
  });

  it("does not grant direct mutation rights to browser users", () => {
    expect(migration).toContain("revoke insert, update, delete on public.wms_adjustment_requests from authenticated");
    expect(migration).toContain("revoke insert, update, delete on table public.%i from authenticated");
    expect(migration).toContain("drop policy if exists wms_materials_admin_write");
    expect(migration).toContain("revoke all on public.wms_operation_keys from public, anon, authenticated");
    expect(migration).toContain("revoke execute on function %s from public, anon, authenticated");
  });

  it("removes inherited API privileges that are not protected by RLS", () => {
    expect(privilegeCleanup).toContain("revoke all privileges on table %i.%i from public, anon");
    expect(privilegeCleanup).toContain("revoke truncate, references, trigger on table %i.%i from authenticated");
    expect(privilegeCleanup).toContain("revoke insert, update, delete on table %i.%i from authenticated");
    expect(privilegeCleanup).toContain("not in ('wms_profiles', 'wms_sync_queue')");
    expect(privilegeCleanup).toContain("grant update (full_name) on public.wms_profiles to authenticated");
  });

  it("uses explicit unique constraints for master-data upserts", () => {
    expect(upsertFix).toContain("on conflict on constraint wms_warehouses_warehouse_code_key");
    expect(upsertFix).toContain("on conflict on constraint wms_locations_location_code_key");
    expect(upsertFix).toContain("on conflict on constraint wms_materials_material_code_key");
    expect(upsertFix.match(/set search_path = ''/g)).toHaveLength(3);
  });
});
