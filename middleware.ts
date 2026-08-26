import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAdminEmail } from "@/lib/admin-config";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey || !serviceKey) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set({ name, value, ...options })
          );
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { getAdminEmails } = await import("@/lib/admin-config");
  const adminEmails = getAdminEmails();
  const match = isAdminEmail(user.email || "");
  console.error("[admin-diag]", JSON.stringify({
    authenticated: true,
    env_admin_emails_set: !!process.env.ADMIN_EMAILS,
    env_admin_emails_raw_length: (process.env.ADMIN_EMAILS || "").length,
    admin_email_count: adminEmails.length,
    admin_email_match: match,
  }));

  if (!match) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check subscriber exists and has is_admin-like access via service-role
  // We just verify email is in ADMIN_EMAILS (already checked above).
  // Store user email in request headers for downstream API routes.
  response.headers.set("x-admin-email", user.email || "");
  response.headers.set("x-admin-user-id", user.id);

  return response;
}
