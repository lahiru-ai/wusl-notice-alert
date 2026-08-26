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
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error, admin } = await verifyAdmin();
  if (error || !user || !admin) return adminError(error || "Unauthorized");

  try {
    const { id } = await params;

    const { data: log, error: logError } = await admin
      .from("notification_logs")
      .select("*")
      .eq("id", id)
      .single();

    if (logError || !log) {
      return adminError("Notification log not found", 404);
    }

    if (log.status !== "failed") {
      return adminError("Only failed notifications can be retried");
    }

    const { data: subscriber, error: subError } = await admin
      .from("subscribers")
      .select("email, phone_number, whatsapp_enabled")
      .eq("id", log.subscriber_id)
      .single();

    if (subError || !subscriber) {
      return adminError("Subscriber not found", 404);
    }

    let itemTitle = "Notification";
    let itemUrl = "";

    if (log.notice_id) {
      const { data } = await admin.from("notices").select("title, url").eq("id", log.notice_id).single();
      if (data) { itemTitle = data.title; itemUrl = data.url; }
    } else if (log.result_id) {
      const { data } = await admin.from("results").select("title, url").eq("id", log.result_id).single();
      if (data) { itemTitle = data.title; itemUrl = data.url; }
    } else if (log.venue_id) {
      const { data } = await admin.from("exam_venues").select("title, url").eq("id", log.venue_id).single();
      if (data) { itemTitle = data.title; itemUrl = data.url; }
    }

    let success = false;
    let errMessage = "";

    if (log.channel === "email") {
      try {
        const transporter = createTransporter();
        await transporter.sendMail({
          from: `"WUSL Notice Alert" <${process.env.SMTP_USER}>`,
          to: subscriber.email,
          subject: `📢 ${itemTitle}`,
          text: `${itemTitle}\n\nView: ${itemUrl}\n\nThis is a retried notification from WUSL Notice Alert.`,
          html: `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px;background:#f5f7fb"><div style="background:#fff;padding:30px;border-radius:12px"><h2 style="color:#2563eb">${itemTitle}</h2><p>${itemTitle}</p><p><a href="${itemUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px">View</a></p><p style="font-size:12px;color:#999;text-align:center;margin-top:16px">WUSL Notice Alert — Retried notification</p></div></div>`,
        });
        success = true;
      } catch (e) {
        errMessage = e instanceof Error ? e.message : "Email send failed";
      }
    } else if (log.channel === "whatsapp") {
      if (subscriber.phone_number) {
        success = await sendWhatsAppMessage(
          subscriber.phone_number,
          `📢 *${itemTitle}*\n\nView: ${itemUrl}\n\n— WUSL Notice Alert (Retried)`
        );
        if (!success) errMessage = "WhatsApp API returned failure";
      } else {
        errMessage = "No phone number available";
      }
    }

    await admin
      .from("notification_logs")
      .update({
        status: success ? "sent" : "failed",
        sent_at: new Date().toISOString(),
        error_message: success ? null : errMessage,
      })
      .eq("id", id);

    await logAdminActivity(user.id, user.email!, "retry_notification", {
      notification_log_id: id,
      channel: log.channel,
      success,
    });

    return NextResponse.json({ success, error: success ? null : errMessage });
  } catch (e) {
    console.error("Retry error:", e);
    return adminError("Failed to retry notification", 500);
  }
}
