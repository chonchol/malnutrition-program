const StepHeader = ({ step }) => {
  const steps = [
    "Administrative info",
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
};

export default StepHeader;
