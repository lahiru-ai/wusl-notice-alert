"use client";

import { useState, useEffect, useMemo } from "react";
import LoadingSpinner from "@/components/admin/LoadingSpinner";

type Target = "all" | "email" | "whatsapp" | "selected";
type Channel = "email" | "whatsapp" | "both";

interface Subscriber {
  id: string;
  email: string;
  phone_number: string | null;
  notice_enabled: boolean;
  result_enabled: boolean;
  venue_enabled: boolean;
  whatsapp_enabled: boolean;
}

interface SendResult {
  sent: number;
  failed: number;
  details: { id: string; status: string; error?: string }[];
}

const STEPS = [
  { num: 1, label: "Recipients" },
  { num: 2, label: "Channel" },
  { num: 3, label: "Message" },
  { num: 4, label: "Confirm" },
];

export default function ManualNotifyPage() {
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState<Target>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<Channel>("email");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  const filteredSubscribers = useMemo(() => {
    if (!subscriberSearch) return subscribers;
    const q = subscriberSearch.toLowerCase();
    return subscribers.filter(
      (s) =>
        s.email.toLowerCase().includes(q) ||
        (s.phone_number && s.phone_number.includes(q))
    );
  }, [subscribers, subscriberSearch]);

  useEffect(() => {
    if (target === "selected" && subscribers.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingSubscribers(true);
      fetch("/api/admin/subscribers?limit=100")
        .then((r) => r.json())
        .then((data) => {
          setSubscribers(data.subscribers || data || []);
        })
        .catch(() => {})
        .finally(() => setLoadingSubscribers(false));
    }
  }, [target, subscribers.length]);

  function toggleSubscriber(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllVisible() {
    const visibleIds = filteredSubscribers.map((s) => s.id);
    const allSelected = visibleIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => {
        if (allSelected) {
          next.delete(id);
        } else {
          next.add(id);
        }
      });
      return next;
    });
  }

  function getTargetDescription(): string {
    switch (target) {
      case "all":
        return "All Subscribers";
      case "email":
        return "Email Subscribers";
      case "whatsapp":
        return "WhatsApp Subscribers";
      case "selected":
        return `${selectedIds.size} Selected Subscriber${selectedIds.size !== 1 ? "s" : ""}`;
      default:
        return "";
    }
  }

  function getChannelDescription(): string {
    switch (channel) {
      case "email":
        return "Email";
      case "whatsapp":
        return "WhatsApp";
      case "both":
        return "Email + WhatsApp";
      default:
        return "";
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 1:
        if (target === "selected") return selectedIds.size > 0;
        return true;
      case 2:
        return true;
      case 3:
        return message.trim().length > 0;
      default:
        return true;
    }
  }

  async function handleSend() {
    setLoading(true);
    setResult(null);

    try {
      const body: Record<string, unknown> = {
        target,
        channel,
        subject,
        message,
      };

      if (target === "selected") {
        body.subscriber_ids = Array.from(selectedIds);
      }

      const res = await fetch("/api/admin/manual-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ sent: 0, failed: 0, details: [{ id: "", status: "error", error: data.error || "Failed to send." }] });
      } else {
        setResult(data);
      }
    } catch {
      setResult({ sent: 0, failed: 0, details: [{ id: "", status: "error", error: "Something went wrong." }] });
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <main className="min-h-full bg-[#020617] text-white">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
              MANUAL NOTIFY
            </p>
            <h2 className="mt-3 text-3xl font-bold">
              Manual Notification
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
            {result.failed > 0 && result.sent === 0 && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {result.details[0]?.error || "All notifications failed."}
              </div>
            )}

            {result.sent > 0 && (
              <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                {result.sent} notification{result.sent !== 1 ? "s" : ""} sent successfully.
                {result.failed > 0 && ` ${result.failed} failed.`}
              </div>
            )}

            {result.sent === 0 && result.failed === 0 && !result.details[0]?.error && (
              <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                No notifications were sent. Check your target and channel settings.
              </div>
            )}

            <div className="mb-6 space-y-3 rounded-xl border border-slate-700 bg-slate-950 p-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Target</span>
                <span className="font-medium text-white">{getTargetDescription()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Channel</span>
                <span className="font-medium text-white">{getChannelDescription()}</span>
              </div>
              {subject && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subject</span>
                  <span className="font-medium text-white">{subject}</span>
                </div>
              )}
              <div className="border-t border-slate-700 pt-3">
                <p className="text-xs text-slate-500">Message Preview</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{message}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setResult(null);
                setStep(1);
                setTarget("all");
                setSelectedIds(new Set());
                setChannel("email");
                setSubject("");
                setMessage("");
              }}
              className="w-full rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-blue-500 hover:text-blue-400"
            >
              Send Another Notification
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-[#020617] text-white">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
            MANUAL NOTIFY
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Manual Notification
          </h2>
        </div>

        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
                  step === s.num
                    ? "bg-blue-600 text-white"
                    : step > s.num
                      ? "bg-blue-600/20 text-blue-400"
                      : "bg-slate-800 text-slate-500"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  step === s.num ? "text-white" : "text-slate-500"
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-3 h-px w-8 ${
                    step > s.num ? "bg-blue-600" : "bg-slate-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
          {step === 1 && (
            <div>
              <p className="mb-5 text-sm font-semibold text-slate-300">
                Select Recipients
              </p>
              <div className="space-y-3">
                {(
                  [
                    { value: "all" as Target, label: "All Subscribers", icon: "👥", desc: "Everyone subscribed" },
                    { value: "email" as Target, label: "Email Subscribers", icon: "✉️", desc: "Users with email enabled" },
                    { value: "whatsapp" as Target, label: "WhatsApp Subscribers", icon: "💬", desc: "Users with WhatsApp enabled" },
                    { value: "selected" as Target, label: "Selected Subscribers", icon: "☑️", desc: "Pick specific users" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTarget(opt.value)}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                      target === opt.value
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 bg-slate-950 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-lg">
                      {opt.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{opt.label}</p>
                      <p className="text-sm text-slate-500">{opt.desc}</p>
                    </div>
                    <div className="ml-auto">
                      <div
                        className={`h-5 w-5 rounded-full border-2 ${
                          target === opt.value
                            ? "border-blue-500 bg-blue-500"
                            : "border-slate-600"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>

              {target === "selected" && (
                <div className="mt-5">
                  {loadingSubscribers ? (
                    <LoadingSpinner text="Loading subscribers..." />
                  ) : (
                    <>
                      <div className="mb-3 flex items-center gap-3">
                        <input
                          type="text"
                          value={subscriberSearch}
                          onChange={(e) => setSubscriberSearch(e.target.value)}
                          placeholder="Search by email or phone..."
                          className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={toggleAllVisible}
                          className="whitespace-nowrap rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-blue-500 hover:text-blue-400"
                        >
                          {filteredSubscribers.every((s) => selectedIds.has(s.id))
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      </div>

                      <p className="mb-2 text-sm text-slate-500">
                        {selectedIds.size} selected
                      </p>

                      <div className="max-h-72 space-y-2 overflow-y-auto">
                        {filteredSubscribers.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => toggleSubscriber(sub.id)}
                            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                              selectedIds.has(sub.id)
                                ? "border-blue-500 bg-blue-500/10"
                                : "border-slate-700 bg-slate-950 hover:border-slate-600"
                            }`}
                          >
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                selectedIds.has(sub.id)
                                  ? "border-blue-500 bg-blue-500 text-white"
                                  : "border-slate-600"
                              }`}
                            >
                              {selectedIds.has(sub.id) && (
                                <span className="text-xs">✓</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">
                                {sub.email}
                              </p>
                              {sub.phone_number && (
                                <p className="text-xs text-slate-500">
                                  {sub.phone_number}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}

                        {filteredSubscribers.length === 0 && (
                          <p className="py-6 text-center text-sm text-slate-500">
                            No subscribers found.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="mb-5 text-sm font-semibold text-slate-300">
                Select Channel
              </p>
              <div className="flex gap-3">
                {(
                  [
                    { value: "email" as Channel, label: "✉️ Email" },
                    { value: "whatsapp" as Channel, label: "💬 WhatsApp" },
                    { value: "both" as Channel, label: "📧 Both" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setChannel(opt.value)}
                    className={`flex-1 rounded-xl px-5 py-4 text-sm font-semibold transition ${
                      channel === opt.value
                        ? "bg-blue-600 text-white"
                        : "border border-slate-700 text-slate-200 hover:border-blue-500 hover:text-blue-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-5 text-sm font-semibold text-slate-300">
                Compose Message
              </p>
              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Notification subject (optional)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your notification message..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="mb-5 text-sm font-semibold text-slate-300">
                Confirm & Send
              </p>
              <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950 p-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Target</span>
                  <span className="font-medium text-white">
                    {getTargetDescription()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Channel</span>
                  <span className="font-medium text-white">
                    {getChannelDescription()}
                  </span>
                </div>
                {subject && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subject</span>
                    <span className="font-medium text-white">{subject}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-3">
                  <p className="text-xs text-slate-500">Message Preview</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                    {message || "(empty)"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-7 flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-blue-500 hover:text-blue-400 disabled:opacity-50"
              >
                Back
              </button>
            )}

            <div className="flex-1" />

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending..." : "Confirm & Send"}
              </button>
            )}
          </div>

          {loading && (
            <div className="mt-5">
              <LoadingSpinner text="Sending notifications..." />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
