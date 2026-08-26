"use client";

import { useState } from "react";
import LoadingSpinner from "@/components/admin/LoadingSpinner";

type Channel = "email" | "whatsapp";

interface Result {
  success: boolean;
  error?: string;
}

export default function TestCenterPage() {
  const [channel, setChannel] = useState<Channel>("email");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  function handlePrefillMyself() {
    if (channel === "email") {
      setRecipient("admin@wusl.lk");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/test-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, recipient, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ success: false, error: data.error || "Failed to send test notification." });
      } else {
        setResult({ success: true });
        setRecipient("");
        setSubject("");
        setMessage("");
      }
    } catch {
      setResult({ success: false, error: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-full bg-[#020617] text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
            TEST CENTER
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Test Notification Center
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <p className="mb-3 text-sm font-semibold text-slate-300">
                Channel
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setChannel("email")}
                  className={`flex-1 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    channel === "email"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-700 text-slate-200 hover:border-blue-500 hover:text-blue-400"
                  }`}
                >
                  ✉️ Email
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("whatsapp")}
                  className={`flex-1 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    channel === "whatsapp"
                      ? "bg-blue-600 text-white"
                      : "border border-slate-700 text-slate-200 hover:border-blue-500 hover:text-blue-400"
                  }`}
                >
                  💬 WhatsApp
                </button>
              </div>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-200">
                  {channel === "email" ? "Email Address" : "Phone Number"}
                </label>
                {channel === "email" && (
                  <button
                    type="button"
                    onClick={handlePrefillMyself}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Send to myself
                  </button>
                )}
              </div>
              <input
                type={channel === "email" ? "email" : "tel"}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={
                  channel === "email"
                    ? "recipient@example.com"
                    : "07XXXXXXXX or 94XXXXXXXX"
                }
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {channel === "email" && (
              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Test notification subject"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>
            )}

            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your test message here..."
                rows={3}
                required
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
              />
            </div>

            {result && !result.success && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {result.error}
              </div>
            )}

            {result && result.success && (
              <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                Test notification sent successfully!
              </div>
            )}

            {loading ? (
              <LoadingSpinner text="Sending..." />
            ) : (
              <button
                type="submit"
                disabled={loading || !recipient || !message}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send Test Notification
              </button>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
