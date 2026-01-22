"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { useSession } from "@/store/useSession";
import { format, parseISO } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PatientHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { user, fetchUser, logout } = useSession();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

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

    const load = async () => {
      setLoading(true);
      if (!id) {
        setLoading(false);
        return;
      }
      // Try nirogId first
      const res = await fetch(
        `/api/patients/history?nirogId=${encodeURIComponent(id)}`
      );
      if (res.ok) {
        const data = await res.json();
        setAssessments(data.assessments || []);
      } else {
        // Try _id fallback
        const res2 = await fetch(
          `/api/patients/history?id=${encodeURIComponent(id)}`
        );
        if (res2.ok) {
          const data2 = await res2.json();
          setAssessments(data2.assessments || []);
        }
      }
      setLoading(false);
    };
    load();
  }, [authChecked, user, router, id]);

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

      <div
        className={`transition-all duration-200 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}
      >
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
          <div className="space-y-6">
            <header className="glass rounded-3xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    Patient History
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Showing all assessments for{" "}
                    <span className="font-medium">{id}</span>
                  </p>
                </div>
              </div>
            </header>

            <div className="glass overflow-hidden rounded-3xl">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-slate-600 dark:text-slate-400">
                    Loading history...
                  </p>
                </div>
              ) : assessments.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      No history found
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      This patient has no recorded assessments.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map((a, idx) => (
                    <div key={a._id || a.id} className="glass rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {a.createdAt
                              ? format(
                                  parseISO(a.createdAt),
                                  "dd/MM/yyyy HH:mm"
                                )
                              : "N/A"}
                          </p>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            {a.patientName || "N/A"}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              {a.nirogId ? `(${a.nirogId})` : ""}
                            </span>
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Camp: {a.campName || "N/A"} · Age: {a.age || "N/A"}{" "}
                            · Gender: {a.gender || "N/A"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setOpenIndex(openIndex === idx ? null : idx)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"
                          >
                            {openIndex === idx ? "Collapse" : "View details"}
                          </button>
                        </div>
                      </div>

                      {openIndex === idx && (
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <div>
                              <span className="font-semibold">
                                Survey Type:
                              </span>{" "}
                              {a.surveyType || "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">
                                Survey Status:
                              </span>{" "}
                              {a.surveyStatus || "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">Address:</span>{" "}
                              {a.address || "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">
                                School Status:
                              </span>{" "}
                              {a.schoolStatus || "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">
                                Camp Stay Years:
                              </span>{" "}
                              {a.campStayYears ?? "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">
                                Lives With Parents:
                              </span>{" "}
                              {a.livesWithParents || "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">
                                Family Size:
                              </span>{" "}
                              {a.familySize ?? "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">
                                Height (cm):
                              </span>{" "}
                              {a.heightCm ?? "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">
                                Weight (kg):
                              </span>{" "}
                              {a.weightKg ?? "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">MUAC (cm):</span>{" "}
                              {a.muacCm ?? "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">
                                Nutritional Supplements:
                              </span>
                              {a.nutritionalSupplements &&
                              a.nutritionalSupplements.length > 0 ? (
                                <ul className="ml-4 list-disc">
                                  {a.nutritionalSupplements.map((ns, i) => (
                                    <li key={i}>
                                      {ns.type}{" "}
                                      {ns.quantity
                                        ? `- ${ns.quantity} ${ns.unit || ""}`
                                        : ""}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                " N/A"
                              )}
                            </div>
                            <div>
                              <span className="font-semibold">
                                Referral Organization:
                              </span>{" "}
                              {a.referralOrg || "N/A"}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="font-semibold">
                                Mental Health Score:
                              </span>{" "}
                              {a.mentalScore ?? "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">
                                Mental Health Risk:
                              </span>{" "}
                              {a.mentalRisk || "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">Responses:</span>
                              {a.mentalHealth && a.mentalHealth.length > 0 ? (
                                <ul className="ml-4 list-decimal">
                                  {a.mentalHealth.map((m, j) => (
                                    <li key={j}>
                                      <span className="font-medium">
                                        {m.question}:
                                      </span>{" "}
                                      {m.response || "N/A"}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                " N/A"
                              )}
                            </div>
                            <div>
                              <span className="font-semibold">Created By:</span>{" "}
                              {a.createdBy
                                ? typeof a.createdBy === "object"
                                  ? a.createdBy.name || "N/A"
                                  : a.createdBy
                                : "N/A"}
                            </div>
                            <div>
                              <span className="font-semibold">Record ID:</span>{" "}
                              {a._id || a.id}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
