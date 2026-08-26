import { NextResponse } from "next/server";
import { createSupabaseServerClient, createAdminClient } from "./supabase-server";
import { isAdminEmail } from "./admin-config";

export async function verifyAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || !isAdminEmail(user.email || "")) {
    return { user: null, error: "Unauthorized", admin: null };
  }

  const admin = createAdminClient();
  return { user, error: null, admin };
}

export async function logAdminActivity(
  userId: string,
  email: string,
  action: string,
  details?: Record<string, unknown>
) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_activity_logs").insert({
      admin_user_id: userId,
      admin_email: email,
      action,
      details: details || {},
    });
  } catch (e) {
    console.error("Failed to log admin activity:", e);
  }
}

export function adminError(message: string, status = 401) {
  return NextResponse.json({ error: message }, { status });
}
