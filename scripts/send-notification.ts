import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import {
  sendWhatsAppMessage,
  formatNoticeWhatsAppMessage,
} from "../lib/whatsapp";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;

if (
  !supabaseUrl ||
  !supabaseKey ||
  !smtpHost ||
  !smtpUser ||
  !smtpPassword
) {
  throw new Error("Missing required environment variables.");
}

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false,
  auth: {
    user: smtpUser,
    pass: smtpPassword,
  },
});

async function sendNotification() {
  console.log("📧 Testing notification system...");

  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("email, phone_number, whatsapp_enabled, email_enabled")
    .eq("notice_enabled", true);

  if (error) {
    throw error;
  }

  if (!subscribers || subscribers.length === 0) {
    console.log("⚠️ No notice subscribers found.");
    return;
  }

  console.log(`👥 Found ${subscribers.length} subscriber(s).`);

  const testNotice = {
    title: "TEST - New WUSL Notice",
    url: "https://fas.wyb.ac.lk/notices/",
    publishedDate: null,
  };

  for (const subscriber of subscribers) {
    if (subscriber.email_enabled !== false) {
      await transporter.sendMail({
        from: `"WUSL Notice Alert" <${smtpUser}>`,
        to: subscriber.email,
        subject: `📢 ${testNotice.title}`,
        text: `A new university notice has been published.

${testNotice.title}

View the notice:
${testNotice.url}

This is a test notification from WUSL Notice Alert 2.0.`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>📢 New WUSL Notice</h2>

            <h3>${testNotice.title}</h3>

            <p>
              A new university notice has been published.
            </p>

            <p>
              <a href="${testNotice.url}">
                View Notice
              </a>
            </p>

            <hr>

            <p style="color: #777; font-size: 12px;">
              This is a test notification from WUSL Notice Alert 2.0.
            </p>
          </div>
        `,
      });

      console.log(`✅ Email sent to ${subscriber.email}`);
    } else {
      console.log(`⏭️ Skipping email for ${subscriber.email} (email disabled)`);
    }

    // Send WhatsApp notification
    if (
      subscriber.whatsapp_enabled &&
      subscriber.phone_number
    ) {
      try {
        const message =
          formatNoticeWhatsAppMessage(testNotice);

        const sent = await sendWhatsAppMessage(
          subscriber.phone_number,
          message
        );

        if (sent) {
          console.log(
            `📱 WhatsApp sent to ${subscriber.phone_number}`
          );
        }
      } catch (waError) {
        console.error(
          `❌ Failed to send WhatsApp to ${subscriber.phone_number}`,
          waError
        );
      }
    }
  }
}

sendNotification().catch((error) => {
  console.error("❌ Notification error:", error);
  process.exit(1);
});