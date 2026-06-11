export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-16 border-b border-white/5" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-40 rounded-lg bg-white/5" />
            <div className="mt-2 h-4 w-56 rounded-lg bg-white/5" />
          </div>
          <div className="h-10 w-28 rounded-lg bg-white/5" />
        </div>
        <div className="mt-8 space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
    </div>
  );
}
