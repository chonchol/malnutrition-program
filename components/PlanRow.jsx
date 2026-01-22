const PlanRow = ({ label, score, active, note }) => {
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
};

export default PlanRow;
