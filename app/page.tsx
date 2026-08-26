"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white">
      {/* =========================
          HEADER
      ========================== */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        {/* Logo / Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl">
            🎓
          </div>

          <div>
            <h1 className="text-lg font-bold leading-tight">
              WUSL Notice Alert
            </h1>

            <p className="text-sm text-slate-400">
              Faculty of Applied Sciences
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-blue-500 hover:text-blue-400"
          >
            Log In
          </Link>

          <Link
            href="/signup"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* =========================
          HERO SECTION
      ========================== */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* LEFT SIDE */}
          <div>
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              Automated university alerts
            </div>

            {/* Heading */}
            <h2 className="max-w-2xl text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Never miss an important{" "}
              <span className="text-blue-400">
                university update.
              </span>
            </h2>

            {/* Description */}
            <p className="mt-8 max-w-xl text-lg leading-8 text-slate-400">
              Get notified by email or WhatsApp when new university
              notices, examination results, and venue updates are
              published.
            </p>

            {/* Feature Cards */}
            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {/* New Notices */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-blue-500/40">
                <div className="mb-5 text-2xl">
                  📢
                </div>

                <h3 className="text-lg font-bold">
                  New Notices
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Receive important university announcements.
                </p>
              </div>

              {/* Exam Results */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-blue-500/40">
                <div className="mb-5 text-2xl">
                  📊
                </div>

                <h3 className="text-lg font-bold">
                  Exam Results
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Know when new results are published.
                </p>
              </div>

              {/* Exam Venue */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-blue-500/40">
                <div className="mb-5 text-2xl">
                  🏫
                </div>

                <h3 className="text-lg font-bold">
                  Exam Venue
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Get venue and exam hall assignment updates.
                </p>
              </div>

              {/* WhatsApp */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-blue-500/40">
                <div className="mb-5 text-2xl">
                  💬
                </div>

                <h3 className="text-lg font-bold">
                  WhatsApp Alerts
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Receive notifications directly on WhatsApp.
                </p>
              </div>

              {/* Automatic */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-blue-500/40">
                <div className="mb-5 text-2xl">
                  ⚡
                </div>

                <h3 className="text-lg font-bold">
                  Automatic
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Notices are checked automatically for new updates.
                </p>
              </div>

              {/* Verified Email */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-blue-500/40">
                <div className="mb-5 text-2xl">
                  🔐
                </div>

                <h3 className="text-lg font-bold">
                  Verified Email
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Your account is protected with secure authentication.
                </p>
              </div>
            </div>
          </div>

          {/* =========================
              RIGHT SIDE
          ========================== */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl sm:p-9">
            {/* Label */}
            <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
              GET STARTED
            </p>

            <h3 className="mt-3 text-3xl font-bold">
              Get alerts in your inbox
            </h3>

            <p className="mt-4 leading-7 text-slate-400">
              Create an account and choose the university notifications
              you want to receive.
            </p>

            {/* Notification options */}
            <div className="mt-8 space-y-4">
              {/* Notices */}
              <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm">
                  ✓
                </div>

                <div>
                  <h4 className="font-semibold">
                    University Notices
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Important announcements and notices
                  </p>
                </div>
              </div>

              {/* Results */}
              <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm">
                  ✓
                </div>

                <div>
                  <h4 className="font-semibold">
                    Examination Results
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Notifications when new results appear
                  </p>
                </div>
              </div>

              {/* Venue */}
              <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-sm">
                  ✓
                </div>

                <div>
                  <h4 className="font-semibold">
                    Examination Venue
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Venue and exam hall assignment updates
                  </p>
                </div>
              </div>
            </div>

            {/* Main CTA */}
            <Link
              href="/signup"
              className="mt-7 flex w-full items-center justify-center rounded-xl bg-blue-600 px-5 py-4 font-bold text-white transition hover:bg-blue-500"
            >
              Create Your Free Account →
            </Link>

            {/* Login */}
            <p className="mt-5 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-400 hover:text-blue-300"
              >
                Log in
              </Link>
            </p>

            {/* Security */}
            <p className="mt-7 text-center text-xs text-slate-600">
              🔐 Secure authentication powered by Supabase
            </p>
          </div>
        </div>
      </section>

      {/* =========================
          HOW IT WORKS
      ========================== */}
      <section className="border-t border-slate-900 bg-slate-950/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center">
            <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
              HOW IT WORKS
            </p>

              <h2 className="mt-3 text-3xl font-bold">
              Simple. Automatic. Reliable.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Set up your account once and let WUSL Notice Alert keep
              watch for important university updates via email or
              WhatsApp.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold">
                1
              </div>

              <h3 className="mt-5 text-xl font-bold">
                Create an account
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Sign up using your email address and verify your account.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold">
                2
              </div>

              <h3 className="mt-5 text-xl font-bold">
                Choose notifications
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Select whether you want university notices, examination
                results, exam venue updates, or all three.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold">
                3
              </div>

              <h3 className="mt-5 text-xl font-bold">
                Receive alerts
              </h3>

              <p className="mt-3 leading-7 text-slate-400">
                Get notified via email or WhatsApp when a new
                university update is published.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="border-t border-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} WUSL Notice Alert
          </p>

          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="transition hover:text-blue-400"
            >
              Log In
            </Link>

            <Link
              href="/signup"
              className="transition hover:text-blue-400"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}