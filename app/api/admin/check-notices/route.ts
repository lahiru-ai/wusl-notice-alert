import { NextResponse } from "next/server";
import { verifyAdmin, logAdminActivity, adminError } from "@/lib/admin-auth";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

const NOTICES_URL = "https://fas.wyb.ac.lk/notices/";

export async function POST() {
  const { user, error, admin } = await verifyAdmin();
  if (error || !user || !admin) return adminError(error || "Unauthorized");

  try {
    const response = await fetch(NOTICES_URL, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);
    const siteNotices: string[] = [];

    $("h3").each((_, el) => {
      const link = $(el).find("a").attr("href");
      if (link) {
        try {
          siteNotices.push(new URL(link, NOTICES_URL).href);
        } catch {
          // skip invalid URLs
        }
      }
    });

    const { data: existing } = await admin
      .from("notices")
      .select("url");

    const existingUrls = new Set((existing || []).map((n: { url: string }) => n.url));
    const newNotices = siteNotices.filter((url) => !existingUrls.has(url));

    await logAdminActivity(user.id, user.email!, "notice_check", {
      total_on_site: siteNotices.length,
      new_notices: newNotices.length,
    });

    return NextResponse.json({
      new_notices: newNotices.length,
      total_on_site: siteNotices.length,
      existing_in_db: existingUrls.size,
    });
  } catch (e) {
    console.error("Check notices error:", e);
    return adminError("Failed to check notices", 500);
  }
}
