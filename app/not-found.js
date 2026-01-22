"use client";

import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen">
      <div className="transition-all duration-200">
        <div className="mx-auto max-w-4xl px-4 py-20">
          <div className="glass rounded-3xl p-8 text-center">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              404 — Page not found
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => router.push("/")}
                className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Go to Homepage
              </button>

              <button
                onClick={() => router.push("/auth/login")}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
