export default function LinkAnalyticsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-16 border-b border-white/5" />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="h-4 w-36 rounded bg-white/5" />
        <div className="mt-5 h-8 w-48 rounded-lg bg-white/5" />
        <div className="mt-2 h-4 w-72 rounded bg-white/5" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
        <div className="mt-6 h-80 rounded-2xl bg-white/[0.04]" />
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
    </div>
  );
}
