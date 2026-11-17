const RadioPill = ({ name, label, value, checked, onChange, error }) => {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
        checked
          ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-200"
          : error
            ? "border-red-300 text-slate-700 dark:border-red-700 dark:text-slate-200"
            : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
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
};

export default RadioPill;
