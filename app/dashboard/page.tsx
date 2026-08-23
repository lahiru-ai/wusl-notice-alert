"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Subscriber = {
  id: string;
  email: string;
  notice_enabled: boolean;
  result_enabled: boolean;
};

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      // Get currently logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      // Get this user's notification settings
      const { data, error: subscriberError } = await supabase
        .from("subscribers")
        .select(
          "id, email, notice_enabled, result_enabled"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (subscriberError) {
        console.error(subscriberError);
        setError(
          "Unable to load your notification settings."
        );
        return;
      }

      if (!data) {
        // Create subscriber record if it doesn't exist
        const { data: newSubscriber, error: insertError } =
          await supabase
            .from("subscribers")
            .insert({
              user_id: user.id,
              email: user.email,
              notice_enabled: true,
              result_enabled: true,
            })
            .select(
              "id, email, notice_enabled, result_enabled"
            )
            .single();

        if (insertError) {
          console.error(insertError);
          setError(
            "Unable to create your notification settings."
          );
          return;
        }

        setSubscriber(newSubscriber);
      } else {
        setSubscriber(data);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting(
    field: "notice_enabled" | "result_enabled"
  ) {
    if (!subscriber) return;

    setSaving(true);
    setMessage("");
    setError("");

    const newValue = !subscriber[field];

    // Optimistic UI update
    setSubscriber({
      ...subscriber,
      [field]: newValue,
    });

    try {
      const { error } = await supabase
        .from("subscribers")
        .update({
          [field]: newValue,
        })
        .eq("id", subscriber.id);

      if (error) {
        console.error(error);

        // Revert UI if database update failed
        setSubscriber({
          ...subscriber,
          [field]: !newValue,
        });

        setError(
          "Could not update your notification setting."
        );

        return;
      }

      setMessage("Notification settings updated.");
    } catch (err) {
      console.error(err);

      setSubscriber({
        ...subscriber,
        [field]: !newValue,
      });

      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="text-slate-400">
            Loading your dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-blue-400 uppercase">
              WUSL Notice Alert
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Faculty of Applied Sciences
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
          >
            Log out
          </button>

        </div>
      </header>

      {/* Main */}
      <section className="mx-auto max-w-4xl px-6 py-12">

        {/* Welcome */}
        <div className="mb-10">
          <p className="text-sm font-semibold tracking-[0.2em] text-blue-400 uppercase">
            Dashboard
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Welcome back 👋
          </h1>

          <p className="mt-3 text-slate-400">
            Manage the university notifications you want to
            receive.
          </p>

          {subscriber && (
            <p className="mt-2 text-sm text-slate-500">
              {subscriber.email}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Success */}
        {message && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm text-green-300">
            {message}
          </div>
        )}

        {/* Notification Settings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">

          <div className="mb-7">
            <h2 className="text-2xl font-bold">
              Notification Settings
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Choose which university updates should arrive
              in your inbox.
            </p>
          </div>

          <div className="space-y-4">

            {/* University Notices */}
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                updateSetting("notice_enabled")
              }
              className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-left transition hover:border-blue-500/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                  📢
                </div>

                <div>
                  <h3 className="font-semibold">
                    University Notices
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Important announcements and notices
                  </p>
                </div>

              </div>

              {/* Toggle */}
              <div
                className={`relative h-7 w-12 rounded-full transition ${
                  subscriber?.notice_enabled
                    ? "bg-blue-600"
                    : "bg-slate-700"
                }`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    subscriber?.notice_enabled
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </div>
            </button>

            {/* Examination Results */}
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                updateSetting("result_enabled")
              }
              className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-left transition hover:border-blue-500/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-2xl">
                  📊
                </div>

                <div>
                  <h3 className="font-semibold">
                    Examination Results
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Get notified when new results are published
                  </p>
                </div>

              </div>

              {/* Toggle */}
              <div
                className={`relative h-7 w-12 rounded-full transition ${
                  subscriber?.result_enabled
                    ? "bg-blue-600"
                    : "bg-slate-700"
                }`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    subscriber?.result_enabled
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </div>
            </button>

          </div>

          {/* Saving */}
          {saving && (
            <p className="mt-5 text-center text-sm text-slate-500">
              Saving...
            </p>
          )}

        </div>

        {/* Status */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-sm text-slate-500">
              University Notices
            </p>

            <p
              className={`mt-2 font-semibold ${
                subscriber?.notice_enabled
                  ? "text-green-400"
                  : "text-slate-500"
              }`}
            >
              {subscriber?.notice_enabled
                ? "● Enabled"
                : "● Disabled"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-sm text-slate-500">
              Examination Results
            </p>

            <p
              className={`mt-2 font-semibold ${
                subscriber?.result_enabled
                  ? "text-green-400"
                  : "text-slate-500"
              }`}
            >
              {subscriber?.result_enabled
                ? "● Enabled"
                : "● Disabled"}
            </p>
          </div>

        </div>

      </section>
    </main>
  );
}
