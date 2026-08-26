import { NextResponse } from "next/server";
import { verifyAdmin, adminError } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, error } = await verifyAdmin();
  if (error || !user) return adminError(error || "Unauthorized");

  const checks = await Promise.allSettled([
    (async () => {
      const admin = createAdminClient();
      const { error } = await admin.from("subscribers").select("id", { count: "exact", head: true });
      return { service: "supabase" as const, status: error ? "error" as const : "healthy" as const, detail: error?.message };
    })(),
    (async () => {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
        });
        await transporter.verify();
        return { service: "smtp" as const, status: "healthy" as const, detail: `${process.env.SMTP_HOST}:${process.env.SMTP_PORT}` };
      } catch (e) {
        return { service: "smtp" as const, status: "error" as const, detail: e instanceof Error ? e.message : "SMTP connection failed" };
      }
    })(),
    (async () => {
      const configured = !!(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
      return {
        service: "whatsapp" as const,
        status: configured ? "healthy" as const : "warning" as const,
        detail: configured ? "API credentials configured" : "API credentials not set",
      };
    })(),
    (async () => {
      try {
        const res = await fetch("https://fas.wyb.ac.lk/notices/", {
          method: "HEAD",
          signal: AbortSignal.timeout(10000),
        });
        return { service: "notice_source" as const, status: res.ok ? "healthy" as const : "error" as const, detail: `HTTP ${res.status}` };
      } catch (e) {
        return { service: "notice_source" as const, status: "error" as const, detail: e instanceof Error ? e.message : "Fetch failed" };
      }
    })(),
  ]);

  const health: Record<string, { status: string; detail?: string }> = {};
  for (const result of checks) {
    if (result.status === "fulfilled") {
      health[result.value.service] = { status: result.value.status, detail: result.value.detail };
    }
  }

  return NextResponse.json({ ...health, checked_at: new Date().toISOString() });
}
