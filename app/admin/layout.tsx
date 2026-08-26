import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isAdminEmail } from "@/lib/admin-config";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email || "")) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-[#020617] text-white">
      <AdminSidebar currentPath="/admin" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold tracking-[0.2em] text-blue-400 uppercase">
                WUSL Notice Alert
              </p>
              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                Admin
              </span>
            </div>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
