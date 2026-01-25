const StatCard = ({ title, value }) => {
  return (
    <div className="glass rounded-3xl p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
        {title}
      </p>
      <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
};

export default StatCard;
