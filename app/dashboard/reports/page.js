"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { useSession } from "@/store/useSession";
import { endOfDay, format, parseISO, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Download, Filter, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ReportsPage() {
  const router = useRouter();
  const { user, fetchUser, logout } = useSession();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    campName: "",
    gender: "",
    status: "",
    startDate: "",
    endDate: "",
    ageMin: "",
    ageMax: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // default 10 rows per page

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

  // Note: page reset handled in filter handlers and limit change to avoid
  // calling setState synchronously inside an effect.

  // Get unique values for filter dropdowns
  const uniqueCamps = useMemo(
    () => [...new Set(assessments.map((a) => a.campName))].sort(),
    [assessments]
  );

  // Filter assessments based on applied filters
  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      // Camp filter
      if (filters.campName && assessment.campName !== filters.campName) {
        return false;
      }

      // Gender filter
      if (filters.gender && assessment.gender !== filters.gender) {
        return false;
      }

      // Status filter (if available in your data)
      if (filters.status && assessment.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const assessmentDate = new Date(
          assessment.createdAt || assessment.date
        );
        if (filters.startDate) {
          const startDate = startOfDay(parseISO(filters.startDate));
          if (assessmentDate < startDate) return false;
        }
        if (filters.endDate) {
          const endDate = endOfDay(parseISO(filters.endDate));
          if (assessmentDate > endDate) return false;
        }
      }

      // Age filter
      if (filters.ageMin || filters.ageMax) {
        const age = assessment.age;
        if (filters.ageMin && age < parseInt(filters.ageMin)) return false;
        if (filters.ageMax && age > parseInt(filters.ageMax)) return false;
      }

      return true;
    });
  }, [assessments, filters]);

  // Paginated slice of filtered assessments
  const totalFiltered = filteredAssessments.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));
  const paginatedAssessments = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredAssessments.slice(start, start + limit);
  }, [filteredAssessments, page, limit]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      campName: "",
      gender: "",
      status: "",
      startDate: "",
      endDate: "",
      ageMin: "",
      ageMax: "",
    });
    setPage(1);
  };

  const downloadExcel = () => {
    if (filteredAssessments.length === 0) {
      alert("No data to export");
      return;
    }

    const XLSX = require("xlsx");
    const ws = XLSX.utils.json_to_sheet(
      filteredAssessments.map((a) => ({
        ID: a._id || a.id,
        Date: a.createdAt ? format(parseISO(a.createdAt), "dd/MM/yyyy") : "N/A",
        "Nirog ID": a.nirogId || "N/A",
        "Survey Type": a.surveyType || "N/A",
        "Survey Status": a.SurveyStatus || "N/A",
        Camp: a.campName || "N/A",
        Name: a.patientName || "N/A",
        Age: a.age || "N/A",
        Address: a.address || "N/A",
        Gender: a.gender || "N/A",
        "School Status": a.schoolStatus || "N/A",
        "Camp Stay": a.campStayYears || "N/A",
        "Live with Parents": a.livesWithParents || "N/A",
        "Family Size": a.familySize || "N/A",
        Height: a.heightCm || "N/A",
        Weight: a.weightKg || "N/A",
        MUAC: a.muacCm || "N/A",
        "Mental Health Score": a.mentalScore || "N/A",
        "Mental Health Risk": a.mentalRisk || "N/A",
        "Referred Organization": a.referralOrg || "N/A",
        "Created by":
          a.createdBy && typeof a.createdBy === "object"
            ? a.createdBy.name || "N/A"
            : a.createdBy || "N/A",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, `reports-${format(new Date(), "dd-MM-yyyy")}.xlsx`);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

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
            <p className="text-slate-600">Loading reports...</p>
          </div>
        </div>
      ) : null}

      <div
        className={`transition-all duration-200 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
          <div className="space-y-6">
            {/* Header */}
            <header className="glass rounded-3xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed((v) => !v)}
                    className="hidden rounded-2xl border border-slate-200 bg-white/70 p-2 text-slate-700 hover:border-emerald-400 hover:text-emerald-600 lg:inline-flex dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
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
                      Analytics
                    </p>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      Assessment Reports
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      View and export detailed assessment data with advanced
                      filtering.
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* Filter Section */}
            <div className="glass rounded-3xl p-6 transition-all duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter size={20} className="text-emerald-600" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Filters
                  </h2>
                  {hasActiveFilters && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-100">
                      Active
                    </span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                  >
                    <X size={16} />
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Camp Filter */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Camp
                  </label>
                  <select
                    name="campName"
                    value={filters.campName}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-900/40"
                  >
                    <option value="">All Camps</option>
                    {uniqueCamps.map((camp) => (
                      <option key={camp} value={camp}>
                        {camp}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender Filter */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={filters.gender}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-900/40"
                  >
                    <option value="">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-900/40"
                  >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                {/* Start Date Filter */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-900/40"
                  />
                </div>

                {/* End Date Filter */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-900/40"
                  />
                </div>

                {/* Min Age Filter */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Min Age
                  </label>
                  <input
                    type="number"
                    name="ageMin"
                    value={filters.ageMin}
                    onChange={handleFilterChange}
                    min="0"
                    max="120"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-900/40"
                  />
                </div>

                {/* Max Age Filter */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Max Age
                  </label>
                  <input
                    type="number"
                    name="ageMax"
                    value={filters.ageMax}
                    onChange={handleFilterChange}
                    min="0"
                    max="120"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-900/40"
                  />
                </div>
              </div>
            </div>

            {/* Results Summary & Export */}
            <div className="glass rounded-3xl p-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-slate-400">
                    Results
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {filteredAssessments.length}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {filteredAssessments.length === assessments.length
                      ? "All assessments"
                      : `of ${assessments.length} total`}
                  </p>
                </div>
                <button
                  onClick={downloadExcel}
                  disabled={filteredAssessments.length === 0}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:bg-emerald-700 hover:shadow-emerald-600/50 disabled:bg-slate-300 disabled:shadow-none dark:bg-emerald-600 dark:hover:bg-emerald-700"
                >
                  <Download size={18} />
                  Download Excel
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="glass overflow-hidden rounded-3xl">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-slate-600 dark:text-slate-400">
                    Loading data...
                  </p>
                </div>
              ) : filteredAssessments.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      No assessments found
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Try adjusting your filters
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                          Nirog ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                          Age
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                          Gender
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                          MUAC
                        </th>

                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                          Mental Health Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {paginatedAssessments.map((assessment) => (
                        <tr
                          key={assessment._id || assessment.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {assessment.createdAt
                              ? format(
                                  parseISO(assessment.createdAt),
                                  "dd/MM/yyyy"
                                )
                              : "N/A"}
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                            {assessment.patientName || "N/A"}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {assessment.nirogId || "N/A"}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {assessment.age || "N/A"}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {assessment.gender || "N/A"}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                            {assessment.muacCm || "N/A"}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                                (assessment.mentalRisk || "low") === "low"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-100"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-100"
                              }`}
                            >
                              {assessment.mentalRisk || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400">
                            <button
                              onClick={() => {
                                const id =
                                  assessment.nirogId ||
                                  assessment._id ||
                                  assessment.id;
                                if (!id) return;
                                router.push(
                                  `/patients/${encodeURIComponent(id)}/history`
                                );
                              }}
                              className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              History
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                    <div>
                      Showing{" "}
                      {totalFiltered === 0
                        ? 0
                        : Math.min((page - 1) * limit + 1, totalFiltered)}{" "}
                      - {Math.min(page * limit, totalFiltered)} of{" "}
                      {totalFiltered}
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-xs">Rows:</label>
                      <select
                        value={limit}
                        onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                        className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm outline-none dark:border-slate-700 dark:bg-slate-900"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page <= 1}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        <div className="text-sm font-medium">
                          {page} / {totalPages}
                        </div>

                        <button
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={page >= totalPages}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1 text-sm disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
