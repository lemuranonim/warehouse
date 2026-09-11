export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
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
        };
        Update: Partial<Database["public"]["Tables"]["wms_inbound_items"]["Insert"]>;
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
        };
        Update: Partial<Database["public"]["Tables"]["wms_outbound_documents"]["Insert"]>;
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
        };
        Update: Partial<Database["public"]["Tables"]["wms_delivery_notes"]["Insert"]>;
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
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wms_inventory_import_batches"]["Insert"]>;
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
      };
      wms_locations: {
        Row: {
          id: string;
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
      };
      wms_lpns: {
        Row: {
          id: string;
          lpn_code: string;
          material_id: string;
          lot_number: string;
          qty_initial_kg: number;
          qty_current_kg: number;
          current_location_id: string | null;
          stock_type: string;
          status: string;
          is_void: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          lpn_code: string;
          material_id: string;
          lot_number: string;
          qty_initial_kg?: number;
          qty_current_kg?: number;
          current_location_id?: string | null;
          stock_type?: string;
          status?: string;
          is_void?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wms_lpns"]["Insert"]>;
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
    };
  };
};
