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
    const channel = url.searchParams.get("channel") || "";
    const status = url.searchParams.get("status") || "";
    const dateFrom = url.searchParams.get("date_from") || "";
    const dateTo = url.searchParams.get("date_to") || "";
    const subscriberId = url.searchParams.get("subscriber_id") || "";
    const noticeId = url.searchParams.get("notice_id") || "";
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = admin.from("notification_logs").select(`
      id,
      channel,
      status,
      sent_at,
      delivered_at,
      error_message,
      metadata,
      subscriber_id,
      notice_id,
      result_id,
      venue_id,
      subscribers:subscriber_id (email),
      notices:notice_id (title),
      results:result_id (title),
      exam_venues:venue_id (title)
    `, { count: "exact" });

    if (channel) query = query.eq("channel", channel);
    if (status) query = query.eq("status", status);
    if (dateFrom) query = query.gte("sent_at", dateFrom);
    if (dateTo) query = query.lte("sent_at", dateTo + "T23:59:59Z");
    if (subscriberId) query = query.eq("subscriber_id", subscriberId);
    if (noticeId) query = query.eq("notice_id", noticeId);

    const { data, count, error: queryError } = await query
      .order("sent_at", { ascending: false })
      .range(from, to);

    if (queryError) throw queryError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getFirst = (val: any): any => {
      if (Array.isArray(val)) return val[0] || null;
      return val;
    };

    const notifications = (data || []).map((log) => {
      const sub = getFirst(log.subscribers) as { email?: string } | null;
      const notice = getFirst(log.notices) as { title?: string } | null;
      const result = getFirst(log.results) as { title?: string } | null;
      const venue = getFirst(log.exam_venues) as { title?: string } | null;

      return {
        id: log.id,
        channel: log.channel,
        status: log.status,
        sent_at: log.sent_at,
        delivered_at: log.delivered_at,
        error_message: log.error_message,
        metadata: log.metadata,
        subscriber_email: sub?.email || "Unknown",
        notice_title: notice?.title || null,
        result_title: result?.title || null,
        venue_title: venue?.title || null,
        item_title: notice?.title || result?.title || venue?.title || "—",
      };
    });

    return NextResponse.json({
      notifications,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (e) {
    console.error("Notifications list error:", e);
    return adminError("Failed to load notifications", 500);
  }
}
