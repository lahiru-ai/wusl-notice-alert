"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface AdminHeaderProps {
  email: string;
}

export default function AdminHeader({ email }: AdminHeaderProps) {
  const supabase = createClient();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-800 bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-blue-400 uppercase">
              WUSL Notice Alert
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Faculty of Applied Sciences
            </p>
          </div>

          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
            Admin Panel
          </span>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-400">{email}</p>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-300"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
