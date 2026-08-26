import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, adminError } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, error, admin } = await verifyAdmin();
  if (error || !user || !admin) return adminError(error || "Unauthorized");

  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const action = url.searchParams.get("action") || "";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = admin.from("admin_activity_logs").select("*", { count: "exact" });

    if (action) {
      query = query.eq("action", action);
    }

    const { data, count, error: queryError } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (queryError) throw queryError;

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (e) {
    console.error("Activity logs error:", e);
    return adminError("Failed to load activity logs", 500);
  }
}
