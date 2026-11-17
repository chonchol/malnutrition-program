"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { useSession } from "@/store/useSession";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FieldUsersPage() {
  const router = useRouter();
  const { user, fetchUser, logout } = useSession();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchUser();
      setAuthChecked(true);
    };
    init();
  }, [fetchUser]);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      router.push("/auth/login");
    } else if (user.role !== "admin") {
      router.push("/patients/new");
    }
  }, [authChecked, user, router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to create field user");
        return;
      }

      setForm({ name: "", email: "", password: "" });
      setSuccess(`Field user account created for ${data.user.email}.`);
    } catch (submitError) {
      console.error("Unable to create field user:", submitError);
      setError("Unable to create field user. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600 dark:text-slate-300">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        isAdmin={user.role === "admin"}
        onLogout={async () => {
          await logout();
          router.push("/auth/login");
        }}
      />
      <div
        className={`transition-all duration-200 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
          <header className="glass rounded-3xl px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Create a field user
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Create login credentials for a field worker.
            </p>
          </header>

          <form
            className="glass max-w-xl space-y-4 rounded-3xl p-6"
            onSubmit={handleSubmit}
          >
            <div>
              <label
                htmlFor="name"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Name
              </label>
              <input
                id="name"
                autoComplete="name"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-emerald-100 focus:border-emerald-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:ring-emerald-900/40"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                required
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-emerald-100 focus:border-emerald-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:ring-emerald-900/40"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Temporary password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-emerald-100 focus:border-emerald-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:ring-emerald-900/40"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                required
              />
            </div>

            {error && (
              <p role="alert" className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {error}
              </p>
            )}
            {success && (
              <p role="status" className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-linear-to-r from-sky-500 to-emerald-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 disabled:opacity-70"
            >
              {submitting ? "Creating..." : "Create field user"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
