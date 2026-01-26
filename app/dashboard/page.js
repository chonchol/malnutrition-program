"use client";

import AdminSidebar from "@/components/AdminSidebar";
import StatCard from "@/components/StatCard";
import { useSession } from "@/store/useSession";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, fetchUser, logout } = useSession();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
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
      return;
    }
    if (user.role !== "admin") {
      router.push("/patients/new");
      return;
    }
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/patients");
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments || []);
      }
      setLoading(false);
    };
    load();
  }, [authChecked, user, router]);

  const campCounts = useMemo(() => {
    const counts = {};
    assessments.forEach((a) => {
      counts[a.campName] = (counts[a.campName] || 0) + 1;
    });
    return counts;
  }, [assessments]);

  const genderCounts = useMemo(() => {
    const counts = { Male: 0, Female: 0, Other: 0 };
    assessments.forEach((a) => {
      counts[a.gender] = (counts[a.gender] || 0) + 1;
    });
    return counts;
  }, [assessments]);

  const downloadExcel = async () => {
    const res = await fetch("/api/patients/export");
    if (!res.ok) return;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assessments.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (authChecked && user && user.role !== "admin") {
    return null;
  }

  return (
    <main className="min-h-screen">
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onLogout={async () => {
          await logout();
          router.push("/auth/login");
        }}
      />

      {loading ? (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      ) : (<div
        className={`transition-all duration-200 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
          <div className="space-y-6">
            {/* glass flex items-center justify-between rounded-3xl px-4 py-3 */}
            <header className="glass rounded-3xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed((v) => !v)}
                    className="rounded-2xl border border-slate-200 bg-white/70 p-2 text-slate-700 hover:border-emerald-400 hover:text-emerald-600 lg:inline-flex dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                    aria-label="Toggle sidebar"
                    title="Toggle sidebar"
                  >
                    {sidebarCollapsed ? (
                      <ChevronRight size={20} />
                    ) : (
                      <ChevronLeft size={20} />
                    )}
                  </button>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-600">
                      Admin dashboard
                    </p>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      Camp insights
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Monitor submissions, demographics, and export to Excel.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadExcel}
                    className="hidden items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-slate-300/70 md:inline-flex dark:bg-emerald-600 dark:shadow-emerald-900/50"
                  >
                    <Download size={16} />
                    Export Excel
                  </button>
                  <Link
                    href="/patients/new"
                    className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-700 dark:text-slate-100 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">New assessment</span>
                    <span className="sm:hidden">New</span>
                  </Link>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-1.5 text-xs dark:bg-slate-900/60">
                    <span className="h-6 w-6 rounded-full bg-linear-to-br from-sky-500 to-emerald-400" />
                    <div className="hidden text-right sm:block">
                      <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-100">
                        {user?.name || "Admin"}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-300">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <StatCard title="Total assessments" value={assessments.length} />
              <StatCard
                title="Camps covered"
                value={Object.keys(campCounts).length}
              />
              <StatCard
                title="Avg age"
                value={
                  assessments.length
                    ? Math.round(
                      assessments.reduce((sum, a) => sum + (a.age || 0), 0) /
                      assessments.length
                    )
                    : 0
                }
              />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="glass rounded-3xl p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Submissions by camp
                </h3>
                <div className="mt-4 h-75">
                  <Bar
                    data={{
                      labels: Object.keys(campCounts),
                      datasets: [
                        {
                          label: "Assessments",
                          data: Object.values(campCounts),
                          backgroundColor: "#34d399",
                        },
                      ],
                    }}
                    options={{ plugins: { legend: { display: false } } }}
                  />
                </div>
              </div>
              <div className="glass rounded-3xl p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Gender split
                </h3>
                <div className="mt-4 h-75 flex items-center justify-center">
                  <Doughnut
                    data={{
                      labels: Object.keys(genderCounts),
                      datasets: [
                        {
                          data: Object.values(genderCounts),
                          backgroundColor: ["#22c55e", "#38bdf8", "#a855f7"],
                        },
                      ],
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Recent assessments
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  Showing latest {Math.min(assessments.length, 8)}
                </p>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-500 dark:text-slate-300">
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Patient</th>
                      <th className="px-3 py-2 font-medium">Camp</th>
                      <th className="px-3 py-2 font-medium">Age</th>
                      <th className="px-3 py-2 font-medium">Gender</th>
                      <th className="px-3 py-2 font-medium">MUAC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          className="px-3 py-4 text-slate-500 dark:text-slate-300"
                          colSpan={6}
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : (
                      assessments.slice(0, 8).map((a) => (
                        <tr
                          key={a._id}
                          className="border-t border-slate-100 dark:border-slate-800"
                        >
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                            {format(new Date(a.createdAt), "dd MMM yyyy")}
                          </td>
                          <td className="px-3 py-2 text-slate-900 dark:text-slate-100">
                            {a.patientName}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                            {a.campName}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                            {a.age}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                            {a.gender}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                            {a.muacCm || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>)}


    </main>
  );
}

