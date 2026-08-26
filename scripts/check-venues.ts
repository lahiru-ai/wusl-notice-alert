import * as cheerio from "cheerio";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import {
  sendWhatsAppMessage,
  sendWhatsAppDocument,
  formatVenueWhatsAppMessage,
} from "../lib/whatsapp";
import {
  findAllPdfUrls,
  fetchPdfBuffer,
} from "../lib/pdf";

const VENUES_URL =
  "https://fas.wyb.ac.lk/examination-venues/";

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

const supabase = createClient(supabaseUrl, supabaseKey);

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
// Venue type
// -----------------------------------

type VenueEntry = {
  title: string;
  url: string;
  publishedDate: string | null;
  excerpt: string;
};

// -----------------------------------
// Parse a human-readable date string
// into YYYY-MM-DD
// -----------------------------------

function parseDate(raw: string): string | null {
  const match = raw.match(
    new RegExp(
      `(${MONTHS})\\s+\\d{1,2},\\s+\\d{4}`,
      "i"
    )
  );

  if (!match) return null;

  const parsed = new Date(match[0]);

  if (isNaN(parsed.getTime())) return null;

  return parsed.toISOString().split("T")[0];
}

// -----------------------------------
// Fetch a single page and extract
// venue entries
// -----------------------------------

