"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import LoadingSpinner from "@/components/admin/LoadingSpinner";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

interface SubscriberDetail {
  id: string;
  email: string;
  phone_number: string | null;
  email_enabled: boolean;
  notice_enabled: boolean;
  result_enabled: boolean;
  venue_enabled: boolean;
  whatsapp_enabled: boolean;
  created_at: string;
  user_id: string;
}

interface TimelineEntry {
  id: string;
  channel: string;
  status: string;
  sent_at: string;
  error_message?: string;
  notice_title?: string | null;
  notice_url?: string | null;
  result_title?: string | null;
  result_url?: string | null;
  venue_title?: string | null;
  venue_url?: string | null;
}

interface PageData {
  subscriber: SubscriberDetail;
  timeline: TimelineEntry[];
}

interface Preferences {
  email_enabled: boolean;
  notice_enabled: boolean;
  result_enabled: boolean;
  venue_enabled: boolean;
  whatsapp_enabled: boolean;
}

export default function SubscriberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [initialPrefs, setInitialPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  const hasChanges = prefs && initialPrefs && JSON.stringify(prefs) !== JSON.stringify(initialPrefs);

  useEffect(() => {
    async function fetchSubscriber() {
      try {
        const res = await fetch(`/api/admin/subscribers/${id}`);
        if (!res.ok) throw new Error("Failed to fetch subscriber");
        const data: PageData = await res.json();
        setPageData(data);
        const p: Preferences = {
          email_enabled: data.subscriber.email_enabled,
          notice_enabled: data.subscriber.notice_enabled,
          result_enabled: data.subscriber.result_enabled,
          venue_enabled: data.subscriber.venue_enabled,
          whatsapp_enabled: data.subscriber.whatsapp_enabled,
        };
        setPrefs(p);
        setInitialPrefs(p);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load subscriber");
      } finally {
        setLoading(false);
      }
    }
    fetchSubscriber();
  }, [id]);

  function formatDateTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getTitle(log: TimelineEntry) {
    return log.notice_title || log.result_title || log.venue_title || "—";
  }

  function togglePref(key: keyof Preferences) {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaveMessage(null);

    if (!updated[key]) {
      const labels: Record<keyof Preferences, string> = {
        email_enabled: "Email Notifications",
        notice_enabled: "Notice Notifications",
        result_enabled: "Result Notifications",
        venue_enabled: "Venue Notifications",
        whatsapp_enabled: "WhatsApp Notifications",
      };
      setConfirmMessage(
        `Turn off ${labels[key]} for this subscriber? They will no longer receive ${labels[key].toLowerCase()}.`
      );
      setConfirmOpen(true);
    }
  }

  function confirmToggle() {
    setConfirmOpen(false);
  }

  function cancelToggle() {
    setConfirmOpen(false);
    if (prefs && initialPrefs) {
      setPrefs({ ...initialPrefs });
    }
  }

  async function savePreferences() {
    if (!prefs || !hasChanges) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/admin/subscribers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save preferences");
      }

      const data = await res.json();
      const updated: Preferences = {
        email_enabled: data.subscriber.email_enabled,
        notice_enabled: data.subscriber.notice_enabled,
        result_enabled: data.subscriber.result_enabled,
        venue_enabled: data.subscriber.venue_enabled,
        whatsapp_enabled: data.subscriber.whatsapp_enabled,
      };
      setPrefs(updated);
      setInitialPrefs(updated);
      setSaveMessage({ type: "success", text: "Preferences saved successfully." });
    } catch (err: unknown) {
      setSaveMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save preferences",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-full bg-[#020617] p-8">
        <LoadingSpinner text="Loading subscriber..." />
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-full bg-[#020617] p-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-red-400">{error || "Subscriber not found"}</p>
          <Link
            href="/admin/subscribers"
            className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Back to Subscribers
          </Link>
        </div>
      </div>
    );
  }

  const { subscriber, timeline } = pageData;

  return (
    <div className="min-h-full bg-[#020617] p-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-blue-500 hover:text-blue-400"
        >
          ← Back to Subscribers
        </button>

        <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
          SUBSCRIBER
        </p>
        <h2 className="mt-3 text-3xl font-bold">{subscriber.email}</h2>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email
              </p>
              <p className="mt-1 text-slate-200">{subscriber.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Phone Number
              </p>
              <p className="mt-1 text-slate-200">
                {subscriber.phone_number || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Notice Notifications
              </p>
              <div className="mt-1">
                <StatusBadge
                  status={subscriber.notice_enabled ? "enabled" : "disabled"}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Result Notifications
              </p>
              <div className="mt-1">
                <StatusBadge
                  status={subscriber.result_enabled ? "enabled" : "disabled"}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Venue Notifications
              </p>
              <div className="mt-1">
                <StatusBadge
                  status={subscriber.venue_enabled ? "enabled" : "disabled"}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                WhatsApp
              </p>
              <div className="mt-1">
                <StatusBadge
                  status={subscriber.whatsapp_enabled ? "enabled" : "disabled"}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Joined
              </p>
              <p className="mt-1 text-slate-200">
                {formatDateTime(subscriber.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                User ID
              </p>
              <p className="mt-1 font-mono text-sm text-slate-200">
                {subscriber.user_id}
              </p>
            </div>
          </div>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          title="Confirm Preference Change"
          message={confirmMessage}
          confirmLabel="Turn Off"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmToggle}
          onCancel={cancelToggle}
        />

        <div className="mt-10">
          <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
            NOTIFICATION PREFERENCES
          </p>
          <h2 className="mt-3 text-3xl font-bold">Manage Preferences</h2>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
            <p className="text-sm text-slate-400">
              Control which notifications this subscriber receives. Changes take effect on the next notification cycle.
            </p>

            {prefs && (
              <div className="mt-6 space-y-1">
                {([
                  ["email_enabled", "Email Notifications", "Master switch — disables all email notifications when off"],
                  ["notice_enabled", "Notice Notifications", "University notice updates"],
                  ["result_enabled", "Result Notifications", "Examination result updates"],
                  ["venue_enabled", "Venue Notifications", "Examination venue updates"],
                  ["whatsapp_enabled", "WhatsApp Notifications", "WhatsApp channel (requires phone number)"],
                ] as const).map(([key, label, description]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/50 px-5 py-4 transition hover:border-slate-700"
                  >
                    <div>
                      <p className="font-semibold text-slate-100">{label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePref(key)}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                        prefs[key] ? "bg-blue-600" : "bg-slate-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          prefs[key] ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {saveMessage && (
              <div
                className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
                  saveMessage.type === "success"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            <div className="mt-6 flex items-center gap-4">
              <button
                type="button"
                disabled={saving || !hasChanges}
                onClick={savePreferences}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              {hasChanges && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    if (initialPrefs) setPrefs({ ...initialPrefs });
                    setSaveMessage(null);
                  }}
                  className="rounded-xl border border-slate-700 px-6 py-3 font-semibold text-slate-300 transition hover:border-slate-500"
                >
                  Discard
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
            TIMELINE
          </p>
          <h2 className="mt-3 text-3xl font-bold">Notification Timeline</h2>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
            {timeline && timeline.length > 0 ? (
              <div className="relative ml-4 border-l-2 border-slate-700 pl-8">
                {timeline.map((log) => {
                  const dotColor =
                    log.status === "sent"
                      ? "bg-green-500"
                      : log.status === "failed"
                        ? "bg-red-500"
                        : "bg-amber-500";
                  return (
                    <div key={log.id} className="relative mb-8 last:mb-0">
                      <div
                        className={`absolute -left-[39px] top-1 h-3 w-3 rounded-full ${dotColor}`}
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-slate-100">
                          {getTitle(log)}
                        </p>
                        <StatusBadge status={log.channel} size="sm" />
                        <StatusBadge status={log.status} size="sm" />
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatDateTime(log.sent_at)}
                      </p>
                      {log.status === "failed" && log.error_message && (
                        <p className="mt-1 text-sm text-red-400">
                          {log.error_message}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                No notifications sent yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
