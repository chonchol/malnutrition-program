"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { useSession } from "@/store/useSession";
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from "chart.js";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

// Simple plugin to draw value labels on top of bar charts (no extra dependency)
const barLabelsPlugin = {
    id: "barLabels",
    afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        const opts = chart.config.options.plugins?.barLabels;
        // only draw when explicitly enabled
        if (!opts || opts.enabled !== true) return;
        chart.data.datasets.forEach((dataset, datasetIndex) => {
            const meta = chart.getDatasetMeta(datasetIndex);
            if (!meta || !meta.data) return;
            meta.data.forEach((element, index) => {
                // only draw for bar elements
                if (element && element.tooltipPosition) {
                    const data =
                        dataset.displayLabels && dataset.displayLabels[index] !== undefined
                            ? dataset.displayLabels[index]
                            : dataset.data[index] === null ||
                                dataset.data[index] === undefined
                                ? ""
                                : String(dataset.data[index]);
                    ctx.save();
                    ctx.fillStyle = opts.color || "#111827";
                    ctx.font = opts.font || "600 12px Arial";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "bottom";
                    const x = element.x;
                    const y = element.y;
                    // draw value a few pixels above the bar
                    ctx.fillText(String(data) + (opts.suffix || ""), x, y - 6);
                    ctx.restore();
                }
            });
        });
    },
};

ChartJS.register(barLabelsPlugin);

