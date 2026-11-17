const PlanRow = ({ label, score, active, note }) => {
  let colorClass = "";
  if (active && score <= 9) {
    colorClass = "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40";
  } else if (active && score >= 10 && score <= 24) {
    colorClass = "border-yellow-400 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/40";
  } else if (active && score >= 25) {
    colorClass = "border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950/40";
  } else {
    colorClass = "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900";
  }

  return (
    <div className={`rounded-xl border px-3 py-2 text-sm ${colorClass}`}>
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        Total Score: {Number.isNaN(score) ? "0" : score} - Status: {label}
      </p>
      {note && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{note}</p>}
    </div>
  );
};

export default PlanRow;
