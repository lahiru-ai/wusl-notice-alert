import * as cheerio from "cheerio";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import {
  sendWhatsAppMessage,
  sendWhatsAppDocument,
  formatNoticeWhatsAppMessage,
} from "../lib/whatsapp";
import {
  findAllPdfUrls,
  fetchPdfBuffer,
} from "../lib/pdf";

const NOTICES_URL = "https://fas.wyb.ac.lk/notices/";

const MONTHS =
  "January|February|March|April|May|June|July|August|September|October|November|December";

// -----------------------------------
// Environment variables
// -----------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;

const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`;

const DRY_RUN = process.env.DRY_RUN === "true";

// -----------------------------------
// Validate environment variables
// -----------------------------------

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

if (!smtpHost || !smtpUser || !smtpPassword) {
  throw new Error(
    "Missing SMTP_HOST, SMTP_USER or SMTP_PASSWORD"
  );
}

// -----------------------------------
// Supabase
// -----------------------------------

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

// -----------------------------------
// Gmail SMTP
// -----------------------------------

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false,
  auth: {
    user: smtpUser,
    pass: smtpPassword,
  },
});

// -----------------------------------
// Send notification email
// -----------------------------------

async function sendNotificationEmail(
  email: string,
  notice: {
    title: string;
    url: string;
    publishedDate: string | null;
  },
  pdfUrls?: string[]
) {
  const urls = pdfUrls || [];

  const attachments: nodemailer.SendMailOptions["attachments"] = [];

  for (let i = 0; i < urls.length; i++) {
    const buffer = await fetchPdfBuffer(urls[i]);

    if (buffer) {
      attachments.push({
        filename: urls.length === 1
          ? "notice.pdf"
          : `notice-${i + 1}.pdf`,
        content: buffer,
      });
      console.log(
        `📎 Attached PDF ${i + 1}/${urls.length}: ${urls[i]}`
      );
    } else {
      console.warn(
        `⚠️ Failed to download PDF ${i + 1}/${urls.length}: ${urls[i]}`
      );
    }
  }

  const pdfLinkHtml =
    urls.length > 0
      ? urls
          .map(
            (url, i) => `
          <p style="margin-top: 15px;">
            <a
              href="${url}"
              style="
                display: inline-block;
                padding: 10px 18px;
                background: #059669;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-size: 14px;
                margin-right: 8px;
              "
            >
              Download PDF ${urls.length > 1 ? i + 1 : ""}
            </a>
          </p>`
          )
          .join("")
      : "";

  const pdfLinkText =
    urls.length > 0
      ? urls
          .map(
            (url, i) =>
              `Download PDF${urls.length > 1 ? ` ${i + 1}` : ""}:\n${url}`
          )
          .join("\n") + "\n"
      : "";

  await transporter.sendMail({
    from: `"WUSL Notice Alert" <${smtpUser}>`,
    to: email,
    subject: `📢 New WUSL Notice: ${notice.title}`,
    attachments,

    text: `
A new WUSL notice has been published.

${notice.title}

Published date:
${notice.publishedDate || "Not available"}
${pdfLinkText}
View the notice:
${notice.url}

───────────────────────────────────────

Manage Notifications →
${appUrl}/dashboard

───────────────────────────────────────

WUSL Notice Alert System
`,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 650px;
        margin: auto;
        padding: 30px;
        background: #f5f7fb;
      ">

        <div style="
          background: #ffffff;
          padding: 30px;
          border-radius: 12px;
        ">

          <h1 style="color: #2563eb;">
            📢 New WUSL Notice
          </h1>

          <h2>
            ${notice.title}
          </h2>

          <p>
            A new notice has been published by the
            Faculty of Applied Sciences, Wayamba University of Sri Lanka.
          </p>

          <p>
            <strong>Published date:</strong>
            ${notice.publishedDate || "Not available"}
          </p>

          ${pdfLinkHtml}

          <p style="margin-top: 25px;">
            <a
              href="${notice.url}"
              style="
                display: inline-block;
                padding: 12px 20px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 8px;
              "
            >
              View Notice
            </a>
          </p>

          <hr style="
            margin: 30px 0;
            border: none;
            border-top: 1px solid #ddd;
          ">

          <p style="margin-top: 20px; text-align: center;">
            <a
              href="${appUrl}/dashboard"
              style="
                display: inline-block;
                padding: 10px 20px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-size: 13px;
              "
            >
              Manage Notifications →
            </a>
          </p>

          <p style="
            font-size: 12px;
            color: #999;
            text-align: center;
            margin-top: 16px;
          ">
            WUSL Notice Alert System
          </p>

        </div>

      </div>
    `,
  });
}

