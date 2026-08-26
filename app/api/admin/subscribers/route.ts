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
    const search = url.searchParams.get("search") || "";
    const channel = url.searchParams.get("channel") || "";
    const status = url.searchParams.get("status") || "";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = admin.from("subscribers").select("*", { count: "exact" });

    if (search) {
      query = query.ilike("email", `%${search}%`);
    }

    if (channel === "whatsapp") {
      query = query.eq("whatsapp_enabled", true).not("phone_number", "is", null);
    } else if (channel === "email") {
      query = query.or("notice_enabled.eq.true,result_enabled.eq.true,venue_enabled.eq.true");
    }

    if (status === "active") {
      query = query.or("notice_enabled.eq.true,result_enabled.eq.true,venue_enabled.eq.true");
    } else if (status === "inactive") {
      query = query.eq("notice_enabled", false).eq("result_enabled", false).eq("venue_enabled", false);
    }

    const { data, count, error: queryError } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (queryError) throw queryError;

    return NextResponse.json({
      subscribers: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (e) {
    console.error("Subscribers list error:", e);
    return adminError("Failed to load subscribers", 500);
  }
}
