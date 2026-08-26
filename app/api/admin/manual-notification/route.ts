import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, logAdminActivity, adminError } from "@/lib/admin-auth";
import nodemailer from "nodemailer";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

export async function POST(request: NextRequest) {
  const { user, error, admin } = await verifyAdmin();
  if (error || !user || !admin) return adminError(error || "Unauthorized");

  try {
    const body = await request.json();
    const { target, channel, subscriber_ids, subject, message } = body;

    if (!target || !channel || !subject || !message) {
      return adminError("Missing required fields: target, channel, subject, message");
    }

    if (!["all", "email", "whatsapp", "selected"].includes(target)) {
      return adminError("Invalid target");
    }

    if (!["email", "whatsapp", "both"].includes(channel)) {
      return adminError("Invalid channel");
    }

    let query = admin.from("subscribers").select("id, email, phone_number, whatsapp_enabled");

    if (target === "email") {
      query = query.or("notice_enabled.eq.true,result_enabled.eq.true,venue_enabled.eq.true");
    } else if (target === "whatsapp") {
      query = query.eq("whatsapp_enabled", true).not("phone_number", "is", null);
    } else if (target === "selected" && subscriber_ids?.length) {
      query = query.in("id", subscriber_ids);
    }

    const { data: subscribers, error: subError } = await query;
    if (subError) throw subError;

    if (!subscribers || subscribers.length === 0) {
      return adminError("No subscribers found for the selected target");
    }

    const results = { sent: 0, failed: 0, details: [] as Array<{ email: string; channel: string; success: boolean; error?: string }> };

    for (const sub of subscribers) {
      if (channel === "email" || channel === "both") {
        let success = false;
        let errMessage = "";
        try {
          const transporter = createTransporter();
          await transporter.sendMail({
            from: `"WUSL Notice Alert" <${process.env.SMTP_USER}>`,
            to: sub.email,
            subject,
            text: message,
            html: `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px;background:#f5f7fb"><div style="background:#fff;padding:30px;border-radius:12px"><h2 style="color:#2563eb">${subject}</h2><p style="white-space:pre-wrap">${message}</p><hr style="margin:30px 0;border:none;border-top:1px solid #ddd"><p style="font-size:12px;color:#999;text-align:center">WUSL Notice Alert — Admin Notification</p></div></div>`,
          });
          success = true;
          results.sent++;
        } catch (e) {
          errMessage = e instanceof Error ? e.message : "Email failed";
          results.failed++;
        }

        try {
          await admin.from("notification_logs").insert({
            subscriber_id: sub.id,
            channel: "email",
            status: success ? "sent" : "failed",
            sent_at: new Date().toISOString(),
            error_message: success ? null : errMessage,
            metadata: { type: "manual", subject },
          });
        } catch { /* log insertion best-effort */ }

        results.details.push({ email: sub.email, channel: "email", success, error: success ? undefined : errMessage });
      }

      if ((channel === "whatsapp" || channel === "both") && sub.whatsapp_enabled && sub.phone_number) {
        const success = await sendWhatsAppMessage(sub.phone_number, `*${subject}*\n\n${message}`);
        results.sent += success ? 1 : 0;
        results.failed += success ? 0 : 1;

        try {
          await admin.from("notification_logs").insert({
            subscriber_id: sub.id,
            channel: "whatsapp",
            status: success ? "sent" : "failed",
            sent_at: new Date().toISOString(),
            error_message: success ? null : "WhatsApp API failure",
            metadata: { type: "manual", subject },
          });
        } catch { /* best-effort */ }

        results.details.push({ email: sub.email, channel: "whatsapp", success, error: success ? undefined : "WhatsApp API failure" });
      }
    }

    await logAdminActivity(user.id, user.email!, "manual_notification", {
      target,
      channel,
      recipient_count: subscribers.length,
      sent: results.sent,
      failed: results.failed,
    });

    return NextResponse.json(results);
  } catch (e) {
    console.error("Manual notification error:", e);
    return adminError("Failed to send manual notifications", 500);
  }
}
