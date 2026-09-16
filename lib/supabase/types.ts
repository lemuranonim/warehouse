export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      wms_roles: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wms_roles"]["Insert"]>;
        Relationships: [];
      };
      wms_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          default_warehouse: string | null;
          warehouse_scope: string[];
          email: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          default_warehouse?: string | null;
          warehouse_scope?: string[];
          email?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wms_profiles"]["Insert"]>;
        Relationships: [];
      };
      wms_user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wms_user_roles"]["Insert"]>;
        Relationships: [];
      };
      wms_inbound_documents: {
        Row: {
          id: string;
          doc_no: string;
          sender: string | null;
          status: string;
          received_at: string | null;
          created_by: string | null;
          created_at: string;
          document_date: string | null;
          do_no: string | null;
          destination: string | null;
          address: string | null;
          truck_id: string | null;
          prepared_by_name: string | null;
          source_file: string | null;
          form_document_no: string | null;
          edition_no: string | null;
          revision_no: string | null;
          effective_date: string | null;
        };
        Insert: {
          id?: string;
          doc_no: string;
          sender?: string | null;
          status?: string;
          received_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          document_date?: string | null;
          do_no?: string | null;
          destination?: string | null;
          address?: string | null;
          truck_id?: string | null;
          prepared_by_name?: string | null;
          source_file?: string | null;
          form_document_no?: string | null;
          edition_no?: string | null;
          revision_no?: string | null;
          effective_date?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["wms_inbound_documents"]["Insert"]>;
        Relationships: [];
      };
      wms_inbound_items: {
        Row: {
          id: string;
          inbound_doc_id: string;
          material_id: string;
          lot_id: string | null;
          lot_number: string;
          planned_qty_kg: number;
          received_qty_kg: number | null;
          status: string;
          created_at: string;
          line_no: number | null;
          source_description: string | null;
          uom: string;
          remark: string | null;
          exp_date: string | null;
          stock_type: string;
        };
        Insert: {
          id?: string;
          inbound_doc_id: string;
          material_id: string;
          lot_id?: string | null;
          lot_number: string;
          planned_qty_kg: number;
          received_qty_kg?: number | null;
          status?: string;
          created_at?: string;
          line_no?: number | null;
          source_description?: string | null;
          uom?: string;
          remark?: string | null;
          exp_date?: string | null;
          stock_type?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wms_inbound_items"]["Insert"]>;
        Relationships: [];
      };
      wms_outbound_documents: {
        Row: {
          id: string;
          doc_no: string;
          destination: string | null;
          status: string;
          requested_by: string | null;
          created_at: string;
          document_date: string | null;
          do_no: string | null;
          origin: string | null;
          address: string | null;
          truck_id: string | null;
          prepared_by_name: string | null;
          source_file: string | null;
          shipped_at: string | null;
        };
        Insert: {
          id?: string;
          doc_no: string;
          destination?: string | null;
          status?: string;
          requested_by?: string | null;
          created_at?: string;
          document_date?: string | null;
          do_no?: string | null;
          origin?: string | null;
          address?: string | null;
          truck_id?: string | null;
          prepared_by_name?: string | null;
          source_file?: string | null;
          shipped_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["wms_outbound_documents"]["Insert"]>;
        Relationships: [];
      };
      wms_outbound_items: {
        Row: {
          id: string;
          outbound_doc_id: string;
          material_id: string;
          lot_id: string | null;
          lot_number: string | null;
          requested_qty_kg: number;
          allocated_qty_kg: number;
          status: string;
          created_at: string;
          line_no: number | null;
          source_description: string | null;
          uom: string;
          remark: string | null;
        };
        Insert: {
          id?: string;
          outbound_doc_id: string;
          material_id: string;
          lot_id?: string | null;
          lot_number?: string | null;
          requested_qty_kg: number;
          allocated_qty_kg?: number;
          status?: string;
          created_at?: string;
          line_no?: number | null;
          source_description?: string | null;
          uom?: string;
          remark?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["wms_outbound_items"]["Insert"]>;
        Relationships: [];
      };
      wms_delivery_notes: {
        Row: {
          id: string;
          outbound_doc_id: string;
          dn_no: string;
          status: string;
          created_by: string | null;
          created_at: string;
          document_date: string | null;
          origin: string | null;
          destination: string | null;
          address: string | null;
          truck_id: string | null;
          prepared_by_name: string | null;
          source_file: string | null;
          form_document_no: string | null;
          edition_no: string | null;
          revision_no: string | null;
          effective_date: string | null;
          shipped_at: string | null;
        };
        Insert: {
          id?: string;
          outbound_doc_id: string;
          dn_no: string;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          document_date?: string | null;
          origin?: string | null;
          destination?: string | null;
          address?: string | null;
          truck_id?: string | null;
          prepared_by_name?: string | null;
          source_file?: string | null;
          form_document_no?: string | null;
          edition_no?: string | null;
          revision_no?: string | null;
          effective_date?: string | null;
          shipped_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["wms_delivery_notes"]["Insert"]>;
        Relationships: [];
      };
      wms_document_signoffs: {
        Row: {
          id: string;
          inbound_document_id: string | null;
          delivery_note_id: string | null;
          signoff_role: string;
          signer_name: string | null;
          signed_date: string | null;
          signature_asset_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inbound_document_id?: string | null;
          delivery_note_id?: string | null;
          signoff_role: string;
          signer_name?: string | null;
          signed_date?: string | null;
          signature_asset_path?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wms_document_signoffs"]["Insert"]>;
        Relationships: [];
      };
      wms_inventory_import_batches: {
        Row: {
          id: string;
          source_file: string;
          source_sheet: string;
          source_kind: string;
          warehouse: string | null;
          source_date: string | null;
          row_count: number;
          status: string;
          imported_by: string | null;
          content_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_file: string;
          source_sheet: string;
          source_kind?: string;
          warehouse?: string | null;
          source_date?: string | null;
          row_count?: number;
          status?: string;
          imported_by?: string | null;
          content_hash?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wms_inventory_import_batches"]["Insert"]>;
        Relationships: [];
      };
      wms_inventory_import_lines: {
        Row: {
          id: string;
          batch_id: string;
          source_row: number;
          stock_date: string | null;
          material_id: string | null;
          material_code: string;
          material_description: string | null;
          hybrid: string | null;
          stage: string | null;
          flagging: string | null;
          lot_number: string;
          qty_kg: number;
          warehouse: string;
          material_type: string | null;
          product: string | null;
          crop: string | null;
          inventory_status: string | null;
          return_classification: string | null;
          ageing_days: number | null;
          sap_qty_kg: number | null;
          note: string | null;
          remark: string | null;
          source_hash: string | null;
          validation_result: string;
          validation_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          batch_id: string;
          source_row: number;
          stock_date?: string | null;
          material_id?: string | null;
          material_code: string;
          material_description?: string | null;
          hybrid?: string | null;
          stage?: string | null;
          flagging?: string | null;
          lot_number: string;
          qty_kg: number;
          warehouse: string;
          material_type?: string | null;
          product?: string | null;
          crop?: string | null;
          inventory_status?: string | null;
          return_classification?: string | null;
          ageing_days?: number | null;
          sap_qty_kg?: number | null;
          note?: string | null;
          remark?: string | null;
          source_hash?: string | null;
          validation_result?: string;
          validation_message?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wms_inventory_import_lines"]["Insert"]>;
        Relationships: [];
      };
      wms_materials: {
        Row: {
          id: string;
          material_code: string;
          long_description: string;
          hybrid: string | null;
          stage: string | null;
          flagging: string | null;
          type: string | null;
          product: string | null;
          crop: string | null;
          status: string;
          order_unit: string | null;
          standard_package_kg: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_code: string;
          long_description: string;
          hybrid?: string | null;
          stage?: string | null;
          flagging?: string | null;
          type?: string | null;
          product?: string | null;
          crop?: string | null;
          status?: string;
          order_unit?: string | null;
          standard_package_kg?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wms_materials"]["Insert"]>;
        Relationships: [];
      };
      wms_warehouses: {
        Row: { id: string; warehouse_code: string; name: string; site: string | null; is_active: boolean; created_at: string };
        Insert: { id?: string; warehouse_code: string; name: string; site?: string | null; is_active?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["wms_warehouses"]["Insert"]>;
        Relationships: [];
      };
      wms_stock_types: {
        Row: { code: string; label: string; description: string | null; color: string; is_active: boolean; created_at: string };
        Insert: { code: string; label: string; description?: string | null; color?: string; is_active?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["wms_stock_types"]["Insert"]>;
        Relationships: [];
      };
      wms_locations: {
        Row: {
          id: string;
          warehouse_id: string | null;
          location_code: string;
          site: string | null;
          warehouse: string | null;
          room: string | null;
          aisle: string | null;
          rack: string | null;
          level: string | null;
          bin: string | null;
          location_type: string;
          capacity_kg: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          warehouse_id?: string | null;
          location_code: string;
          site?: string | null;
          warehouse?: string | null;
          room?: string | null;
          aisle?: string | null;
          rack?: string | null;
          level?: string | null;
          bin?: string | null;
          location_type?: string;
          capacity_kg?: number | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wms_locations"]["Insert"]>;
        Relationships: [];
      };
      wms_lpns: {
        Row: {
          id: string;
          lpn_code: string;
          material_id: string;
          lot_id: string | null;
          lot_number: string;
          batch_rename: string | null;
          exp_date: string | null;
          qty_initial_kg: number;
          qty_current_kg: number;
          current_location_id: string | null;
          stock_type: string;
          status: string;
          inbound_doc_id: string | null;
          is_void: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          lpn_code: string;
          material_id: string;
          lot_id?: string | null;
          lot_number: string;
          batch_rename?: string | null;
          exp_date?: string | null;
          qty_initial_kg?: number;
          qty_current_kg?: number;
          current_location_id?: string | null;
          stock_type?: string;
          status?: string;
          inbound_doc_id?: string | null;
          is_void?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wms_lpns"]["Insert"]>;
        Relationships: [];
      };
      wms_lots: {
        Row: { id: string; material_id: string; lot_number: string; stock_type: string; exp_date: string | null; created_at: string };
        Insert: { id?: string; material_id: string; lot_number: string; stock_type?: string; exp_date?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["wms_lots"]["Insert"]>;
        Relationships: [];
      };
      wms_picking_tasks: {
        Row: { id: string; outbound_item_id: string; lpn_id: string; from_location_id: string | null; qty_kg: number; status: string; assigned_to: string | null; created_at: string; picked_lpn_id: string | null; picked_at: string | null; staged_at: string | null };
        Insert: { id?: string; outbound_item_id: string; lpn_id: string; from_location_id?: string | null; qty_kg: number; status?: string; assigned_to?: string | null; created_at?: string; picked_lpn_id?: string | null; picked_at?: string | null; staged_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["wms_picking_tasks"]["Insert"]>;
        Relationships: [];
      };
      wms_cycle_count_sessions: {
        Row: { id: string; scope_location_id: string | null; status: string; opened_by: string | null; opened_at: string; closed_at: string | null };
        Insert: { id?: string; scope_location_id?: string | null; status?: string; opened_by?: string | null; opened_at?: string; closed_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["wms_cycle_count_sessions"]["Insert"]>;
        Relationships: [];
      };
      wms_cycle_count_lines: {
        Row: { id: string; session_id: string; location_id: string | null; lpn_id: string | null; expected_qty_kg: number; actual_qty_kg: number; variance_qty_kg: number; status: string; counted_by: string | null; counted_at: string; is_counted: boolean; reviewed_by: string | null; reviewed_at: string | null };
        Insert: { id?: string; session_id: string; location_id?: string | null; lpn_id?: string | null; expected_qty_kg?: number; actual_qty_kg?: number; status?: string; counted_by?: string | null; counted_at?: string; is_counted?: boolean; reviewed_by?: string | null; reviewed_at?: string | null };
        Update: Partial<Database["public"]["Tables"]["wms_cycle_count_lines"]["Insert"]>;
        Relationships: [];
      };
      wms_adjustment_requests: {
        Row: { id: string; lpn_id: string; qty_before_kg: number; qty_after_kg: number; reason_code: string; note: string | null; status: string; submitted_by: string; reviewed_by: string | null; reviewed_at: string | null; created_at: string };
        Insert: { id?: string; lpn_id: string; qty_before_kg: number; qty_after_kg: number; reason_code: string; note?: string | null; status?: string; submitted_by: string; reviewed_by?: string | null; reviewed_at?: string | null; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["wms_adjustment_requests"]["Insert"]>;
        Relationships: [];
      };
      wms_audit_log: {
        Row: { id: number; occurred_at: string; user_id: string | null; action: string; entity_type: string; entity_id: string | null; before_data: Json | null; after_data: Json | null; request_id: string | null; metadata: Json };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      wms_stock_movements: {
        Row: {
          id: string;
          movement_date: string;
          transaction_type: string;
          material_id: string;
          lpn_id: string | null;
          qty_kg: number;
          movement_qty_kg: number;
          from_location_id: string | null;
          to_location_id: string | null;
          reference_type: string | null;
          reference_id: string | null;
          idempotency_key: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          movement_date?: string;
          transaction_type: string;
          material_id: string;
          lpn_id?: string | null;
          qty_kg?: number;
          movement_qty_kg?: number;
          from_location_id?: string | null;
          to_location_id?: string | null;
          reference_type?: string | null;
          reference_id?: string | null;
          idempotency_key: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      wms_scan_links: {
        Row: {
          id: string;
          token: string;
          entity_type: string;
          entity_id: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          token: string;
          entity_type: string;
          entity_id: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Pick<Database["public"]["Tables"]["wms_scan_links"]["Insert"], "is_active">>;
        Relationships: [];
      };
      wms_scan_events: {
        Row: {
          id: string;
          scanned_at: string;
          raw_value: string;
          token: string | null;
          entity_type: string | null;
          entity_id: string | null;
          workflow: string;
          action: string | null;
          result: string;
          message: string | null;
          user_id: string | null;
          device_info: Json;
        };
        Insert: {
          id?: string;
          scanned_at?: string;
          raw_value: string;
          token?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          workflow: string;
          action?: string | null;
          result: string;
          message?: string | null;
          user_id?: string | null;
          device_info?: Json;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      wms_current_stock_view: {
        Row: {
          lpn_code: string;
          material_code: string;
          material_description: string;
          lot_number: string;
          current_location: string | null;
          stock_type: string;
          qty_current_kg: number;
          status: string;
          last_update: string | null;
        };
        Relationships: [];
      };
      wms_inventory_snapshot_reconciliation_view: {
        Row: {
          id: string;
          batch_id: string;
          source_file: string;
          source_sheet: string;
          source_row: number;
          stock_date: string | null;
          material_code: string;
          material_description: string | null;
          lot_number: string;
          warehouse: string;
          snapshot_qty_kg: number;
          wms_qty_kg: number;
          variance_qty_kg: number;
          validation_result: string;
          validation_message: string | null;
        };
        Relationships: [];
      };
      wms_inventory_detail_view: {
        Row: { lpn_id: string; lpn_code: string; material_id: string; material_code: string; material_description: string; lot_id: string | null; lot_number: string; exp_date: string | null; current_location_id: string | null; current_location: string | null; warehouse: string | null; stock_type: string; qty_current_kg: number; status: string; inbound_doc_id: string | null; is_void: boolean; created_at: string; scan_token: string | null };
        Relationships: [];
      };
    };
    Functions: {
      wms_resolve_scan_token: {
        Args: { raw_value: string; workflow: string; device_info?: Json };
        Returns: Json;
      };
      wms_putaway_lpn: {
        Args: { lpn_token: string; location_token: string; idempotency_key: string };
        Returns: string;
      };
      wms_attach_lpn_label: {
        Args: { lpn_token: string };
        Returns: string;
      };
      wms_dashboard_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      wms_upsert_warehouse: { Args: { warehouse_code: string; warehouse_name: string; site_name?: string | null; active?: boolean }; Returns: string };
      wms_upsert_location: { Args: { location_code: string; warehouse_code: string; location_type: string; capacity_kg?: number | null; site_name?: string | null; room_name?: string | null; aisle_name?: string | null; rack_name?: string | null; level_name?: string | null; bin_name?: string | null; active?: boolean }; Returns: string };
      wms_upsert_material: { Args: { material_code: string; material_description: string; hybrid_name?: string | null; stage_name?: string | null; flagging_name?: string | null; material_type?: string | null; product_name?: string | null; crop_name?: string | null; material_status?: string | null; order_unit_name?: string | null; package_kg?: number; active?: boolean }; Returns: string };
      wms_upsert_stock_type: { Args: { stock_code: string; stock_label: string; stock_description?: string | null; stock_color?: string; active?: boolean }; Returns: string };
      wms_set_profile_access: { Args: { user_email: string; profile_name: string; role_name: string; default_warehouse_code?: string | null; warehouse_codes?: string[]; active?: boolean }; Returns: string };
      wms_create_inbound: { Args: { doc_no: string; sender_name?: string | null; document_date?: string | null; destination_name?: string | null; items: Json; idempotency_key: string }; Returns: string };
      wms_receive_inbound_item: { Args: { inbound_item_id: string; actual_qty_kg: number; lpn_code?: string | null; idempotency_key?: string | null }; Returns: string };
      wms_create_outbound: { Args: { doc_no: string; destination_name?: string | null; document_date?: string | null; origin_name?: string | null; items: Json; idempotency_key: string }; Returns: string };
      wms_allocate_outbound: { Args: { outbound_document_id: string; idempotency_key: string }; Returns: string };
      wms_pick_task: { Args: { picking_task_id: string; idempotency_key: string }; Returns: string };
      wms_stage_task: { Args: { picking_task_id: string; staging_location_code: string; idempotency_key: string }; Returns: string };
      wms_create_delivery_note: { Args: { outbound_document_id: string; delivery_note_no: string; idempotency_key: string }; Returns: string };
      wms_dispatch_outbound: { Args: { outbound_document_id: string; idempotency_key: string }; Returns: string };
      wms_open_cycle_count: { Args: { location_id: string }; Returns: string };
      wms_submit_cycle_count: { Args: { cycle_count_line_id: string; actual_qty_kg: number }; Returns: string };
      wms_review_cycle_count: { Args: { cycle_count_session_id: string; approve: boolean; idempotency_key: string }; Returns: string };
      wms_request_adjustment: { Args: { lpn_token: string; target_qty_kg: number; reason_code: string; note?: string | null }; Returns: string };
      wms_review_adjustment: { Args: { adjustment_request_id: string; approve: boolean; idempotency_key: string }; Returns: string };
      wms_import_material_master: { Args: { source_file_name: string; source_sheet_name: string; file_content_hash: string; rows_payload: Json }; Returns: string };
      wms_stage_inventory_batch: { Args: { source_file_name: string; source_sheet_name: string; warehouse_name: string; snapshot_date: string | null; file_content_hash: string; rows_payload: Json }; Returns: string };
      wms_post_inventory_batch: { Args: { inventory_batch_id: string; idempotency_key: string }; Returns: string };
    };
    Enums: Record<PropertyKey, never>;
    CompositeTypes: Record<PropertyKey, never>;
  };
};