// -----------------------------------
// Main checker
// -----------------------------------

async function checkNotices() {
  console.log("🔍 Checking WUSL notices...");

  if (DRY_RUN) {
    console.log("🧪 DRY RUN MODE ENABLED");
    console.log("📧 No emails will be sent.");
  }

  try {
    // -----------------------------------
    // 1. Download WUSL notices page
    // -----------------------------------

    const response = await fetch(NOTICES_URL);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch notices: ${response.status}`
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const notices: {
      title: string;
      url: string;
      publishedDate: string | null;
    }[] = [];

    // -----------------------------------
    // 2. Extract notices
    // -----------------------------------

    $("h3").each((_, element) => {
      const title = $(element).text().trim();
      const link = $(element).find("a").attr("href");

      if (!title || !link) return;

      const url = new URL(link, NOTICES_URL).href;

      let publishedDate: string | null = null;

      let current = $(element);

      for (let level = 0; level < 6; level++) {
        const text = current
          .text()
          .replace(/\s+/g, " ")
          .trim();

        const match = text.match(
          new RegExp(
            `(${MONTHS})\\s+\\d{1,2},\\s+\\d{4}`,
            "i"
          )
        );

        if (match) {
          const parsedDate = new Date(match[0]);

          if (!isNaN(parsedDate.getTime())) {
            publishedDate = parsedDate
              .toISOString()
              .split("T")[0];
          }

          break;
        }

        current = current.parent();
      }

      notices.push({
        title,
        url,
        publishedDate,
      });
    });

    console.log(`📋 Found ${notices.length} notices.`);

    // -----------------------------------
    // 3. Get existing notices
    // -----------------------------------

    const {
      data: existingNotices,
      error: existingError,
    } = await supabase
      .from("notices")
      .select("url");

    if (existingError) {
      throw existingError;
    }

    const existingUrls = new Set(
      (existingNotices || []).map(
        (notice) => notice.url
      )
    );

    // -----------------------------------
    // 4. Find NEW notices
    // -----------------------------------

    const newNotices = notices.filter(
      (notice) => !existingUrls.has(notice.url)
    );

    console.log(
      `🆕 New notices: ${newNotices.length}`
    );

    // -----------------------------------
    // 5. Nothing new
    // -----------------------------------

    if (newNotices.length === 0) {
      console.log("✅ No new notices.");
      return;
    }

    // -----------------------------------
    // 6. Save new notices
    // -----------------------------------

    const {
      data: insertedNotices,
      error: insertError,
    } = await supabase
      .from("notices")
      .insert(
        newNotices.map((notice) => ({
          title: notice.title,
          url: notice.url,
          published_date: notice.publishedDate,
        }))
      )
      .select("id, title, url, published_date");

    if (insertError) {
      throw insertError;
    }

    console.log(
      "✅ New notices saved to Supabase."
    );

    // -----------------------------------
    // 6b. Detect PDFs on individual
    //     post pages and store URLs
    // -----------------------------------

    console.log("📄 Detecting PDFs...");

    for (const notice of insertedNotices || []) {
      const pdfUrls = await findAllPdfUrls(notice.url);

      if (pdfUrls.length > 0) {
        console.log(
          `📎 ${pdfUrls.length} PDF(s) found for: ${notice.title}`
        );

        const pdfUrlsJson = JSON.stringify(pdfUrls);

        const { error: pdfUpdateError } =
          await supabase
            .from("notices")
            .update({ pdf_url: pdfUrlsJson })
            .eq("id", notice.id);

        if (pdfUpdateError) {
          console.error(
            `⚠️ Failed to store PDF URLs for ${notice.title}`,
            pdfUpdateError
          );
        }

        (notice as Record<string, unknown>).pdf_urls =
          pdfUrls;
      }
    }

    // -----------------------------------
    // 7. Get notice subscribers
    // -----------------------------------

    const {
      data: subscribers,
      error: subscriberError,
    } = await supabase
      .from("subscribers")
      .select("id, email, phone_number, whatsapp_enabled, email_enabled")
      .eq("notice_enabled", true);

    if (subscriberError) {
      throw subscriberError;
    }

    console.log(
      `👥 Notice subscribers: ${
        subscribers?.length || 0
      }`
    );

    if (!subscribers || subscribers.length === 0) {
      console.log(
        "⚠️ No users are subscribed to notice notifications."
      );

      return;
    }

    // -----------------------------------
    // 8. Send notifications
    // -----------------------------------

    for (const notice of insertedNotices || []) {
      console.log("");
      console.log(`📢 ${notice.title}`);
      console.log(`🔗 ${notice.url}`);

      for (const subscriber of subscribers) {

        // -----------------------------------
        // Per-channel dedup check
        // -----------------------------------

        const {
          data: emailLog,
          error: emailLogError,
        } = await supabase
          .from("notification_logs")
          .select("id")
          .eq("subscriber_id", subscriber.id)
          .eq("notice_id", notice.id)
          .eq("channel", "email")
          .maybeSingle();

        if (emailLogError) {
          console.error(
            `⚠️ Failed to check email log for ${subscriber.email}`,
            emailLogError
          );
        }

        const {
          data: whatsappLog,
          error: whatsappLogError,
        } = await supabase
          .from("notification_logs")
          .select("id")
          .eq("subscriber_id", subscriber.id)
          .eq("notice_id", notice.id)
          .eq("channel", "whatsapp")
          .maybeSingle();

        if (whatsappLogError) {
          console.error(
            `⚠️ Failed to check WhatsApp log for ${subscriber.email}`,
            whatsappLogError
          );
        }

        const emailSent = !!emailLog;
        const whatsappSent = !!whatsappLog;

        if (emailSent && whatsappSent) {
          console.log(
            `⏭️ Already sent to ${subscriber.email}`
          );
          continue;
        }

        // -----------------------------------
        // Send email if not already sent
        // -----------------------------------

        if (!emailSent && subscriber.email_enabled !== false) {
          try {
            if (DRY_RUN) {
              console.log(
                `🧪 DRY RUN: Would send email to ${subscriber.email}`
              );
            } else {
              await sendNotificationEmail(
                subscriber.email,
                {
                  title: notice.title,
                  url: notice.url,
                  publishedDate: notice.published_date,
                },
                (notice as Record<string, unknown>)
                  .pdf_urls as string[] | undefined
              );

              console.log(
                `📧 Email sent to ${subscriber.email}`
              );

              const { error: logInsertError } =
                await supabase
                  .from("notification_logs")
                  .insert({
                    subscriber_id: subscriber.id,
                    notice_id: notice.id,
                    channel: "email",
                  });

              if (logInsertError) {
                console.error(
                  `⚠️ Failed to log notice email for ${subscriber.email}`,
                  logInsertError
                );
              }
            }
          } catch (emailError) {
            console.error(
              `❌ Failed to send email to ${subscriber.email}`,
              emailError
            );
          }
        }

        // -----------------------------------
        // Send WhatsApp if not already sent
        // -----------------------------------

        if (
          !DRY_RUN &&
          !whatsappSent &&
          subscriber.whatsapp_enabled &&
          subscriber.phone_number
        ) {
          try {
            const pdfUrls =
              (notice as Record<string, unknown>)
                .pdf_urls as string[] | undefined;

            let sent = false;

            // Try document message first if PDFs available
            if (pdfUrls && pdfUrls.length > 0) {
              sent = await sendWhatsAppDocument(
                subscriber.phone_number,
                pdfUrls[0],
                `📢 ${notice.title}`
              );
            }

            // Fall back to text message
            if (!sent) {
              const message =
                formatNoticeWhatsAppMessage({
                  title: notice.title,
                  url: notice.url,
                  publishedDate: notice.published_date,
                });

              sent = await sendWhatsAppMessage(
                subscriber.phone_number,
                message
              );
            }

            if (sent) {
              console.log(
                `📱 WhatsApp sent to ${subscriber.phone_number}`
              );

              const { error: logInsertError } =
                await supabase
                  .from("notification_logs")
                  .insert({
                    subscriber_id: subscriber.id,
                    notice_id: notice.id,
                    channel: "whatsapp",
                  });

              if (logInsertError) {
                console.error(
                  `⚠️ Failed to log notice WhatsApp for ${subscriber.email}`,
                  logInsertError
                );
              }
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

    console.log("");
    console.log(
      DRY_RUN
        ? "🧪 DRY RUN completed. No emails were sent."
        : "🎉 Notification process completed."
    );

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkNotices();