import { NextResponse } from "next/server";
import { verifyAdmin, logAdminActivity, adminError } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error, admin } = await verifyAdmin();
  if (error || !user || !admin) return adminError(error || "Unauthorized");

  try {
    const [
      totalSubs,
      activeSubs,
      whatsappSubs,
      emailNotifSent,
      failedNotif,
      noticesCount,
      resultsCount,
      venuesCount,
    ] = await Promise.all([
      admin.from("subscribers").select("id", { count: "exact", head: true }),
      admin.from("subscribers").select("id", { count: "exact", head: true }).or("notice_enabled.eq.true,result_enabled.eq.true,venue_enabled.eq.true"),
      admin.from("subscribers").select("id", { count: "exact", head: true }).eq("whatsapp_enabled", true).not("phone_number", "is", null),
      admin.from("notification_logs").select("id", { count: "exact", head: true }).eq("status", "sent"),
      admin.from("notification_logs").select("id", { count: "exact", head: true }).eq("status", "failed"),
      admin.from("notices").select("id", { count: "exact", head: true }),
      admin.from("results").select("id", { count: "exact", head: true }),
      admin.from("exam_venues").select("id", { count: "exact", head: true }),
    ]);

    await logAdminActivity(user.id, user.email!, "view_dashboard");

    return NextResponse.json({
      total_subscribers: totalSubs.count || 0,
      active_subscribers: activeSubs.count || 0,
      whatsapp_subscribers: whatsappSubs.count || 0,
      notifications_sent: emailNotifSent.count || 0,
      failed_notifications: failedNotif.count || 0,
      notices_detected: noticesCount.count || 0,
      results_detected: resultsCount.count || 0,
      venues_detected: venuesCount.count || 0,
    });
  } catch (e) {
    console.error("Stats error:", e);
    return adminError("Failed to load stats", 500);
  }
}
