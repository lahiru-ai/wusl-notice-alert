import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const notices = requestUrl.searchParams.get("notices") === "true";
  const results = requestUrl.searchParams.get("results") === "true";

  if (!code) {
    return NextResponse.redirect(
      new URL("/?error=verification_failed", requestUrl.origin)
    );
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Cookie setting can fail during some server rendering situations.
          }
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL("/?error=verification_failed", requestUrl.origin)
    );
  }

  const user = data.user;

  const { error: subscriberError } = await supabase
    .from("subscribers")
    .upsert(
      {
        user_id: user.id,
        email: user.email,
        notice_enabled: notices,
        result_enabled: results,
      },
      {
        onConflict: "user_id",
      }
    );

  if (subscriberError) {
    console.error("Subscriber error:", subscriberError);

    return NextResponse.redirect(
      new URL("/?error=subscription_failed", requestUrl.origin)
    );
  }

  return NextResponse.redirect(
    new URL("/success", requestUrl.origin)
  );
}