const loading = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
};

export default loading;