async function fetchVenuePage(
  pageUrl: string
): Promise<VenueEntry[]> {
  const response = await fetch(pageUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch venue page: ${response.status} ${pageUrl}`
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const entries: VenueEntry[] = [];

  $("article.elementor-post").each((_, element) => {
    const titleEl = $(element).find(
      "h3.elementor-post__title a"
    );

    const title = titleEl.text().trim();
    const href = titleEl.attr("href");

    if (!title || !href) return;

    const url = new URL(href, VENUES_URL).href;

    const rawDate = $(element)
      .find("span.elementor-post-date")
      .text()
      .trim();

    const publishedDate = rawDate
      ? parseDate(rawDate)
      : null;

    const excerpt = $(element)
      .find("div.elementor-post__excerpt")
      .text()
      .trim();

    entries.push({
      title,
      url,
      publishedDate,
      excerpt,
    });
  });

  return entries;
}

// -----------------------------------
// Determine total pages from the
// load-more anchor on page 1
// -----------------------------------

function getMaxPages(html: string): number {
  const $ = cheerio.load(html);
  const anchor = $("div.e-load-more-anchor");
  const max = parseInt(
    anchor.attr("data-max-page") || "1",
    10
  );
  return isNaN(max) ? 1 : max;
}

// -----------------------------------
// Send venue notification email
// -----------------------------------

async function sendVenueEmail(
  email: string,
  venue: VenueEntry,
  pdfUrls?: string[]
) {
  const urls = pdfUrls || [];

  const attachments: nodemailer.SendMailOptions["attachments"] = [];

  for (let i = 0; i < urls.length; i++) {
    const buffer = await fetchPdfBuffer(urls[i]);

    if (buffer) {
      attachments.push({
        filename: urls.length === 1
          ? "venue.pdf"
          : `venue-${i + 1}.pdf`,
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
    subject: `🏫 New Examination Venue: ${venue.title}`,
    attachments,

    text: `
An examination venue notice has been published.

${venue.title}

Published date:
${venue.publishedDate || "Not available"}

${venue.excerpt ? `Details:\n${venue.excerpt}\n` : ""}
${pdfLinkText}
View the venue notice:
${venue.url}

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
            🏫 New Examination Venue
          </h1>

          <h2>
            ${venue.title}
          </h2>

          <p>
            An examination venue notice has been published by the
            Faculty of Applied Sciences, Wayamba University of Sri Lanka.
          </p>

          <p>
            <strong>Published date:</strong>
            ${venue.publishedDate || "Not available"}
          </p>

          ${venue.excerpt ? `
          <p style="
            background: #f0f4ff;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
          ">
            ${venue.excerpt}
          </p>
          ` : ""}

          ${pdfLinkHtml}

          <p style="margin-top: 25px;">
            <a
              href="${venue.url}"
              style="
                display: inline-block;
                padding: 12px 20px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 8px;
              "
            >
              View Venue Details
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

async function checkVenues() {
  console.log("🔍 Checking WUSL examination venues...");

  if (DRY_RUN) {
    console.log("🧪 DRY RUN MODE ENABLED");
    console.log("📧 No emails will be sent.");
  }

  try {
    // -----------------------------------
    // 1. Fetch page 1 to determine
    //    total pages
    // -----------------------------------

    const firstResponse = await fetch(VENUES_URL);

    if (!firstResponse.ok) {
      throw new Error(
        `Failed to fetch venue page: ${firstResponse.status}`
      );
    }

    const firstHtml = await firstResponse.text();
    const maxPages = getMaxPages(firstHtml);

    console.log(
      `📄 Found ${maxPages} page(s) of venue entries.`
    );

    // -----------------------------------
    // 2. Extract entries from all pages
    // -----------------------------------

    const allEntries: VenueEntry[] = [];

    // Page 1 was already fetched
    const $ = cheerio.load(firstHtml);

    $("article.elementor-post").each((_, element) => {
      const titleEl = $(element).find(
        "h3.elementor-post__title a"
      );

      const title = titleEl.text().trim();
      const href = titleEl.attr("href");

      if (!title || !href) return;

      const url = new URL(href, VENUES_URL).href;

      const rawDate = $(element)
        .find("span.elementor-post-date")
        .text()
        .trim();

      const publishedDate = rawDate
        ? parseDate(rawDate)
        : null;

      const excerpt = $(element)
        .find("div.elementor-post__excerpt")
        .text()
        .trim();

      allEntries.push({
        title,
        url,
        publishedDate,
        excerpt,
      });
    });

    // Fetch remaining pages
    for (let page = 2; page <= maxPages; page++) {
      const pageUrl = `${VENUES_URL}${page}/`;

      console.log(`📄 Fetching page ${page}...`);

      const entries = await fetchVenuePage(pageUrl);
      allEntries.push(...entries);
    }

    console.log(
      `📋 Found ${allEntries.length} total venue entries.`
    );

    // -----------------------------------
    // 3. Get existing venue URLs
    // -----------------------------------

    const {
      data: existingVenues,
      error: existingError,
    } = await supabase
      .from("exam_venues")
      .select("url");

    if (existingError) {
      throw existingError;
    }

    const existingUrls = new Set(
      (existingVenues || []).map((venue) => venue.url)
    );

    // -----------------------------------
    // 4. Find NEW venue entries
    // -----------------------------------

    const newVenues = allEntries.filter(
      (venue) => !existingUrls.has(venue.url)
    );

    console.log(
      `🆕 New venue entries: ${newVenues.length}`
    );

    // -----------------------------------
    // 5. Nothing new
    // -----------------------------------

    if (newVenues.length === 0) {
      console.log("✅ No new venue entries.");
      return;
    }

    // -----------------------------------
    // 6. DRY RUN
    // -----------------------------------

    if (DRY_RUN) {
      console.log("");
      console.log(
        "🧪 New venue entries detected, but nothing will be saved or emailed."
      );

      for (const venue of newVenues) {
        console.log(`🏫 ${venue.title}`);
        console.log(`🔗 ${venue.url}`);
        console.log(
          "🧪 DRY RUN: Would save this venue and notify subscribed users."
        );
      }

      console.log("");
      console.log(
        "🧪 DRY RUN completed. No venue emails were sent."
      );

      return;
    }

    // -----------------------------------
    // 7. Save new venue entries
    // -----------------------------------

    const {
      data: insertedVenues,
      error: insertError,
    } = await supabase
      .from("exam_venues")
      .insert(
        newVenues.map((venue) => ({
          title: venue.title,
          url: venue.url,
          published_date: venue.publishedDate,
        }))
      )
      .select("id, title, url, published_date");

    if (insertError) {
      throw insertError;
    }

    console.log(
      "✅ New venue entries saved to Supabase."
    );

    // -----------------------------------
    // 7b. Detect PDFs on individual
    //     post pages and store URLs
    // -----------------------------------

    console.log("📄 Detecting PDFs...");

    for (const venue of insertedVenues || []) {
      const pdfUrls = await findAllPdfUrls(venue.url);

      if (pdfUrls.length > 0) {
        console.log(
          `📎 ${pdfUrls.length} PDF(s) found for: ${venue.title}`
        );

        const pdfUrlsJson = JSON.stringify(pdfUrls);

        const { error: pdfUpdateError } =
          await supabase
            .from("exam_venues")
            .update({ pdf_url: pdfUrlsJson })
            .eq("id", venue.id);

        if (pdfUpdateError) {
          console.error(
            `⚠️ Failed to store PDF URLs for ${venue.title}`,
            pdfUpdateError
          );
        }

        (venue as Record<string, unknown>).pdf_urls =
          pdfUrls;
      }
    }

    // -----------------------------------
    // 8. Get venue subscribers
    // -----------------------------------

    const {
      data: subscribers,
      error: subscriberError,
    } = await supabase
      .from("subscribers")
      .select(
        "id, email, phone_number, whatsapp_enabled, email_enabled"
      )
      .eq("venue_enabled", true);

    if (subscriberError) {
      throw subscriberError;
    }

    console.log(
      `👥 Venue subscribers: ${
        subscribers?.length || 0
      }`
    );

    if (!subscribers || subscribers.length === 0) {
      console.log(
        "⚠️ No users are subscribed to venue notifications."
      );

      return;
    }

    // -----------------------------------
    // 9. Send notifications
    // -----------------------------------

    for (const venue of insertedVenues || []) {
      console.log("");
      console.log(`🏫 ${venue.title}`);
      console.log(`🔗 ${venue.url}`);

      // Find the matching excerpt from newVenues
      const match = newVenues.find(
        (v) => v.url === venue.url
      );

      const venueWithExcerpt: VenueEntry = {
        title: venue.title,
        url: venue.url,
        publishedDate: venue.published_date,
        excerpt: match?.excerpt || "",
      };

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
          .eq("venue_id", venue.id)
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
          .eq("venue_id", venue.id)
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
            await sendVenueEmail(
              subscriber.email,
              venueWithExcerpt,
              (venue as Record<string, unknown>)
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
                  venue_id: venue.id,
                  channel: "email",
                });

            if (logInsertError) {
              console.error(
                `⚠️ Failed to log venue email for ${subscriber.email}`,
                logInsertError
              );
            }
          } catch (emailError) {
            console.error(
              `❌ Failed to send venue email to ${subscriber.email}`,
              emailError
            );
          }
        }

        // -----------------------------------
        // Send WhatsApp if not already sent
        // -----------------------------------

        if (
          !whatsappSent &&
          subscriber.whatsapp_enabled &&
          subscriber.phone_number
        ) {
          try {
            const pdfUrls =
              (venue as Record<string, unknown>)
                .pdf_urls as string[] | undefined;

            let sent = false;

            if (pdfUrls && pdfUrls.length > 0) {
              sent = await sendWhatsAppDocument(
                subscriber.phone_number,
                pdfUrls[0],
                `🏫 ${venue.title}`
              );
            }

            if (!sent) {
              const message =
                formatVenueWhatsAppMessage({
                  title: venue.title,
                  url: venue.url,
                  publishedDate: venue.published_date,
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

              const { error: waLogError } =
                await supabase
                  .from("notification_logs")
                  .insert({
                    subscriber_id: subscriber.id,
                    venue_id: venue.id,
                    channel: "whatsapp",
                  });

              if (waLogError) {
                console.error(
                  `⚠️ Failed to log venue WhatsApp for ${subscriber.email}`,
                  waLogError
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
      "🎉 Venue notification process completed."
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkVenues();
