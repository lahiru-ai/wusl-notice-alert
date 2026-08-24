import * as cheerio from "cheerio";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const RESULTS_URL = "https://fas.wyb.ac.lk/results/";

const DRY_RUN = process.env.DRY_RUN === "true";

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
// Result type
// -----------------------------------

type Result = {
  id?: string;
  title: string;
  url: string;
  publishedDate: string | null;
};

// -----------------------------------
// Send result notification
// -----------------------------------

async function sendResultEmail(
  email: string,
  result: Result
) {
  await transporter.sendMail({
    from: `"WUSL Notice Alert" <${smtpUser}>`,
    to: email,
    subject: `🎓 New WUSL Examination Result: ${result.title}`,

    text: `
A new examination result has been published.

${result.title}

Published date:
${result.publishedDate || "Not available"}

View the result:
${result.url}

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
            🎓 New WUSL Examination Result
          </h1>

          <h2>
            ${result.title}
          </h2>

          <p>
            A new examination result has been published by the
            Faculty of Applied Sciences, Wayamba University of Sri Lanka.
          </p>

          <p>
            <strong>Published date:</strong>
            ${result.publishedDate || "Not available"}
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
              View Examination Result →
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

async function checkResults() {
  console.log("🔍 Checking WUSL examination results...");

  if (DRY_RUN) {
    console.log("🧪 DRY RUN MODE ENABLED");
    console.log("📧 No result emails will be sent.");
    console.log("💾 No new results will be saved.");
  }

  try {
    // -----------------------------------
    // 1. Download results page
    // -----------------------------------

    const response = await fetch(RESULTS_URL);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch results: ${response.status}`
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const results: Result[] = [];

    // -----------------------------------
    // 2. Extract results
    // -----------------------------------

    $("h3").each((_, element) => {
      const title = $(element).text().trim();
      const link = $(element).find("a").attr("href");

      if (!title || !link) return;

      const url = new URL(link, RESULTS_URL).href;

      results.push({
        title,
        url,
        publishedDate: null,
      });
    });

    console.log(`📋 Found ${results.length} results.`);

    // -----------------------------------
    // 3. Get existing results
    // -----------------------------------

    const {
      data: existingResults,
      error: existingError,
    } = await supabase
      .from("results")
      .select("id, url");

    if (existingError) {
      throw existingError;
    }

    const existingUrls = new Set(
      (existingResults || []).map(
        (result) => result.url
      )
    );

    // -----------------------------------
    // 4. Find NEW results
    // -----------------------------------

    const newResults = results.filter(
      (result) => !existingUrls.has(result.url)
    );

    console.log(
      `🆕 New results: ${newResults.length}`
    );

    // -----------------------------------
    // 5. No new results
    // -----------------------------------

    if (newResults.length === 0) {
      console.log(
        "✅ No new examination results."
      );

      return;
    }

    // -----------------------------------
    // 6. DRY RUN
    // -----------------------------------

    if (DRY_RUN) {
      console.log("");
      console.log(
        "🧪 New results detected, but nothing will be saved or emailed."
      );

      for (const result of newResults) {
        console.log(`🎓 ${result.title}`);
        console.log(`🔗 ${result.url}`);
        console.log(
          "🧪 DRY RUN: Would save this result and notify subscribed users."
        );
      }

      console.log("");
      console.log(
        "🧪 DRY RUN completed. No result emails were sent."
      );

      return;
    }

    // -----------------------------------
    // 7. Save new results
    // -----------------------------------

    const {
      data: insertedResults,
      error: insertError,
    } = await supabase
      .from("results")
      .insert(
        newResults.map((result) => ({
          title: result.title,
          url: result.url,
          published_date: result.publishedDate,
        }))
      )
      .select("id, title, url, published_date");

    if (insertError) {
      throw insertError;
    }

    console.log(
      "✅ New examination results saved to Supabase."
    );

    // -----------------------------------
    // 8. Get result subscribers
    // -----------------------------------

    const {
      data: subscribers,
      error: subscriberError,
    } = await supabase
      .from("subscribers")
      .select("id, email")
      .eq("result_enabled", true);

    if (subscriberError) {
      throw subscriberError;
    }

    console.log(
      `👥 Result subscribers: ${
        subscribers?.length || 0
      }`
    );

    if (!subscribers || subscribers.length === 0) {
      console.log(
        "⚠️ No users are subscribed to result notifications."
      );

      return;
    }

    // -----------------------------------
    // 9. Send notifications
    // -----------------------------------

    for (const result of insertedResults || []) {
      console.log("");
      console.log(`🎓 ${result.title}`);
      console.log(`🔗 ${result.url}`);

      for (const subscriber of subscribers) {

        // -----------------------------------
        // Check notification log
        // -----------------------------------

        const {
          data: existingLog,
          error: logCheckError,
        } = await supabase
          .from("notification_logs")
          .select("id")
          .eq("subscriber_id", subscriber.id)
          .eq("result_id", result.id)
          .maybeSingle();

        if (logCheckError) {
          throw logCheckError;
        }

        if (existingLog) {
          console.log(
            `⏭️ Already sent to ${subscriber.email}`
          );

          continue;
        }

        // -----------------------------------
        // Send email
        // -----------------------------------

        try {
          await sendResultEmail(
            subscriber.email,
            {
              id: result.id,
              title: result.title,
              url: result.url,
              publishedDate: result.published_date,
            }
          );

          console.log(
            `📧 Email sent to ${subscriber.email}`
          );

          // -----------------------------------
          // Record successful notification
          // -----------------------------------

          const {
            error: logInsertError,
          } = await supabase
            .from("notification_logs")
            .insert({
              subscriber_id: subscriber.id,
              result_id: result.id,
            });

          if (logInsertError) {
            throw logInsertError;
          }

          console.log(
            `📝 Notification logged for ${subscriber.email}`
          );

        } catch (emailError) {
          console.error(
            `❌ Failed to send result email to ${subscriber.email}`,
            emailError
          );
        }
      }
    }

    console.log("");
    console.log(
      "🎉 Examination result notification process completed."
    );

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkResults();