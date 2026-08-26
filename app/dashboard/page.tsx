"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Subscriber = {
  id: string;
  email: string;
  email_enabled: boolean;
  notice_enabled: boolean;
  result_enabled: boolean;
  venue_enabled: boolean;
  whatsapp_enabled: boolean;
  phone_number: string | null;
};

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [subscriber, setSubscriber] =
    useState<Subscriber | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] =
    useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Phone number editing
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error: subscriberError } = await supabase
        .from("subscribers")
        .select(
          "id, email, email_enabled, notice_enabled, result_enabled, venue_enabled, whatsapp_enabled, phone_number"
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
        const {
          data: newSubscriber,
          error: insertError,
        } = await supabase
          .from("subscribers")
          .insert({
            user_id: user.id,
            email: user.email,
            email_enabled: true,
            notice_enabled: true,
            result_enabled: true,
            venue_enabled: true,
            whatsapp_enabled: false,
          })
          .select(
            "id, email, email_enabled, notice_enabled, result_enabled, venue_enabled, whatsapp_enabled, phone_number"
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateSetting(
    field:
      | "notice_enabled"
      | "result_enabled"
      | "venue_enabled"
      | "whatsapp_enabled"
  ) {
    if (!subscriber) return;

    setSaving(true);
    setMessage("");
    setError("");

    const newValue = !subscriber[field];

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

  async function savePhoneNumber() {
    if (!subscriber) return;

    setSaving(true);
    setMessage("");
    setError("");

    // Basic validation: digits only, 9-15 chars
    const cleaned = phoneInput.replace(/[\s\-+()]/g, "");

    if (!/^\d{9,15}$/.test(cleaned)) {
      setError(
        "Invalid phone number. Use format: 07XXXXXXXX or 94XXXXXXXX."
      );
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("subscribers")
        .update({
          phone_number: cleaned,
        })
        .eq("id", subscriber.id);

      if (error) {
        console.error(error);
        setError("Could not save phone number.");
        return;
      }

      setSubscriber({
        ...subscriber,
        phone_number: cleaned,
      });

      setEditingPhone(false);
      setMessage("Phone number saved.");
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!subscriber) return;

    if (deleteConfirm !== "DELETE") {
      setDeleteError(
        'Type DELETE to confirm account deletion.'
      );
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(
          data.error || "Failed to delete account."
        );
        return;
      }

      router.replace("/");
    } catch (err) {
      console.error(err);
      setDeleteError(
        "Something went wrong. Please try again."
      );
    } finally {
      setDeleting(false);
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

        {/* ============================================ */}
        {/* NOTIFICATION TYPES                           */}
        {/* ============================================ */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
          <div className="mb-7">
            <h2 className="text-2xl font-bold">
              Notification Types
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Choose which university updates you want to
              receive.
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
                    Get notified when new results are
                    published
                  </p>
                </div>
              </div>

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

            {/* Examination Venue */}
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                updateSetting("venue_enabled")
              }
              className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-left transition hover:border-blue-500/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-2xl">
                  🏫
                </div>

                <div>
                  <h3 className="font-semibold">
                    Examination Venue
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Venue assignments and exam hall updates
                  </p>
                </div>
              </div>

              <div
                className={`relative h-7 w-12 rounded-full transition ${
                  subscriber?.venue_enabled
                    ? "bg-blue-600"
                    : "bg-slate-700"
                }`}
              >
                <div
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    subscriber?.venue_enabled
                      ? "left-6"
                      : "left-1"
                  }`}
                />
              </div>
            </button>
          </div>

          {saving && (
            <p className="mt-5 text-center text-sm text-slate-500">
              Saving...
            </p>
          )}
        </div>

        {/* ============================================ */}
        {/* NOTIFICATION CHANNELS                        */}
        {/* ============================================ */}

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
          <div className="mb-7">
            <h2 className="text-2xl font-bold">
              Notification Channels
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Choose how you want to receive notifications.
            </p>
          </div>

          <div className="space-y-4">
            {/* WhatsApp */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-2xl">
                    💬
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      WhatsApp
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Receive notifications via WhatsApp
                      messages
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    updateSetting("whatsapp_enabled")
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    subscriber?.whatsapp_enabled
                      ? "bg-blue-600"
                      : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                      subscriber?.whatsapp_enabled
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Phone number section */}
              {subscriber?.whatsapp_enabled && (
                <div className="mt-5 border-t border-slate-800 pt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Phone Number
                  </label>

                  {editingPhone ? (
                    <div className="flex gap-3">
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) =>
                          setPhoneInput(e.target.value)
                        }
                        placeholder="07XXXXXXXX or 94XXXXXXXX"
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                      />

                      <button
                        type="button"
                        disabled={saving}
                        onClick={savePhoneNumber}
                        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          setEditingPhone(false);
                          setPhoneInput(
                            subscriber?.phone_number || ""
                          );
                        }}
                        className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:border-slate-500"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-slate-400">
                        {subscriber?.phone_number
                          ? subscriber.phone_number
                          : "No phone number added"}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingPhone(true);
                          setPhoneInput(
                            subscriber?.phone_number || ""
                          );
                        }}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        {subscriber?.phone_number
                          ? "Edit"
                          : "Add"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* STATUS GRID                                  */}
        {/* ============================================ */}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
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

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-sm text-slate-500">
              Examination Venue
            </p>

            <p
              className={`mt-2 font-semibold ${
                subscriber?.venue_enabled
                  ? "text-green-400"
                  : "text-slate-500"
              }`}
            >
              {subscriber?.venue_enabled
                ? "● Enabled"
                : "● Disabled"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-sm text-slate-500">
              Email Notifications
            </p>

            <p
              className={`mt-2 font-semibold ${
                subscriber?.email_enabled
                  ? "text-green-400"
                  : "text-slate-500"
              }`}
            >
              {subscriber?.email_enabled
                ? "● Enabled"
                : "● Disabled"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <p className="text-sm text-slate-500">
              WhatsApp Notifications
            </p>

            <p
              className={`mt-2 font-semibold ${
                subscriber?.whatsapp_enabled &&
                subscriber?.phone_number
                  ? "text-green-400"
                  : "text-slate-500"
              }`}
            >
              {subscriber?.whatsapp_enabled &&
              subscriber?.phone_number
                ? "● Enabled"
                : subscriber?.whatsapp_enabled &&
                  !subscriber?.phone_number
                ? "● Phone Required"
                : "● Disabled"}
            </p>
          </div>
        </div>

        {/* ============================================ */}
        {/* ACCOUNT SETTINGS                            */}
        {/* ============================================ */}

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
          <div className="mb-7">
            <h2 className="text-2xl font-bold">
              Account Settings
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Manage your account and preferences.
            </p>
          </div>

          {/* Delete Account */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-300">
                  Delete Account
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Permanently delete your account and all
                  associated data.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(true);
                  setDeleteConfirm("");
                  setDeleteError("");
                }}
                className="rounded-xl border border-red-500/30 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* DELETE CONFIRMATION MODAL                    */}
      {/* ============================================ */}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl">
            <h3 className="text-xl font-bold text-red-400">
              Delete Account
            </h3>

            <p className="mt-3 text-sm text-slate-400">
              This action is permanent and cannot be undone.
              All your data, notification settings, and
              account information will be permanently
              removed.
            </p>

            <p className="mt-4 text-sm text-slate-300">
              Type{" "}
              <span className="font-mono font-bold text-red-400">
                DELETE
              </span>{" "}
              to confirm:
            </p>

            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) =>
                setDeleteConfirm(e.target.value)
              }
              placeholder="Type DELETE"
              className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-red-500"
              autoFocus
            />

            {deleteError && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setShowDeleteModal(false)
                }
                className="flex-1 rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-300 transition hover:border-slate-500 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
