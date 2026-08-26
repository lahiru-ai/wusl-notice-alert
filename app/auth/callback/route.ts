import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  // No authorization code
  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=verification_failed", requestUrl.origin)
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
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore cookie errors during rendering.
          }
        },
      },
    }
  );

  // Exchange the PKCE authorization code for a session
  const { data, error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("Auth callback error:", error);

    return NextResponse.redirect(
      new URL("/login?error=verification_failed", requestUrl.origin)
    );
  }

  const user = data.user;

  /*
   * PASSWORD RESET
   *
   * If the reset-password flow sent us here with:
   * ?next=/reset-password
   *
   * send the authenticated user to the password reset page.
   */
  if (next === "/reset-password") {
    return NextResponse.redirect(
      new URL("/reset-password", requestUrl.origin)
    );
  }

  /*
   * EMAIL VERIFICATION / NORMAL AUTH CALLBACK
   *
   * Check whether this user already has a subscriber record.
   */
  const {
    data: existingSubscriber,
    error: subscriberCheckError,
  } = await supabase
    .from("subscribers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriberCheckError) {
    console.error(
      "Subscriber check error:",
      subscriberCheckError
    );

    return NextResponse.redirect(
      new URL(
        "/login?error=subscription_failed",
        requestUrl.origin
      )
    );
  }

  /*
   * Create subscriber record only if it doesn't exist.
   */
  if (!existingSubscriber) {
    const { error: insertError } = await supabase
      .from("subscribers")
      .insert({
        user_id: user.id,
        email: user.email,
        notice_enabled: true,
        result_enabled: true,
        venue_enabled: true,
        whatsapp_enabled: false,
      });

    if (insertError) {
      console.error(
        "Subscriber creation error:",
        insertError
      );

      return NextResponse.redirect(
        new URL(
          "/login?error=subscription_failed",
          requestUrl.origin
        )
      );
    }
  } else {
    // Keep existing notification preferences.
    await supabase
      .from("subscribers")
      .update({
        email: user.email,
      })
      .eq("user_id", user.id);
  }

  /*
   * Normal email verification completed.
   */
  return NextResponse.redirect(
    new URL("/dashboard", requestUrl.origin)
  );
}