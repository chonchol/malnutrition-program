"use client";

import { useSession } from "@/store/useSession";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const { fetchUser } = useSession();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Unable to register");
      setLoading(false);
      return;
    }
    await fetchUser();
    router.push("/patients/new");
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Create account
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Join team</h1>
          <p className="text-sm text-slate-500">
            Set role as admin for supervisors; user for field workers.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-100 focus:border-emerald-400 focus:ring-4"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-100 focus:border-emerald-400 focus:ring-4"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-100 focus:border-emerald-400 focus:ring-4"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-100 focus:border-emerald-400 focus:ring-4"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="user">Field user</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && (
            <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-linear-to-r from-sky-500 to-emerald-400 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 disabled:opacity-70"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link href="/auth/login" className="text-emerald-600">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
