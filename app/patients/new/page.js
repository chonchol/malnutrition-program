"use client";

import Input from "@/components/Input";
import PlanRow from "@/components/PlanRow";
import RadioPill from "@/components/RadioPill";
import StepHeader from "@/components/StepHeader";
import camps from "@/data/camps.json";
import { calculateBMI, calculateBMIZScore, getBMICategory } from "@/lib/baz";
import { clearQueue, getQueuedAssessments, queueAssessment } from "@/lib/offlineQueue";
import { mentalHealthQuestions, responseOptions } from "@/lib/questions";
import { useSession } from "@/store/useSession";
import { getTodayDate } from "@/utils/getTodayDate";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const nutritionalSupplements = [
  "Cerelac (Rice and Milk)",
  "Cerelac (5 fruits, Multigrain & Milk)",
  "Junior Horlicks",
  "Peanut Butter",
  "Peanut Bar",
];

export default function NewPatientPage() {
  const router = useRouter();
  const { user, fetchUser, loading: authLoading } = useSession();
  const [authChecked, setAuthChecked] = useState(false);

  const resetForm = () => {
    setForm({
      date: getTodayDate(),
      surveyType: "new",
      surveyStatus: "",
      nirogId: "",
      campName: "",
      patientName: "",
      age: "",
      gender: "",
      address: "",
      schoolStatus: "",
      campStayYears: "",
      livesWithParents: "",
      familySize: "",
      heightCm: "",
      weightKg: "",
      muacCm: "",
      // bmi: "",
      nutritionalSupplements: [],
    });
    setResponses({});
    setErrors({});
    setStep(0);
    setReferralOrg("");
    setNirogSearchError("");
    setIsDataFromPrevious(false);
    setNirogSearchLoading(false);
  };

  const [form, setForm] = useState({
    date: getTodayDate(),
    surveyType: "new",
    surveyStatus: "",
    nirogId: "",
    campName: "",
    patientName: "",
    age: "",
    gender: "",
    address: "",
    schoolStatus: "",
    campStayYears: "",
    livesWithParents: "",
    familySize: "",
    heightCm: "",
    weightKg: "",
    muacCm: "",
    // bmi: "",
    nutritionalSupplements: [],
  });
  const [responses, setResponses] = useState({});
  const [status, setStatus] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [step, setStep] = useState(0);
  const [referralOrg, setReferralOrg] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [errors, setErrors] = useState({});
  const [nirogSearchLoading, setNirogSearchLoading] = useState(false);
  const [nirogSearchError, setNirogSearchError] = useState("");
  const [isDataFromPrevious, setIsDataFromPrevious] = useState(false);

  const mentalPayload = useMemo(
    () =>
      mentalHealthQuestions.map((q) => ({
        key: q.key,
        question: q.en,
        response: responses[q.key] || "",
      })),
    [responses]
  );

  const totalScore = useMemo(
    () =>
      mentalHealthQuestions.reduce((sum, q) => {
        const resp = responses[q.key];
        let value = 0;

        // Handle questions with custom options
        if (q.customOptions) {
          const selectedOption = q.customOptions.find(
            (opt) => opt.label === resp
          );
          value = selectedOption ? selectedOption.value : 0;
        } else {
          // Handle standard questions with Never/Sometimes/Often/Always
          value =
            resp === "Never"
              ? 0
              : resp === "Sometimes"
                ? 1
                : resp === "Often"
                  ? 2
                  : resp === "Always"
                    ? 6
                    : 0;
        }
        return sum + value;
      }, 0),
    [responses]
  );

  const riskStatus = useMemo(() => {
    if (totalScore >= 25) return "high";
    if (totalScore >= 10) return "moderate";
    return "low";
  }, [totalScore]);

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 0) {
      if (!form.date) newErrors.date = "Date is required";
      if (!form.surveyType) newErrors.surveyType = "Survey type is required";
      if (form.surveyType === "followup" && !form.surveyStatus)
        newErrors.surveyStatus = "Follow up type is required";
      if (!form.nirogId) newErrors.nirogId = "NIROG ID is required";
    } else if (currentStep === 1) {
      if (!form.campName) newErrors.campName = "Camp name is required";
      if (!form.patientName) newErrors.patientName = "Patient name is required";
      if (!form.age) newErrors.age = "Age is required";
      if (!form.gender) newErrors.gender = "Gender is required";
      if (!form.address) newErrors.address = "Address is required";
    } else if (currentStep === 2) {
      if (!form.schoolStatus)
        newErrors.schoolStatus = "School status is required";
      if (!form.campStayYears)
        newErrors.campStayYears = "Duration of stay is required";
      if (!form.livesWithParents)
        newErrors.livesWithParents = "Family status is required";
      if (!form.familySize) newErrors.familySize = "Family size is required";
    } else if (currentStep === 3) {
      if (!form.heightCm) newErrors.heightCm = "Height is required";
      if (!form.weightKg) newErrors.weightKg = "Weight is required";
      if (!form.muacCm && ageInMonths <= 60) newErrors.muacCm = "MUAC is required";
    } else if (currentStep === 4) {
      const unanswered = mentalHealthQuestions.filter((q) => !responses[q.key]);
      if (unanswered.length > 0) {
        newErrors.mentalHealth = `${unanswered.length} question(s) not answered`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setErrors({});
      setStep((s) => Math.min(5, s + 1));
    }
  };

  const clearFieldError = (fieldName) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const handleFormChange = (fieldName, value) => {
    // Clear error for this field if it has a value
    if (value) {
      clearFieldError(fieldName);
    }
  };

  const handleResponseChange = (key, value) => {
    // Clear mental health error if any question is answered
    if (value) {
      clearFieldError("mentalHealth");
    }
  };

  // Authentication check
  useEffect(() => {
    const init = async () => {
      await fetchUser();
      setAuthChecked(true);
    };
    init();
  }, [fetchUser]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
  }, [authChecked, user, router]);

  const refreshQueueCount = useCallback(async () => {
    const queued = await getQueuedAssessments();
    setQueuedCount(queued.length);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      refreshQueueCount();
    }, 0);
    return () => clearTimeout(id);
  }, [refreshQueueCount]);

  // Search for existing patient by NIROG ID
  useEffect(() => {
    if (!form.nirogId || form.nirogId.length < 1) {
      setNirogSearchError("");
      setIsDataFromPrevious(false);
      return;
    }

    // Debounce the search
    const timer = setTimeout(async () => {
      setNirogSearchLoading(true);
      setNirogSearchError("");
      try {
        const res = await fetch(
          `/api/patients/search?nirogId=${encodeURIComponent(form.nirogId)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.found && data.data) {
            // Auto-populate the form with previous patient data
            setForm((prev) => ({
              ...prev,
              campName: data.data.campName || prev.campName,
              patientName: data.data.patientName || prev.patientName,
              age: data.data.age?.toString() || prev.age,
              gender: data.data.gender || prev.gender,
              address: data.data.address || prev.address,
              schoolStatus: data.data.schoolStatus || prev.schoolStatus,
              campStayYears:
                data.data.campStayYears?.toString() || prev.campStayYears,
              livesWithParents:
                data.data.livesWithParents || prev.livesWithParents,
              familySize: data.data.familySize?.toString() || prev.familySize,
            }));
            setIsDataFromPrevious(true);
            setNirogSearchError(""); // Clear any previous errors
          } else {
            setIsDataFromPrevious(false);
            setNirogSearchError(""); // New patient - no error
          }
        } else {
          const error = await res.json();
          setNirogSearchError(error.error || "Search failed");
          setIsDataFromPrevious(false);
        }
      } catch (error) {
        console.error("Search error:", error);
        setNirogSearchError(""); // Don't show error on network issues
        setIsDataFromPrevious(false);
      } finally {
        setNirogSearchLoading(false);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [form.nirogId]);

  const syncQueue = async () => {
    const queued = await getQueuedAssessments();
    if (
      !queued.length ||
      (typeof navigator !== "undefined" && !navigator.onLine)
    )
      return;
    setSyncing(true);
    const res = await fetch("/api/patients/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessments: queued }),
    });
    if (res.ok) {
      await clearQueue();
      setQueuedCount(0);
      setStatus("Queued records synced");
    }
    setSyncing(false);
  };

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    updateOnlineStatus();
    const onlineHandler = () => {
      setIsOnline(true);
      syncQueue();
    };
    const offlineHandler = () => setIsOnline(false);
    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);
    return () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);


  const ageInMonths = form.age ? Math.floor(Number(form.age) * 12) : null;

  const bmi = calculateBMI(form?.weightKg, form?.heightCm);
  const zScore = calculateBMIZScore({ bmi, ageMonths: ageInMonths, gender: form?.gender });
  const bmiCategory = getBMICategory(zScore);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 5) return;
    setStatus("");
    const payload = {
      ...form,
      date: form.date ? new Date(form.date) : new Date(),
      age: Number(form.age),
      campStayYears: form.campStayYears
        ? Number(form.campStayYears)
        : undefined,
      familySize: form.familySize ? Number(form.familySize) : undefined,
      heightCm: Number(form.heightCm),
      weightKg: Number(form.weightKg),
      muacCm: Number(form.muacCm),
      bmi: bmi,
      bmiZScore: zScore,
      bmiCategory: bmiCategory,
      nutritionalSupplements: form.nutritionalSupplements.map((s) => ({
        ...s,
        quantity: s.quantity ? Number(s.quantity) : undefined,
      })),
      mentalHealth: mentalPayload,
      mentalScore: totalScore,
      mentalRisk: riskStatus,
      referralOrg,
    };
    const saveOnline = async () => {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("✓ Assessment saved successfully!");
      // Reset form after successful save
      setTimeout(() => {
        resetForm();
        setStatus("");
      }, 1500);
    };

    if (typeof navigator === "undefined" || !navigator.onLine) {
      await queueAssessment(payload);
      setStatus("✓ Saved offline. We will sync when back online.");
      // Reset form after queuing
      setTimeout(() => {
        resetForm();
        setStatus("");
      }, 1500);
      refreshQueueCount();
      return;
    }

    try {
      await saveOnline();
    } catch (error) {
      await queueAssessment(payload);
      setStatus("✓ Server unreachable. Saved offline and will auto sync.");
      // Reset form after queuing
      setTimeout(() => {
        resetForm();
        setStatus("");
      }, 1500);
      refreshQueueCount();
    }
  };

  return (
    <main className="min-h-screen px-4 py-10">
      {!authChecked || authLoading ? (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Verifying authentication...</p>
          </div>
        </div>
      ) : null}

      {authChecked && !user ? null : (
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Field capture
              </p>
              <h1 className="text-3xl font-semibold text-slate-900">
                Patient assessment
              </h1>
              <p className="text-sm text-slate-600">
                Works offline. Auto-sync when connection resumes.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-400"
                  }`}
              />
              {isOnline ? "Online" : "Offline mode"}
              {queuedCount > 0 && (
                <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">
                  {queuedCount} queued
                </span>
              )}
              <button
                onClick={syncQueue}
                className="ml-3 rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:border-emerald-400"
                disabled={syncing}
              >
                Sync now
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="glass grid gap-6 rounded-3xl p-6 md:grid-cols-[1fr]"
          >
            <StepHeader step={step} />

            {step === 0 && (
              <section className="grid gap-4 md:grid-cols-1">
                <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Administrative Information
                  </h3>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                      <p className="text-sm font-semibold text-slate-800">
                        Date
                      </p>
                      <p className="text-xs text-slate-500">তারিখ</p>
                      <div className="mt-2 flex flex-col gap-2">
                        <input
                          type="date"
                          name="date"
                          value={form.date}
                          onChange={(e) => {
                            setForm((prev) => ({
                              ...prev,
                              date: e.target.value,
                            }));
                            handleFormChange("date", e.target.value);
                          }}
                          className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors ${errors.date
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            : "border-slate-200 hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                            } dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-900/40`}
                        />
                        {form.date && (
                          <p className="text-xs font-medium text-emerald-600">
                            Selected:{" "}
                            {new Date(
                              form.date + "T00:00:00"
                            ).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                      {errors.date && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          {errors.date}
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                      <p className="text-sm font-semibold text-slate-800">
                        Survey Type
                      </p>
                      <p className="text-xs text-slate-500">জরিপের ধরণ</p>
                      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                        <RadioPill
                          name="surveyType"
                          label="New Patient"
                          value="new"
                          checked={form.surveyType === "new"}
                          onChange={(value) => {
                            setForm((prev) => ({ ...prev, surveyType: value }));
                            handleFormChange("surveyType", value);
                          }}
                          error={errors.surveyType}
                        />
                        <RadioPill
                          name="surveyType"
                          label="Follow Up Patient"
                          value="followup"
                          checked={form.surveyType === "followup"}
                          onChange={(value) => {
                            setForm((prev) => ({ ...prev, surveyType: value }));
                            handleFormChange("surveyType", value);
                          }}
                          error={errors.surveyType}
                        />
                      </div>
                      {errors.surveyType && (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          {errors.surveyType}
                        </p>
                      )}
                    </div>

                    {form.surveyType === "followup" && (
                      <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                        <p className="text-sm font-semibold text-slate-800">
                          Which Follow Up?
                        </p>
                        <p className="text-xs text-slate-500">কোন ফলো-আপ?</p>
                        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                          <RadioPill
                            name="surveyStatus"
                            label="Malnutrition"
                            value="malnutrition"
                            checked={form.surveyStatus === "malnutrition"}
                            onChange={(value) => {
                              setForm((prev) => ({
                                ...prev,
                                surveyStatus: value,
                              }));
                              handleFormChange("surveyStatus", value);
                            }}
                            error={errors.surveyStatus}
                          />
                          <RadioPill
                            name="surveyStatus"
                            label="Mental Health"
                            value="mentalhealth"
                            checked={form.surveyStatus === "mentalhealth"}
                            onChange={(value) => {
                              setForm((prev) => ({
                                ...prev,
                                surveyStatus: value,
                              }));
                              handleFormChange("surveyStatus", value);
                            }}
                            error={errors.surveyStatus}
                          />
                        </div>
                        {errors.surveyStatus && (
                          <p className="mt-2 text-xs font-medium text-red-600">
                            {errors.surveyStatus}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                      <p className="text-sm font-semibold text-slate-800">
                        NIROG ID
                      </p>
                      <p className="text-xs text-slate-500">নীরোগ আইডি</p>
                      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                        <Input
                          type="text"
                          value={form.nirogId}
                          onChange={(e) => {
                            setForm({ ...form, nirogId: e.target.value });
                            handleFormChange("nirogId", e.target.value);
                          }}
                          error={errors.nirogId}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {step === 1 && (
              <section className="grid gap-4 md:grid-cols-1">
                {isDataFromPrevious && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <p className="font-semibold">
                      Previous Patient Record Found
                    </p>
                    <p className="text-xs mt-1">
                      The fields below are pre-filled from your last record. You
                      can edit them if needed, or skip to the next section.
                    </p>
                  </div>
                )}
                <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">
                    General Information
                  </h3>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                      <p className="text-sm font-semibold text-slate-800">
                        Camp Name
                      </p>
                      <p className="text-xs text-slate-500">ক্যাম্পের নাম</p>
                      {isDataFromPrevious && (
                        <p className="text-xs text-amber-600 font-medium mt-1">
                          From previous record
                        </p>
                      )}
                      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                        <select
                          className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none ${isDataFromPrevious ? "bg-amber-50 border-amber-200" : ""} ${errors.campName
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                            }`}
                          value={form.campName}
                          onChange={(e) => {
                            setForm({ ...form, campName: e.target.value });
                            handleFormChange("campName", e.target.value);
                          }}
                          required
                        >
                          <option value="">Select</option>
                          {camps?.camps.map((camp) => (
                            <option key={camp} value={camp}>
                              {camp}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.campName && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          {errors.campName}
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                      <p className="text-sm font-semibold text-slate-800">
                        Patient Name
                      </p>
                      <p className="text-xs text-slate-500">রোগীর নাম</p>
                      {isDataFromPrevious && (
                        <p className="text-xs text-amber-600 font-medium mt-1">
                          From previous record
                        </p>
                      )}
                      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                        <Input
                          value={form.patientName}
                          onChange={(e) => {
                            setForm({ ...form, patientName: e.target.value });
                            handleFormChange("patientName", e.target.value);
                          }}
                          error={errors.patientName}
                          required
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                      <p className="text-sm font-semibold text-slate-800">
                        Age
                      </p>
                      <p className="text-xs text-slate-500">বয়স</p>
                      {isDataFromPrevious && (
                        <p className="text-xs text-amber-600 font-medium mt-1">
                          From previous record
                        </p>
                      )}
                      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                        <Input
                          type="number"
                          value={form.age}
                          onChange={(e) => {
                            setForm({ ...form, age: e.target.value });
                            handleFormChange("age", e.target.value);
                          }}
                          error={errors.age}
                          required
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                      <p className="text-sm font-semibold text-slate-800">
                        Gender
                      </p>
                      <p className="text-xs text-slate-500">জেন্ডার</p>
                      {isDataFromPrevious && (
                        <p className="text-xs text-amber-600 font-medium mt-1">
                          From previous record
                        </p>
                      )}
                      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                        <select
                          className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none ${isDataFromPrevious ? "bg-amber-50 border-amber-200" : ""} ${errors.gender
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                            }`}
                          value={form.gender}
                          onChange={(e) => {
                            setForm({ ...form, gender: e.target.value });
                            handleFormChange("gender", e.target.value);
                          }}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      {errors.gender && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          {errors.gender}
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                      <p className="text-sm font-semibold text-slate-800">
                        Address
                      </p>
                      <p className="text-xs text-slate-500">ঠিকানা</p>
                      {isDataFromPrevious && (
                        <p className="text-xs text-amber-600 font-medium mt-1">
                          From previous record
                        </p>
                      )}
                      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                        <Input
                          type="text"
                          value={form.address}
                          onChange={(e) => {
                            setForm({ ...form, address: e.target.value });
                            handleFormChange("address", e.target.value);
                          }}
                          error={errors.address}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                {isDataFromPrevious && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-4">
                    <p className="font-semibold">
                      Previous Patient Record Found
                    </p>
                    <p className="text-xs mt-1">
                      The fields below are pre-filled from your last record. You
                      can edit them if needed, or skip to the next section.
                    </p>
                  </div>
                )}
                <h3 className="text-sm font-semibold text-slate-900">
                  School & Family Background
                </h3>
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Current School Status
                    </p>
                    <p className="text-xs text-slate-500">
                      বর্তমান স্কুলের অবস্থা
                    </p>
                    {isDataFromPrevious && (
                      <p className="text-xs text-amber-600 font-medium mt-1">
                        From previous record
                      </p>
                    )}
                    <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                      <RadioPill
                        name="schoolStatus"
                        label="Attending School"
                        value="attending"
                        checked={form.schoolStatus === "attending"}
                        onChange={(value) => {
                          setForm((prev) => ({ ...prev, schoolStatus: value }));
                          handleFormChange("schoolStatus", value);
                        }}
                        error={errors.schoolStatus}
                      />
                      <RadioPill
                        name="schoolStatus"
                        label="Not attending School"
                        value="not_attending"
                        checked={form.schoolStatus === "not_attending"}
                        onChange={(value) => {
                          setForm((prev) => ({ ...prev, schoolStatus: value }));
                          handleFormChange("schoolStatus", value);
                        }}
                        error={errors.schoolStatus}
                      />
                    </div>
                    {errors.schoolStatus && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {errors.schoolStatus}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Duration of Stay in the Camp
                    </p>
                    <p className="text-xs text-slate-500">
                      ক্যাম্পে থাকার সময়কাল
                    </p>
                    {isDataFromPrevious && (
                      <p className="text-xs text-amber-600 font-medium mt-1">
                        From previous record
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((year) => (
                        <RadioPill
                          key={year}
                          name="campStayYears"
                          label={`${year} ${year === 1 ? "Year" : "Years"}`}
                          value={String(year)}
                          checked={Number(form.campStayYears) === year}
                          onChange={(value) => {
                            setForm((prev) => ({
                              ...prev,
                              campStayYears: value,
                            }));
                            handleFormChange("campStayYears", value);
                          }}
                          error={errors.campStayYears}
                        />
                      ))}
                    </div>
                    {errors.campStayYears && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {errors.campStayYears}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Do you live with your parents?
                    </p>
                    {isDataFromPrevious && (
                      <p className="text-xs text-amber-600 font-medium mt-1">
                        From previous record
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      তুমি কি তোমার বাবা-মায়ের সাথে থাকো?
                    </p>
                    <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                      <RadioPill
                        name="livesWithParents"
                        label="Yes"
                        value="yes"
                        checked={form.livesWithParents === "yes"}
                        onChange={(value) => {
                          setForm((prev) => ({
                            ...prev,
                            livesWithParents: value,
                          }));
                          handleFormChange("livesWithParents", value);
                        }}
                        error={errors.livesWithParents}
                      />
                      <RadioPill
                        name="livesWithParents"
                        label="No"
                        value="no"
                        checked={form.livesWithParents === "no"}
                        onChange={(value) => {
                          setForm((prev) => ({
                            ...prev,
                            livesWithParents: value,
                          }));
                          handleFormChange("livesWithParents", value);
                        }}
                        error={errors.livesWithParents}
                      />
                    </div>
                    {errors.livesWithParents && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {errors.livesWithParents}
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                    <p className="text-sm font-semibold text-slate-800">
                      How many members are there in your family?
                    </p>
                    <p className="text-xs text-slate-500">
                      তোমার পরিবারের কতজন সদস্য আছে?
                    </p>
                    {isDataFromPrevious && (
                      <p className="text-xs text-amber-600 font-medium mt-1">
                        From previous record
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <RadioPill
                          key={num}
                          name="familySize"
                          label={String(num)}
                          value={String(num)}
                          checked={Number(form.familySize) === num}
                          onChange={(value) => {
                            setForm((prev) => ({ ...prev, familySize: value }));
                            handleFormChange("familySize", value);
                          }}
                          error={errors.familySize}
                        />
                      ))}
                      <RadioPill
                        name="familySize"
                        label="10+"
                        value="10"
                        checked={Number(form.familySize) === 10}
                        onChange={(value) => {
                          setForm((prev) => ({ ...prev, familySize: value }));
                          handleFormChange("familySize", value);
                        }}
                        error={errors.familySize}
                      />
                    </div>
                    {errors.familySize && (
                      <p className="mt-2 text-xs font-medium text-red-600">
                        {errors.familySize}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">
                  Malnutrition Assessment
                </h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Input
                    label="Height (cm)"
                    type="number"
                    value={form.heightCm}
                    onChange={(e) => {
                      setForm({ ...form, heightCm: e.target.value });
                      handleFormChange("heightCm", e.target.value);
                    }}
                    error={errors.heightCm}
                  />
                  <Input
                    label="Weight (kg)"
                    type="number"
                    value={form.weightKg}
                    onChange={(e) => {
                      setForm({ ...form, weightKg: e.target.value });
                      handleFormChange("weightKg", e.target.value);
                    }}
                    error={errors.weightKg}
                  />

                  {ageInMonths <= 60 && (<Input
                    label="MUAC (cm)"
                    type="number"
                    value={form.muacCm}
                    onChange={(e) => {
                      setForm({ ...form, muacCm: e.target.value });
                      handleFormChange("muacCm", e.target.value);
                    }}
                    error={errors.muacCm}
                  />)}


                  {/* <Input
                    label="BMI (kg/m2)"
                    type="number"
                    value={(form.weightKg / ((form.heightCm / 100) ** 2)).toFixed(2) || ""}
                    onChange={(e) => {
                      setForm({ ...form, bmi: e.target.value });
                      handleFormChange("bmi", e.target.value);
                    }}
                    error={errors.bmi}
                  /> */}



                  <div className="w-full">
                    <p className="text-sm font-medium text-slate-700 mt-1">Malnutrition Status: </p>
                    {ageInMonths <= 60 ? (
                      <div className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-colors border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
                        {form.muacCm ? (form.muacCm < 11.5 ? "Severe Acute Malnutrition" : form.muacCm >= 11.5 && form.muacCm < 12.5 ? "Moderate Acute Malnutrition" : "Normal") : "N/A"}
                      </div>
                    ) : (<div className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-colors border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">
                      BMI: {bmi} - ZScore {zScore === null ? "N/A" : `: ${zScore}`} - {bmiCategory}
                    </div>)}
                  </div>



                  {/* <div className="w-full">
                    <p className="text-sm font-medium text-slate-700 mt-1">MUAC Status: </p>
                    <p className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-colors border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100">{form.muacCm ? (form.muacCm < 11.5 ? "Severe Acute Malnutrition" : form.muacCm >= 11.5 && form.muacCm < 12.5 ? "Moderate Acute Malnutrition" : "Normal") : "N/A"}</p>
                  </div> */}

                  <div className="col-span-2 space-y-3">
                    <label className="text-sm font-semibold text-slate-800">
                      Nutritional Supplements
                    </label>
                    <p className="text-xs text-slate-500">
                      Select one or more supplements patient is taking
                    </p>
                    <div className="space-y-2 rounded-xl border border-slate-100 bg-white p-3">
                      {nutritionalSupplements.map((supplement) => {
                        const selectedSupplement =
                          form.nutritionalSupplements.find(
                            (s) => s.type === supplement
                          );
                        return (
                          <div
                            key={supplement}
                            className="border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
                          >
                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                              <input
                                type="checkbox"
                                checked={!!selectedSupplement}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setForm((prev) => ({
                                      ...prev,
                                      nutritionalSupplements: [
                                        ...prev.nutritionalSupplements,
                                        {
                                          type: supplement,
                                          quantity: "",
                                          unit: "",
                                        },
                                      ],
                                    }));
                                  } else {
                                    setForm((prev) => ({
                                      ...prev,
                                      nutritionalSupplements:
                                        prev.nutritionalSupplements.filter(
                                          (s) => s.type !== supplement
                                        ),
                                    }));
                                  }
                                }}
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-sm font-medium text-slate-700">
                                {supplement}
                              </span>
                            </label>
                            {selectedSupplement && (
                              <div className="ml-6 flex gap-2">
                                <input
                                  type="number"
                                  placeholder="Quantity"
                                  value={selectedSupplement.quantity}
                                  onChange={(e) => {
                                    setForm((prev) => ({
                                      ...prev,
                                      nutritionalSupplements:
                                        prev.nutritionalSupplements.map((s) =>
                                          s.type === supplement
                                            ? { ...s, quantity: e.target.value }
                                            : s
                                        ),
                                    }));
                                    handleFormChange(
                                      "nutritionalSupplements",
                                      e.target.value
                                    );
                                  }}
                                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                />
                                <select
                                  value={selectedSupplement.unit}
                                  onChange={(e) => {
                                    setForm((prev) => ({
                                      ...prev,
                                      nutritionalSupplements:
                                        prev.nutritionalSupplements.map((s) =>
                                          s.type === supplement
                                            ? { ...s, unit: e.target.value }
                                            : s
                                        ),
                                    }));
                                    handleFormChange(
                                      "nutritionalSupplements",
                                      e.target.value
                                    );
                                  }}
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                >
                                  <option value="">Unit</option>
                                  <option value="Spoon">Spoon</option>
                                  <option value="Piece">Piece</option>
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {step === 4 && (
              <section className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">
                  Mental Health Assessment
                </h3>
                <div className="mt-4 space-y-4">
                  {errors.mentalHealth && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {errors.mentalHealth}
                    </div>
                  )}
                  {mentalHealthQuestions.map((q) => (
                    <div
                      key={q.key}
                      className={`rounded-xl border bg-white px-3 py-3 ${errors[`mental_${q.key}`]
                        ? "border-red-300"
                        : "border-slate-100"
                        }`}
                    >
                      <p className="text-sm font-semibold text-slate-800">
                        {q.en}
                      </p>
                      <p className="text-xs text-slate-500">{q.bn}</p>
                      <div className="mt-2 flex flex-wrap gap-3">
                        {(q.customOptions || responseOptions).map((opt) => {
                          const optLabel =
                            typeof opt === "string" ? opt : opt.label;
                          return (
                            <label
                              key={optLabel}
                              className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${responses[q.key] === optLabel
                                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 text-slate-700"
                                }`}
                            >
                              <input
                                type="radio"
                                className="hidden"
                                name={q.key}
                                value={optLabel}
                                checked={responses[q.key] === optLabel}
                                onChange={() => {
                                  setResponses((prev) => ({
                                    ...prev,
                                    [q.key]: optLabel,
                                  }));
                                  handleResponseChange(q.key, optLabel);
                                }}
                                required
                              />
                              {optLabel}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {step === 5 && (
              <section className="space-y-4 rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">
                  Management Plan
                </h3>
                <p className="text-xs text-slate-600">
                  Total score is calculated from the mental health questionnaire
                  (Never=0, Sometimes=1, Often=2, Always=6).
                </p>
                <div className="space-y-3">
                  <PlanRow
                    label="Low Risk (Score: 0-9)"
                    score={totalScore}
                    active={riskStatus === "low"}
                  />
                  <PlanRow
                    label="Moderate Risk (Score: 10-24)"
                    score={totalScore}
                    active={riskStatus === "moderate"}
                    note="• Psychotherapy • Referral"
                  />
                  <PlanRow
                    label="High Risk (Score: >=25)"
                    score={totalScore}
                    active={riskStatus === "high"}
                    note="• Urgent referral"
                  />
                </div>

                <div className="pt-2">
                  <p className="mb-1 text-sm font-semibold text-slate-800">
                    পরামর্শ
                  </p>
                  <p className="text-xs leading-relaxed text-slate-600">
                    পরিবারের সদস্যদের সঙ্গে ভালো সময় কাটাবে এবং একে অপরকে
                    সাহায্য করবে। নিয়মিত খেলাধুলা করবে বা তোমার পছন্দের কাজগুলো
                    করবে যা তোমাকে আনন্দ দেয়। নিয়মিত পড়াশোনা করবে বা নতুন
                    কিছু শেখার চেষ্টা করবে। সব সময় ভালো দিন নিয়ে ভাববে এবং মন
                    ভালো রাখার চেষ্টা করবে। প্রতিদিন কিছু সময় স্ব-যত্নমূলক
                    ব্যায়াম করবে, যা মনকে শান্ত রাখতে সাহায্য করে। কোনো সমস্যা
                    হলে ঘনিষ্ঠ এবং বিশ্বাসযোগ্য কারো সঙ্গে কথা বলবে অথবা আমাদের
                    সাথে যোগাযোগ করবে।
                  </p>
                </div>

                <div className="pt-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Referral
                  </label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    value={referralOrg}
                    onChange={(e) => setReferralOrg(e.target.value)}
                  >
                    <option value="">Select organization</option>
                    <option value="IOM">
                      International Organization for Migration (IOM)
                    </option>
                    <option value="BRAC">BRAC</option>
                    <option value="CPI-YEAPSA">CPI-YEAPSA</option>
                    <option value="IRC">
                      International Rescue Committee (IRC)
                    </option>
                    <option value="HI">Handicap International (HI)</option>
                    <option value="MSF">Médecins Sans Frontières (MSF)</option>
                  </select>
                </div>
              </section>
            )}

            {status && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {status}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-800 hover:border-slate-300"
                  >
                    Back
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {step < 5 && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300/70 disabled:opacity-50"
                  >
                    Next
                  </button>
                )}
                {step === 5 && (
                  <button
                    type="submit"
                    className="rounded-2xl bg-linear-to-r from-sky-500 to-emerald-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60"
                  >
                    Save assessment
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      )
      }
    </main >
  );
}
