"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { mentalHealthQuestions, responseOptions } from "@/lib/questions";
import { queueAssessment, getQueuedAssessments, clearQueue } from "@/lib/offlineQueue";

const camps = ["Camp 1E", 
    "Camp 1W - Kutupalong",
    "Camp 2E",
    "Camp 2W",
    "Camp 03",
    "Camp 04",
    "Camp 04 Ext",
    "Camp 05",
    "Camp 06",
    "Camp 07",
    "Camp 8E",
    "Camp 8W",
    "Camp 09 - Balukhali",
    "Camp 10",
    "Camp 11",
    "Camp 12",
    "Camp 13",
    "Camp 14 - Hakimpara",
    "Camp 15 - Jamtoli",
    "Camp 16 - Potibonia",
    "Camp 17",
    "Camp 18",
    "Camp 19",
    "Camp 20",
    "Camp 20 Ext",
    "Camp 21 - Chakmarkul",
    "Camp 22 - Unchiprang",
    "Camp 23 - Shamlapur",
    "Camp 24 - Leda",
    "Camp 25 - Ali Khali",
    "Camp 26 - Nayapara",
    "Camp 27 - Jadimura",
    "Other"];



export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
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
  });
  const [responses, setResponses] = useState({});
  const [status, setStatus] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [step, setStep] = useState(0);
  const [referralOrg, setReferralOrg] = useState("");

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
        const value =
          resp === "Never"
            ? 0
            : resp === "Sometimes"
            ? 1
            : resp === "Often"
            ? 2
            : resp === "Always"
            ? 6
            : 0;
        return sum + value;
      }, 0),
    [responses]
  );

  const riskStatus = useMemo(() => {
    if (totalScore >= 25) return "high";
    if (totalScore >= 10) return "moderate";
    return "low";
  }, [totalScore]);

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
    const handler = () => syncQueue();
    window.addEventListener("online", handler);
    return () => window.removeEventListener("online", handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 4) return;
    setStatus("");
    const payload = {
      ...form,
      age: Number(form.age),
      campStayYears: form.campStayYears ? Number(form.campStayYears) : undefined,
      familySize: form.familySize ? Number(form.familySize) : undefined,
      heightCm: Number(form.heightCm),
      weightKg: Number(form.weightKg),
      muacCm: Number(form.muacCm),
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
      setStatus("Saved to server");
      router.refresh();
    };

    if (typeof navigator === "undefined" || !navigator.onLine) {
      await queueAssessment(payload);
      setStatus("Saved offline. We will sync when back online.");
      refreshQueueCount();
      return;
    }

    try {
      await saveOnline();
    } catch (error) {
      await queueAssessment(payload);
      setStatus("Server unreachable. Saved offline and will auto sync.");
      refreshQueueCount();
    }
  };

  return (
    <main className="min-h-screen px-4 py-10">
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
              className={`h-2.5 w-2.5 rounded-full ${
                typeof navigator === "undefined" || navigator.onLine
                  ? "bg-emerald-500"
                  : "bg-amber-400"
              }`}
            />
            {typeof navigator === "undefined" || navigator.onLine
              ? "Online"
              : "Offline mode"}
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
                General Information
              </h3>
              <div>
                  <label className="text-sm font-medium text-slate-700">
                    Camp Name
                  </label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    value={form.campName}
                    onChange={(e) => setForm({ ...form, campName: e.target.value })}
                    required
                  >
                    <option value="">Select</option>
                    {camps.map((camp) => (
                      <option key={camp} value={camp}>
                        {camp}
                      </option>
                    ))}
                  </select>
                </div>
              <div className="mt-3 grid gap-3">
                <Input
                  label="Patient Name"
                  value={form.patientName}
                  onChange={(e) =>
                    setForm({ ...form, patientName: e.target.value })
                  }
                  required
                />
                <Input
                  label="Age"
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  required
                />
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Gender
                  </label>
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    required
                  >
                    <option value="">Select</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <Input
                  label="Address"
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Malnutrition Assessment
              </h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input
                  label="Height (cm)"
                  type="number"
                  value={form.heightCm}
                  onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                />
                <Input
                  label="MUAC (cm)"
                  type="number"
                  value={form.muacCm}
                  onChange={(e) => setForm({ ...form, muacCm: e.target.value })}
                />
              </div>
            </div> */}
          </section>
          )}

          {step === 1 && (
            <section className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
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
                  <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                    <RadioPill
                      name="schoolStatus"
                      label="Attending School"
                      value="attending"
                      checked={form.schoolStatus === "attending"}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, schoolStatus: value }))
                      }
                    />
                    <RadioPill
                      name="schoolStatus"
                      label="Not attending School"
                      value="not_attending"
                      checked={form.schoolStatus === "not_attending"}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, schoolStatus: value }))
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Duration of Stay in the Camp
                  </p>
                  <p className="text-xs text-slate-500">
                    ক্যাম্পে থাকার সময়কাল
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((year) => (
                      <RadioPill
                        key={year}
                        name="campStayYears"
                        label={`${year} ${year === 1 ? "Year" : "Years"}`}
                        value={String(year)}
                        checked={Number(form.campStayYears) === year}
                        onChange={(value) =>
                          setForm((prev) => ({
                            ...prev,
                            campStayYears: value,
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    Do you live with your parents?
                  </p>
                  <p className="text-xs text-slate-500">
                    তুমি কি তোমার বাবা-মায়ের সাথে থাকো?
                  </p>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                    <RadioPill
                      name="livesWithParents"
                      label="Yes"
                      value="yes"
                      checked={form.livesWithParents === "yes"}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, livesWithParents: value }))
                      }
                    />
                    <RadioPill
                      name="livesWithParents"
                      label="No"
                      value="no"
                      checked={form.livesWithParents === "no"}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, livesWithParents: value }))
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                  <p className="text-sm font-semibold text-slate-800">
                    How many members are there in your family?
                  </p>
                  <p className="text-xs text-slate-500">
                    তোমার পরিবারের কতজন সদস্য আছে?
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <RadioPill
                        key={num}
                        name="familySize"
                        label={String(num)}
                        value={String(num)}
                        checked={Number(form.familySize) === num}
                        onChange={(value) =>
                          setForm((prev) => ({ ...prev, familySize: value }))
                        }
                      />
                    ))}
                    <RadioPill
                      name="familySize"
                      label="10+"
                      value="10"
                      checked={Number(form.familySize) === 10}
                      onChange={(value) =>
                        setForm((prev) => ({ ...prev, familySize: value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Malnutrition Assessment
              </h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Input
                  label="Height (cm)"
                  type="number"
                  value={form.heightCm}
                  onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                />
                <Input
                  label="MUAC (cm)"
                  type="number"
                  value={form.muacCm}
                  onChange={(e) => setForm({ ...form, muacCm: e.target.value })}
                />
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Mental Health Assessment
              </h3>
              <div className="mt-4 space-y-4">
                {mentalHealthQuestions.map((q) => (
                  <div
                    key={q.key}
                    className="rounded-xl border border-slate-100 bg-white px-3 py-3"
                  >
                    <p className="text-sm font-semibold text-slate-800">{q.en}</p>
                    <p className="text-xs text-slate-500">{q.bn}</p>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {responseOptions.map((opt) => (
                        <label
                          key={opt}
                          className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                            responses[q.key] === opt
                              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 text-slate-700"
                          }`}
                        >
                          <input
                            type="radio"
                            className="hidden"
                            name={q.key}
                            value={opt}
                            checked={responses[q.key] === opt}
                            onChange={() =>
                              setResponses((prev) => ({ ...prev, [q.key]: opt }))
                            }
                            required
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {step === 4 && (
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
                  পরিবারের সদস্যদের সঙ্গে ভালো সময় কাটাবে এবং একে অপরকে সাহায্য করবে।
                  নিয়মিত খেলাধুলা করবে বা তোমার পছন্দের কাজগুলো করবে যা তোমাকে আনন্দ দেয়।
                  নিয়মিত পড়াশোনা করবে বা নতুন কিছু শেখার চেষ্টা করবে। সব সময় ভালো
                  দিন নিয়ে ভাববে এবং মন ভালো রাখার চেষ্টা করবে। প্রতিদিন কিছু সময়
                  স্ব-যত্নমূলক ব্যায়াম করবে, যা মনকে শান্ত রাখতে সাহায্য করে। কোনো
                  সমস্যা হলে ঘনিষ্ঠ এবং বিশ্বাসযোগ্য কারো সঙ্গে কথা বলবে অথবা আমাদের
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
                  className="rounded-2xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-800 hover:border-slate-300"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {step < 4 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(4, s + 1))}
                  className="rounded-2xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-300/70"
                >
                  Next
                </button>
              )}
              {step === 4 && (
                <button
                  type="submit"
                  className="rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-400 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60"
                >
                  Save assessment
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function StepHeader({ step }) {
  const steps = [
    "General information",
    "School & family",
    "Malnutrition",
    "Mental health",
    "Management plan",
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
      {steps.map((label, index) => (
        <div
          key={label}
          className={`flex items-center gap-1 rounded-full px-3 py-1 ${
            step === index
              ? "bg-emerald-100 text-emerald-800"
              : "bg-white text-slate-600"
          }`}
        >
          <span className="text-[11px] font-semibold">{index + 1}</span>
          <span className="hidden sm:inline">{label}</span>
        </div>
      ))}
    </div>
  );
}

function PlanRow({ label, score, active, note }) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 text-sm ${
        active
          ? "border-emerald-400 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="font-semibold text-slate-800">
        Total Score: {Number.isNaN(score) ? "0" : score} - Status: {label}
      </p>
      {note && <p className="mt-1 text-xs text-slate-600">{note}</p>}
    </div>
  );
}

function Input({ label, ...rest }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        {...rest}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}

function RadioPill({ name, label, value, checked, onChange }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        checked
          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
          : "border-slate-200 text-slate-700"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="hidden"
      />
      {label}
    </label>
  );
}
