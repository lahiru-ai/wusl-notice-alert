"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function Home() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [notices, setNotices] = useState(true);
  const [results, setResults] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (!notices && !results) {
      setError("Please select at least one notification type.");
      setLoading(false);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?notices=${notices}&results=${results}`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage(
        "Check your email. We sent you a secure verification link."
      );
      setEmail("");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl">
            🎓
          </div>

          <div>
            <h1 className="font-bold tracking-tight">WUSL Notice Alert</h1>
            <p className="text-xs text-slate-400">Faculty of Applied Sciences</p>
          </div>
        </div>

        <div className="hidden rounded-full border border-slate-800 px-4 py-2 text-sm text-slate-400 sm:block">
          Free notification service
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Left */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Automated university alerts
            </div>

            <h2 className="max-w-3xl text-5xl font-black leading-tight tracking-tight sm:text-6xl">
              Never miss an important{" "}
              <span className="text-blue-400">university update.</span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
              Get notified by email when new university notices and
              examination results are published.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Feature
                icon="📢"
                title="New Notices"
                text="Receive important university announcements."
              />

              <Feature
                icon="📊"
                title="Exam Results"
                text="Know when new results are published."
              />

              <Feature
                icon="⚡"
                title="Automatic"
                text="The system checks the university website automatically."
              />

              <Feature
                icon="🔒"
                title="Verified Email"
                text="Only verified email addresses receive alerts."
              />
            </div>
          </div>

          {/* Subscription card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-blue-950/20 sm:p-9">
            <div className="mb-7">
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                Subscribe
              </p>

              <h3 className="mt-2 text-3xl font-bold">
                Get alerts in your inbox
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Enter your email and choose the notifications you want.
                We&apos;ll send you a secure verification link.
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-200"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={notices}
                    onChange={(e) => setNotices(e.target.checked)}
                    className="h-5 w-5 accent-blue-500"
                  />

                  <div>
                    <p className="font-medium">University Notices</p>
                    <p className="text-sm text-slate-500">
                      Important announcements and notices
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={results}
                    onChange={(e) => setResults(e.target.checked)}
                    className="h-5 w-5 accent-blue-500"
                  />

                  <div>
                    <p className="font-medium">Examination Results</p>
                    <p className="text-sm text-slate-500">
                      Notifications when new results appear
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-5 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending verification..." : "Subscribe for Free →"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-5 text-slate-600">
              No password required. You can unsubscribe from notifications
              anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-600">
          WUSL Notice Alert · Automated notification service
        </div>
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 text-xl">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-slate-500">{text}</p>
    </div>
  );
}