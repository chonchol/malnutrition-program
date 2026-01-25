const PlanRow = ({ label, score, active, note }) => {
  let colorClass = "";
  if (active && score <= 9) {
    colorClass = "border-emerald-400 bg-emerald-50";
  } else if (active && score >= 10 && score <= 24) {
    colorClass = "border-yellow-400 bg-yellow-50";
  } else if (active && score >= 25) {
    colorClass = "border-red-400 bg-red-50";
  } else {
    colorClass = "border-slate-200 bg-slate-50";
  }

  return (
    <div className={`rounded-xl border px-3 py-2 text-sm ${colorClass}`}>
      <p className="font-semibold text-slate-800">
        Total Score: {Number.isNaN(score) ? "0" : score} - Status: {label}
      </p>
      {note && <p className="mt-1 text-xs text-slate-600">{note}</p>}
    </div>
  );
};

export default PlanRow;
