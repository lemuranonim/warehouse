"use server";

import { redirect } from "next/navigation";
import { safeInternalPath } from "@/lib/safe-navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type LoginState = { error: string };

export async function loginAction(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = safeInternalPath(formData.get("next"));

  if (!email || email.length > 254 || !email.includes("@")) {
    return { error: "Masukkan alamat email yang valid." };
  }
  if (password.length < 8 || password.length > 128) {
    return { error: "Password tidak valid." };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Email atau password tidak sesuai." };

  const { data: profile, error: profileError } = await supabase
    .from("wms_profiles")
    .select("id, is_active")
    .eq("id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return { error: "Akun belum memiliki akses aktif ke Warehouse WMS." };
  }

  const { data: roleAssignment } = await supabase
    .from("wms_user_roles")
    .select("id")
    .eq("user_id", data.user.id)
    .limit(1)
    .maybeSingle();
  if (!roleAssignment) {
    await supabase.auth.signOut();
    return { error: "Akun belum memiliki role Warehouse WMS." };
  }

  redirect(nextPath);
}
