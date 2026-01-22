const Input = ({ label, error, onChange, ...rest }) => {
  const handleChange = (e) => {
    onChange?.(e);
  };

  return (
    <div className="w-full">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        {...rest}
        onChange={handleChange}
        className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-colors ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
            : "border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        }`}
      />
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