export default function ChartsPage() {
    const router = useRouter();
    const { user, fetchUser, logout } = useSession();
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // MUAC chart states
    const [nirogId, setNirogId] = useState("");
    const [nirogIdInput, setNirogIdInput] = useState("");
    const [nirogError, setNirogError] = useState("");

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

    // Get patient MUAC data by NIROG ID
    const patientMuacData = useMemo(() => {
        if (!nirogId) return null;
        const patientAssessments = assessments.filter((a) => a.nirogId === nirogId);
        return patientAssessments.length > 0 ? patientAssessments : null;
    }, [nirogId, assessments]);

    const nirogNotFoundMessage =
        nirogId && patientMuacData === null
            ? "No assessments found for this NIROG ID"
            : "";

    // Chart 1: Individual Patient MUAC Tracking
    const muacChartData = useMemo(() => {
        if (!patientMuacData) return null;
        const sortedData = [...patientMuacData].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        return {
            labels: sortedData.map((a) =>
                format(new Date(a.createdAt), "dd MMM yyyy")
            ),
            datasets: [
                {
                    label: "MUAC (cm)",
                    data: sortedData.map((a) => a.muacCm || 0),
                    borderColor: "#059669",
                    backgroundColor: "rgba(5, 150, 105, 0.1)",
                    tension: 0.3,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: "#059669",
                    pointBorderColor: "#fff",
                    pointBorderWidth: 2,
                },
            ],
        };
    }, [patientMuacData]);

    // Chart 2: School Attendance (attending vs not_attending) as percentage
    const chartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        font: { size: 12 },
                        padding: 15,
                    },
                },
                title: {
                    display: true,
                    font: { size: 14, weight: "bold" },
                    padding: 20,
                },
                barLabels: {
                    color: "#111827",
                    font: "600 12px Arial",
                    suffix: "",
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: "rgba(0, 0, 0, 0.05)",
                    },
                },
                x: {
                    grid: {
                        display: false,
                    },
                },
            },
        }),
        []
    );

    const schoolChartData = useMemo(() => {
        const attendingCount = assessments.filter(
            (a) => a.schoolStatus === "attending"
        ).length;
        const notAttendingCount = assessments.filter(
            (a) => a.schoolStatus === "not_attending"
        ).length;
        const total = attendingCount + notAttendingCount;
        // percentages (1 decimal)
        const attendingPct =
            total > 0 ? +((attendingCount / total) * 100).toFixed(1) : 0;
        const notAttendingPct =
            total > 0 ? +((notAttendingCount / total) * 100).toFixed(1) : 0;
        const displayLabels = [
            `${attendingCount} (${attendingPct}%)`,
            `${notAttendingCount} (${notAttendingPct}%)`,
        ];
        return {
            labels: ["Attending", "Not attending"],
            datasets: [
                {
                    label: "Count",
                    data: [attendingCount, notAttendingCount],
                    backgroundColor: ["rgba(34,197,94,0.8)", "rgba(239,68,68,0.8)"],
                    borderColor: ["#22c55e", "#ef4444"],
                    borderWidth: 2,
                    displayLabels,
                },
            ],
        };
    }, [assessments]);

    const schoolChartOptions = useMemo(() => {
        return {
            ...chartOptions,
            scales: {
                ...chartOptions.scales,
                y: {
                    ...chartOptions.scales.y,
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function (value) {
                            return value + "%";
                        },
                    },
                },
            },
            plugins: {
                ...chartOptions.plugins,
                barLabels: {
                    ...(chartOptions.plugins?.barLabels || {}),
                    suffix: "",
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const value = context.parsed.y;
                            // compute percentage from dataset
                            const dataset = context.dataset;
                            const total = dataset.data.reduce(
                                (s, x) => s + (Number(x) || 0),
                                0
                            );
                            const pct =
                                total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0;
                            return `${value} (${pct}%)`;
                        },
                    },
                },
            },
        };
    }, [chartOptions]);

    // Chart 3: Mental Health Risk Distribution
    const mentalHealthChartData = useMemo(() => {
        const riskCount = {
            low: assessments.filter((a) => a.mentalRisk === "low").length,
            moderate: assessments.filter((a) => a.mentalRisk === "moderate").length,
            high: assessments.filter((a) => a.mentalRisk === "high").length,
        };
        return {
            labels: ["Low Risk", "Moderate Risk", "High Risk"],
            datasets: [
                {
                    label: "Number of Patients",
                    data: [riskCount.low, riskCount.moderate, riskCount.high],
                    backgroundColor: [
                        "rgba(34, 197, 94, 0.8)",
                        "rgba(251, 146, 60, 0.8)",
                        "rgba(239, 68, 68, 0.8)",
                    ],
                    borderColor: ["#22c55e", "#fb923c", "#ef4444"],
                    borderWidth: 2,
                },
            ],
        };
    }, [assessments]);

    // Chart 4: Daily Patient Assessments
    const dailyPatientChartData = useMemo(() => {
        const dailyCount = {};
        assessments.forEach((a) => {
            const date = format(new Date(a.createdAt), "dd MMM yyyy");
            dailyCount[date] = (dailyCount[date] || 0) + 1;
        });
        const sortedDates = Object.entries(dailyCount).sort(
            (a, b) => new Date(a[0]) - new Date(b[0])
        );
        return {
            labels: sortedDates.map((d) => d[0]),
            datasets: [
                {
                    label: "Assessments per Day",
                    data: sortedDates.map((d) => d[1]),
                    backgroundColor: "rgba(16, 185, 129, 0.8)",
                    borderColor: "#10b981",
                    borderWidth: 2,
                },
            ],
        };
    }, [assessments]);

    const handleSearchNirogId = () => {
        if (!nirogIdInput.trim()) {
            setNirogError("Please enter a NIROG ID");
            return;
        }
        setNirogId(nirogIdInput);
    };

    const handleClearNirogId = () => {
        setNirogId("");
        setNirogIdInput("");
        setNirogError("");
    };

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
                        <p className="text-slate-600">Loading charts...</p>
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
                                            Analytics Dashboard
                                        </p>
                                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                            Assessment Reports
                                        </h1>
                                        <p className="text-xs text-slate-600 dark:text-slate-300">
                                            View comprehensive charts and metrics
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Summary Stats */}
                        <div className="grid gap-4 md:grid-cols-4 mt-6">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-600 mb-1">Total Assessments</p>
                                <p className="text-3xl font-bold text-slate-900">
                                    {assessments.length}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-600 mb-1">Total Patients</p>
                                <p className="text-3xl font-bold text-slate-900">
                                    {new Set(assessments.map((a) => a.nirogId)).size}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-600 mb-1">Average Age</p>
                                <p className="text-3xl font-bold text-slate-900">
                                    {assessments.length > 0
                                        ? (
                                            assessments.reduce((sum, a) => sum + (a.age || 0), 0) /
                                            assessments.length
                                        ).toFixed(1)
                                        : "N/A"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <p className="text-sm text-slate-600 mb-1">Unique Camps</p>
                                <p className="text-3xl font-bold text-slate-900">
                                    {new Set(assessments.map((a) => a.campName)).size}
                                </p>
                            </div>
                        </div>

                        {/* Chart 1: MUAC Tracking */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">
                                Individual Patient MUAC Tracking
                            </h2>
                            <div className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    placeholder="Enter NIROG ID"
                                    value={nirogIdInput}
                                    onChange={(e) => setNirogIdInput(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleSearchNirogId()}
                                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                />
                                <button
                                    onClick={handleSearchNirogId}
                                    className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                                >
                                    Search
                                </button>
                                {nirogId && (
                                    <button
                                        onClick={handleClearNirogId}
                                        className="rounded-lg bg-slate-100 p-2 hover:bg-slate-200 transition"
                                    >
                                        <X size={20} className="text-slate-600" />
                                    </button>
                                )}
                            </div>
                            {(nirogError || nirogNotFoundMessage) && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
                                    {nirogError || nirogNotFoundMessage}
                                </div>
                            )}
                            {muacChartData && patientMuacData && (
                                <div>
                                    <div className="mb-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <p className="text-sm text-emerald-900">
                                            <span className="font-semibold">Patient:</span>{" "}
                                            {patientMuacData[0]?.patientName} |
                                            <span className="font-semibold ml-3">NIROG ID:</span>{" "}
                                            {nirogId} |
                                            <span className="font-semibold ml-3">Age:</span>{" "}
                                            {patientMuacData[0]?.age} |
                                            <span className="font-semibold ml-3">Gender:</span>{" "}
                                            {patientMuacData[0]?.gender} |
                                            <span className="font-semibold ml-3">Total Visits:</span>{" "}
                                            {patientMuacData.length}
                                        </p>
                                    </div>
                                    <div style={{ height: "300px", position: "relative" }}>
                                        <Line data={muacChartData} options={chartOptions} />
                                    </div>
                                </div>
                            )}
                            {!nirogId && !nirogError && (
                                <div className="flex items-center justify-center py-20 text-slate-500">
                                    <p>Enter a NIROG ID above to view patient MUAC tracking</p>
                                </div>
                            )}
                        </div>

                        {/* Charts Grid */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Chart 2: School Attendance */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-slate-900 mb-4">
                                    School Attendance
                                </h2>
                                <div style={{ height: "350px", position: "relative" }}>
                                    <Bar data={schoolChartData} options={schoolChartOptions} />
                                </div>
                            </div>

                            {/* Chart 3: Mental Health Risk */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-slate-900 mb-4">
                                    Mental Health Risk Distribution
                                </h2>
                                <div style={{ height: "350px", position: "relative" }}>
                                    <Pie
                                        data={mentalHealthChartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: true,
                                            plugins: {
                                                legend: {
                                                    position: "bottom",
                                                    labels: {
                                                        font: { size: 12 },
                                                        padding: 15,
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Chart 4: Daily Patient Assessments */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mt-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">
                                Daily Patient Assessments
                            </h2>
                            <div style={{ height: "300px", position: "relative" }}>
                                <Bar data={dailyPatientChartData} options={chartOptions} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
