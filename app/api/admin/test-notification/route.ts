import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, logAdminActivity, adminError } from "@/lib/admin-auth";
import nodemailer from "nodemailer";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { user, error } = await verifyAdmin();
  if (error || !user) return adminError(error || "Unauthorized");

  try {
    const body = await request.json();
    const { channel, recipient, subject, message } = body;

    if (!channel || !recipient || !message) {
      return adminError("Missing required fields: channel, recipient, message");
    }

    if (!["email", "whatsapp"].includes(channel)) {
      return adminError("Channel must be 'email' or 'whatsapp'");
    }

    let success = false;
    let errMessage = "";

    if (channel === "email") {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
        });
        await transporter.sendMail({
          from: `"WUSL Notice Alert" <${process.env.SMTP_USER}>`,
          to: recipient,
          subject: subject || "Test Notification — WUSL Notice Alert",
          text: message,
          html: `<div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px;background:#f5f7fb"><div style="background:#fff;padding:30px;border-radius:12px"><h2 style="color:#2563eb">🧪 Test Notification</h2><p style="white-space:pre-wrap">${message}</p><hr style="margin:30px 0;border:none;border-top:1px solid #ddd"><p style="font-size:12px;color:#999;text-align:center">WUSL Notice Alert — Admin Test</p></div></div>`,
        });
        success = true;
      } catch (e) {
        errMessage = e instanceof Error ? e.message : "Email send failed";
      }
    } else {
      success = await sendWhatsAppMessage(recipient, message);
      if (!success) errMessage = "WhatsApp API returned failure";
    }

    await logAdminActivity(user.id, user.email!, "test_notification", {
      channel,
      recipient,
      success,
    });

    return NextResponse.json({ success, error: success ? null : errMessage });
  } catch (e) {
    console.error("Test notification error:", e);
    return adminError("Failed to send test notification", 500);
  }
}
