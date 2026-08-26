import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, logAdminActivity, adminError } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, admin } = await verifyAdmin();
  if (error || !user || !admin) return adminError(error || "Unauthorized");

  try {
    const { id } = await params;

    const { data: subscriber, error: subError } = await admin
      .from("subscribers")
      .select("*")
      .eq("id", id)
      .single();

    if (subError || !subscriber) {
      return adminError("Subscriber not found", 404);
    }

    const { data: logs, error: logsError } = await admin
      .from("notification_logs")
      .select(`
        id,
        channel,
        status,
        sent_at,
        delivered_at,
        error_message,
        metadata,
        notice_id,
        result_id,
        venue_id,
        notices:notice_id (title, url),
        results:result_id (title, url),
        exam_venues:venue_id (title, url)
      `)
      .eq("subscriber_id", id)
      .order("sent_at", { ascending: false });

    if (logsError) throw logsError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getFirst = (val: any): any => {
      if (Array.isArray(val)) return val[0] || null;
      return val;
    };

    const timeline = (logs || []).map((log) => {
      const notice = getFirst(log.notices) as { title?: string; url?: string } | null;
      const result = getFirst(log.results) as { title?: string; url?: string } | null;
      const venue = getFirst(log.exam_venues) as { title?: string; url?: string } | null;

      return {
        id: log.id,
        channel: log.channel,
        status: log.status,
        sent_at: log.sent_at,
        delivered_at: log.delivered_at,
        error_message: log.error_message,
        metadata: log.metadata,
        notice_title: notice?.title || null,
        notice_url: notice?.url || null,
        result_title: result?.title || null,
        result_url: result?.url || null,
        venue_title: venue?.title || null,
        venue_url: venue?.url || null,
      };
    });

    return NextResponse.json({ subscriber, timeline });
  } catch (e) {
    console.error("Subscriber detail error:", e);
    return adminError("Failed to load subscriber", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, admin } = await verifyAdmin();
  if (error || !user || !admin) return adminError(error || "Unauthorized");

  try {
    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      "email_enabled",
      "notice_enabled",
      "result_enabled",
      "venue_enabled",
      "whatsapp_enabled",
    ] as const;

    const blockedFields = ["email", "user_id", "password", "id"];

    for (const key of Object.keys(body)) {
      if (blockedFields.includes(key)) {
        return adminError(`Cannot modify field: ${key}`, 400);
      }
    }

    const updates: Record<string, boolean> = {};
    for (const field of allowedFields) {
      if (field in body) {
        if (typeof body[field] !== "boolean") {
          return adminError(`Field ${field} must be a boolean`, 400);
        }
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return adminError("No valid preference fields provided", 400);
    }

    const { data: current, error: fetchError } = await admin
      .from("subscribers")
      .select("email_enabled, notice_enabled, result_enabled, venue_enabled, whatsapp_enabled")
      .eq("id", id)
      .single();

    if (fetchError || !current) {
      return adminError("Subscriber not found", 404);
    }

    const { data: updated, error: updateError } = await admin
      .from("subscribers")
      .update(updates)
      .eq("id", id)
      .select("email_enabled, notice_enabled, result_enabled, venue_enabled, whatsapp_enabled")
      .single();

    if (updateError) {
      throw updateError;
    }

    const changedFields = Object.keys(updates).filter(
      (key) => current[key as keyof typeof current] !== updated[key as keyof typeof updated]
    );

    await logAdminActivity(user.id, user.email!, "update_subscriber_preferences", {
      subscriber_id: id,
      previous: {
        email_enabled: current.email_enabled,
        notice_enabled: current.notice_enabled,
        result_enabled: current.result_enabled,
        venue_enabled: current.venue_enabled,
        whatsapp_enabled: current.whatsapp_enabled,
      },
      new: {
        email_enabled: updated.email_enabled,
        notice_enabled: updated.notice_enabled,
        result_enabled: updated.result_enabled,
        venue_enabled: updated.venue_enabled,
        whatsapp_enabled: updated.whatsapp_enabled,
      },
      changed_fields: changedFields,
    });

    return NextResponse.json({ subscriber: updated });
  } catch (e) {
    console.error("Subscriber update error:", e);
    return adminError("Failed to update subscriber preferences", 500);
  }
}
