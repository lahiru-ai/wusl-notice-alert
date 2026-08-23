import dotenv from "dotenv";
import path from "path";
import * as cheerio from "cheerio";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});

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

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}

if (!smtpHost || !smtpUser || !smtpPassword) {
  throw new Error(
    "Missing SMTP_HOST, SMTP_USER or SMTP_PASSWORD in .env.local"
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
  }
) {
  await transporter.sendMail({
    from: `"WUSL Notice Alert" <${smtpUser}>`,
    to: email,
    subject: `📢 New WUSL Notice: ${notice.title}`,

    text: `
A new WUSL notice has been published.

${notice.title}

Published date:
${notice.publishedDate || "Not available"}

View the notice:
${notice.url}

You are receiving this email because you subscribed to WUSL Notice Alert.
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
              View Notice →
            </a>
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

          <p style="font-size: 12px; color: #777;">
            You are receiving this email because you subscribed
            to WUSL Notice Alert.
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

    const { data: existingNotices, error: existingError } =
      await supabase
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

    const { error: insertError } = await supabase
      .from("notices")
      .insert(
        newNotices.map((notice) => ({
          title: notice.title,
          url: notice.url,
          published_date: notice.publishedDate,
        }))
      );

    if (insertError) {
      throw insertError;
    }

    console.log(
      "✅ New notices saved to Supabase."
    );

    // -----------------------------------
    // 7. Get notice subscribers
    // -----------------------------------

    const { data: subscribers, error: subscriberError } =
      await supabase
        .from("subscribers")
        .select("email")
        .eq("notice_enabled", true);

    if (subscriberError) {
      throw subscriberError;
    }

    console.log(
      `👥 Notice subscribers: ${subscribers?.length || 0}`
    );

    if (!subscribers || subscribers.length === 0) {
      console.log(
        "⚠️ No users are subscribed to notice notifications."
      );

      return;
    }

    // -----------------------------------
    // 8. Send emails
    // -----------------------------------

    for (const notice of newNotices) {
      console.log("");
      console.log(`📢 ${notice.title}`);
      console.log(`🔗 ${notice.url}`);

      for (const subscriber of subscribers) {
        try {
          await sendNotificationEmail(
            subscriber.email,
            notice
          );

          console.log(
            `📧 Email sent to ${subscriber.email}`
          );
        } catch (emailError) {
          console.error(
            `❌ Failed to send email to ${subscriber.email}`,
            emailError
          );
        }
      }
    }

    console.log("");
    console.log("🎉 Notification process completed.");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkNotices();