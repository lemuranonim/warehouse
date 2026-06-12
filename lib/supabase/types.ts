export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      materials: {
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
        Update: Partial<Database["public"]["Tables"]["materials"]["Insert"]>;
      };
      locations: {
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
        Update: Partial<Database["public"]["Tables"]["locations"]["Insert"]>;
      };
      lpns: {
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
        Update: Partial<Database["public"]["Tables"]["lpns"]["Insert"]>;
      };
      stock_movements: {
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
      scan_links: {
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
        Update: Partial<Pick<Database["public"]["Tables"]["scan_links"]["Insert"], "is_active">>;
      };
      scan_events: {
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
      current_stock_view: {
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
    };
    Functions: {
      resolve_scan_token: {
        Args: { raw_value: string; workflow: string; device_info?: Json };
        Returns: Json;
      };
      putaway_lpn: {
        Args: { lpn_token: string; location_token: string; idempotency_key: string };
        Returns: string;
      };
    };
  };
};
