import dotenv from "dotenv";
import path from "path";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

dotenv.config({
  path: path.resolve(process.cwd(), ".env.local"),
});

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
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
  );
}

if (!smtpHost || !smtpUser || !smtpPassword) {
  throw new Error(
    "Missing SMTP_HOST, SMTP_USER or SMTP_PASSWORD."
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
// Send result email
// -----------------------------------

async function sendResultNotification() {
  console.log("🔍 Testing examination result notification...");

  try {
    // Get latest result
    const { data: result, error: resultError } =
      await supabase
        .from("results")
        .select("title, url, published_date")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (resultError) {
      throw resultError;
    }

    console.log(`📢 Result: ${result.title}`);

    // Get result subscribers
    const {
      data: subscribers,
      error: subscriberError,
    } = await supabase
      .from("subscribers")
      .select("email")
      .eq("result_enabled", true);

    if (subscriberError) {
      throw subscriberError;
    }

    console.log(
      `👥 Result subscribers: ${subscribers?.length || 0}`
    );

    if (!subscribers || subscribers.length === 0) {
      console.log("⚠️ No result subscribers.");
      return;
    }

    // Send email
    for (const subscriber of subscribers) {
      await transporter.sendMail({
        from: `"WUSL Notice Alert" <${smtpUser}>`,
        to: subscriber.email,
        subject: `📊 New WUSL Examination Result: ${result.title}`,

        text: `
A new WUSL examination result has been published.

${result.title}

Published date:
${result.published_date || "Not available"}

View the result:
${result.url}

You are receiving this email because you subscribed
to WUSL examination result notifications.
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
                📊 New WUSL Examination Result
              </h1>

              <h2>
                ${result.title}
              </h2>

              <p>
                A new examination result has been published by
                the Faculty of Applied Sciences,
                Wayamba University of Sri Lanka.
              </p>

              <p>
                <strong>Published date:</strong>
                ${result.published_date || "Not available"}
              </p>

              <p style="margin-top: 25px;">
                <a
                  href="${result.url}"
                  style="
                    display: inline-block;
                    padding: 12px 20px;
                    background: #2563eb;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                  "
                >
                  View Result →
                </a>
              </p>

              <hr style="
                margin: 30px 0;
                border: none;
                border-top: 1px solid #ddd;
              ">

              <p style="
                font-size: 12px;
                color: #777;
              ">
                You are receiving this email because you subscribed
                to WUSL examination result notifications.
              </p>

            </div>
          </div>
        `,
      });

      console.log(
        `📧 Email sent to ${subscriber.email}`
      );
    }

    console.log("");
    console.log("🎉 Result notification test completed.");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

sendResultNotification();