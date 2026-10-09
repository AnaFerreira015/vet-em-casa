export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string;
          ends_at: string | null;
          id: string;
          pet_id: string;
          rescheduled_from: string | null;
          service: Database["public"]["Enums"]["service_type"];
          starts_at: string;
          status: Database["public"]["Enums"]["appointment_status"];
          tutor_id: string;
          tutor_notes: string | null;
          vet_notes: string | null;
        };
        Insert: {
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          pet_id: string;
          rescheduled_from?: string | null;
          service: Database["public"]["Enums"]["service_type"];
          starts_at: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          tutor_id: string;
          tutor_notes?: string | null;
          vet_notes?: string | null;
        };
        Update: {
          created_at?: string;
          ends_at?: string | null;
          id?: string;
          pet_id?: string;
          rescheduled_from?: string | null;
          service?: Database["public"]["Enums"]["service_type"];
          starts_at?: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          tutor_id?: string;
          tutor_notes?: string | null;
          vet_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_pet_id_fkey";
            columns: ["pet_id"];
            isOneToOne: false;
            referencedRelation: "pets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          content: Json;
          id: string;
          issued_at: string;
          kind: string;
          pdf_path: string | null;
          pet_id: string;
        };
        Insert: {
          content?: Json;
          id?: string;
          issued_at?: string;
          kind: string;
          pdf_path?: string | null;
          pet_id: string;
        };
        Update: {
          content?: Json;
          id?: string;
          issued_at?: string;
          kind?: string;
          pdf_path?: string | null;
          pet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_pet_id_fkey";
            columns: ["pet_id"];
            isOneToOne: false;
            referencedRelation: "pets";
            referencedColumns: ["id"];
          },
        ];
      };
      home_access: {
        Row: {
          access_instructions: string | null;
          alarm_code: string | null;
          key_location: string | null;
          tutor_id: string;
          updated_at: string;
        };
        Insert: {
          access_instructions?: string | null;
          alarm_code?: string | null;
          key_location?: string | null;
          tutor_id: string;
          updated_at?: string;
        };
        Update: {
          access_instructions?: string | null;
          alarm_code?: string | null;
          key_location?: string | null;
          tutor_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "home_access_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      medical_records: {
        Row: {
          anamnesis: string | null;
          appointment_id: string | null;
          created_at: string;
          diagnosis: string | null;
          exam_findings: string | null;
          id: string;
          pet_id: string;
          record_date: string;
          treatment: string | null;
        };
        Insert: {
          anamnesis?: string | null;
          appointment_id?: string | null;
          created_at?: string;
          diagnosis?: string | null;
          exam_findings?: string | null;
          id?: string;
          pet_id: string;
          record_date?: string;
          treatment?: string | null;
        };
        Update: {
          anamnesis?: string | null;
          appointment_id?: string | null;
          created_at?: string;
          diagnosis?: string | null;
          exam_findings?: string | null;
          id?: string;
          pet_id?: string;
          record_date?: string;
          treatment?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "medical_records_pet_id_fkey";
            columns: ["pet_id"];
            isOneToOne: false;
            referencedRelation: "pets";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_cents: number;
          appointment_id: string | null;
          created_at: string;
          id: string;
          method: string | null;
          notes: string | null;
          paid_at: string | null;
          pix_code: string | null;
          tutor_id: string;
        };
        Insert: {
          amount_cents: number;
          appointment_id?: string | null;
          created_at?: string;
          id?: string;
          method?: string | null;
          notes?: string | null;
          paid_at?: string | null;
          pix_code?: string | null;
          tutor_id: string;
        };
        Update: {
          amount_cents?: number;
          appointment_id?: string | null;
          created_at?: string;
          id?: string;
          method?: string | null;
          notes?: string | null;
          paid_at?: string | null;
          pix_code?: string | null;
          tutor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pet_sitting_details: {
        Row: {
          appointment_id: string;
          emergency_contact: string | null;
          feeding_routine: string | null;
          house_instructions: string | null;
          medications: string | null;
        };
        Insert: {
          appointment_id: string;
          emergency_contact?: string | null;
          feeding_routine?: string | null;
          house_instructions?: string | null;
          medications?: string | null;
        };
        Update: {
          appointment_id?: string;
          emergency_contact?: string | null;
          feeding_routine?: string | null;
          house_instructions?: string | null;
          medications?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pet_sitting_details_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: true;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
      pets: {
        Row: {
          birth_date: string | null;
          breed: string | null;
          created_at: string;
          id: string;
          name: string;
          notes: string | null;
          photo_path: string | null;
          sex: Database["public"]["Enums"]["pet_sex"] | null;
          species: string;
          temperament: string | null;
          tutor_id: string;
          weight_kg: number | null;
        };
        Insert: {
          birth_date?: string | null;
          breed?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          notes?: string | null;
          photo_path?: string | null;
          sex?: Database["public"]["Enums"]["pet_sex"] | null;
          species: string;
          temperament?: string | null;
          tutor_id: string;
          weight_kg?: number | null;
        };
        Update: {
          birth_date?: string | null;
          breed?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          photo_path?: string | null;
          sex?: Database["public"]["Enums"]["pet_sex"] | null;
          species?: string;
          temperament?: string | null;
          tutor_id?: string;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "pets_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          emergency_contact: string | null;
          full_name: string;
          id: string;
          lgpd_consent_at: string | null;
          neighborhood: string | null;
          phone: string | null;
          updated_at: string;
          zip: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          emergency_contact?: string | null;
          full_name?: string;
          id: string;
          lgpd_consent_at?: string | null;
          neighborhood?: string | null;
          phone?: string | null;
          updated_at?: string;
          zip?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          emergency_contact?: string | null;
          full_name?: string;
          id?: string;
          lgpd_consent_at?: string | null;
          neighborhood?: string | null;
          phone?: string | null;
          updated_at?: string;
          zip?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      vaccinations: {
        Row: {
          applied_on: string;
          batch: string | null;
          created_at: string;
          id: string;
          next_dose_on: string | null;
          pet_id: string;
          vaccine_name: string;
        };
        Insert: {
          applied_on: string;
          batch?: string | null;
          created_at?: string;
          id?: string;
          next_dose_on?: string | null;
          pet_id: string;
          vaccine_name: string;
        };
        Update: {
          applied_on?: string;
          batch?: string | null;
          created_at?: string;
          id?: string;
          next_dose_on?: string | null;
          pet_id?: string;
          vaccine_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vaccinations_pet_id_fkey";
            columns: ["pet_id"];
            isOneToOne: false;
            referencedRelation: "pets";
            referencedColumns: ["id"];
          },
        ];
      };
      visit_report_photos: {
        Row: {
          caption: string | null;
          created_at: string;
          id: string;
          photo_path: string;
          report_id: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          photo_path: string;
          report_id: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          photo_path?: string;
          report_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visit_report_photos_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "visit_reports";
            referencedColumns: ["id"];
          },
        ];
      };
      visit_reports: {
        Row: {
          appointment_id: string;
          arrival_at: string | null;
          checklist: Json;
          created_at: string;
          departure_at: string | null;
          id: string;
          notes: string | null;
          visited_at: string;
        };
        Insert: {
          appointment_id: string;
          arrival_at?: string | null;
          checklist?: Json;
          created_at?: string;
          departure_at?: string | null;
          id?: string;
          notes?: string | null;
          visited_at?: string;
        };
        Update: {
          appointment_id?: string;
          arrival_at?: string | null;
          checklist?: Json;
          created_at?: string;
          departure_at?: string | null;
          id?: string;
          notes?: string | null;
          visited_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visit_reports_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      clear_home_access: { Args: never; Returns: undefined };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      my_home_access_updated_at: { Args: never; Returns: string };
      set_home_access: {
        Args: { _alarm: string; _instr: string; _key: string };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "vet" | "tutor";
      appointment_status: "pendente" | "confirmado" | "concluido" | "cancelado" | "recusado";
      pet_sex: "macho" | "femea";
      service_type: "consulta" | "vacina" | "retorno" | "pet_sitting";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["vet", "tutor"],
      appointment_status: ["pendente", "confirmado", "concluido", "cancelado", "recusado"],
      pet_sex: ["macho", "femea"],
      service_type: ["consulta", "vacina", "retorno", "pet_sitting"],
    },
  },
} as const;
