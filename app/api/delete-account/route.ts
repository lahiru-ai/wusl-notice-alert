import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  // CSRF protection: verify the request originated from our own origin
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host || new URL(origin).host !== host) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
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

  // Verify the user is authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Use service-role client for deletion operations
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );

  try {
    // 1. Delete notification logs for this user's subscriber record
    const { data: subscriber } = await admin
      .from("subscribers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriber) {
      await admin
        .from("notification_logs")
        .delete()
        .eq("subscriber_id", subscriber.id);
    }

    // 2. Delete subscriber record
    await admin
      .from("subscribers")
      .delete()
      .eq("user_id", user.id);

    // 3. Delete the Supabase Auth user
    const { error: deleteAuthError } =
      await admin.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      console.error(
        "Failed to delete auth user:",
        deleteAuthError
      );
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    // 4. Sign out (clear session cookies)
    await supabase.auth.signOut();

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
