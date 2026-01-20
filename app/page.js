import Link from "next/link";

const features = [
  "Offline-first data capture with auto sync",
  "Admin analytics dashboard with charts",
  "Excel export for rapid reporting",
  "Secure login, roles, and audit trail",
  "Bilingual patient questionnaire layout",
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between rounded-3xl glass px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-400 text-white text-xl font-semibold">
              H
            </div>
            <div>
              <p className="text-sm text-slate-500">Camp Health Stack</p>
              <h1 className="text-xl font-semibold text-slate-900">
                Malnutrition Programme
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:text-slate-200"
            >
              Login
            </Link>
            {/* <Link
              href="/auth/register"
              className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60"
            >
              Create account
            </Link> */}
          </div>
        </header>

        <section className="mt-12 grid gap-10 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="glass rounded-3xl p-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Field ready
            </p>
            <h2 className="text-4xl font-semibold leading-[1.2] text-slate-900">
              Offline-first malnutrition and mental health apps for camps.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Built for low-connectivity environments. Collect assessments in
              Bengali/English, sync automatically when back online, and export
              polished reports instantly.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {features.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-sm"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    ✓
                  </span>
                  <p className="text-sm font-medium text-slate-700">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/patients/new"
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-300/70"
              >
                Start capturing
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-300"
              >
                View dashboard
              </Link>
            </div>
          </div>
          <div className="glass relative overflow-hidden rounded-3xl p-6">
            <div className="absolute right-[-60px] top-[-80px] h-48 w-48 rounded-full bg-emerald-200/60 blur-3xl" />
            <div className="absolute bottom-[-60px] left-[-40px] h-48 w-48 rounded-full bg-sky-200/70 blur-3xl" />
            <div className="relative">
              <h3 className="text-lg font-semibold text-slate-900">
                Fast camp workflow
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Patient profile → anthropometrics → mental health → sync.
              </p>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-700">
                    Auto sync queue
                  </p>
                  <p className="text-xs text-slate-500">
                    Offline entries stored locally. We push to server the moment
                    connectivity returns.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                  <p className="text-sm font-medium text-slate-700">
                    Admin visibility
                  </p>
                  <p className="text-xs text-slate-500">
                    Charts, camp-level breakdowns, and Excel export for quick
                    donor reporting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
