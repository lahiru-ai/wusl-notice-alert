import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, adminError } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { user, error, admin } = await verifyAdmin();
  if (error || !user || !admin) return adminError(error || "Unauthorized");

  try {
    const url = new URL(request.url);
    const period = url.searchParams.get("period") || "30d";
    const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
    const days = daysMap[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: logs, error: logError } = await admin
      .from("notification_logs")
      .select("channel, status, sent_at")
      .gte("sent_at", startDate.toISOString())
      .order("sent_at", { ascending: true });

    if (logError) throw logError;

    const dailyMap: Record<string, { email_sent: number; email_failed: number; whatsapp_sent: number; whatsapp_failed: number }> = {};

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      dailyMap[key] = { email_sent: 0, email_failed: 0, whatsapp_sent: 0, whatsapp_failed: 0 };
    }

    for (const log of logs || []) {
      const dateKey = (log.sent_at || "").split("T")[0];
      if (!dailyMap[dateKey]) continue;

      if (log.channel === "email") {
        if (log.status === "sent") dailyMap[dateKey].email_sent++;
        else if (log.status === "failed") dailyMap[dateKey].email_failed++;
      } else if (log.channel === "whatsapp") {
        if (log.status === "sent") dailyMap[dateKey].whatsapp_sent++;
        else if (log.status === "failed") dailyMap[dateKey].whatsapp_failed++;
      }
    }

    const daily_counts = Object.entries(dailyMap).map(([date, counts]) => ({ date, ...counts }));

    const totalEmailSent = (logs || []).filter((l) => l.channel === "email" && l.status === "sent").length;
    const totalEmailFailed = (logs || []).filter((l) => l.channel === "email" && l.status === "failed").length;
    const totalWhatsAppSent = (logs || []).filter((l) => l.channel === "whatsapp" && l.status === "sent").length;
    const totalWhatsAppFailed = (logs || []).filter((l) => l.channel === "whatsapp" && l.status === "failed").length;

    const totalEmail = totalEmailSent + totalEmailFailed;
    const totalWhatsApp = totalWhatsAppSent + totalWhatsAppFailed;

    return NextResponse.json({
      daily_counts,
      summary: {
        total_sent: (logs || []).filter((l) => l.status === "sent").length,
        total_failed: (logs || []).filter((l) => l.status === "failed").length,
        email_success_rate: totalEmail > 0 ? Math.round((totalEmailSent / totalEmail) * 100) : 100,
        whatsapp_success_rate: totalWhatsApp > 0 ? Math.round((totalWhatsAppSent / totalWhatsApp) * 100) : 100,
        email_count: totalEmail,
        whatsapp_count: totalWhatsApp,
      },
    });
  } catch (e) {
    console.error("Analytics error:", e);
    return adminError("Failed to load analytics", 500);
  }
}
