export default function TodosLoading() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-800 rounded-xl animate-pulse flex-shrink-0" />
            <div className="space-y-1.5">
              <div className="h-5 w-16 bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-40 bg-slate-800/70 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-9 w-20 bg-slate-800 rounded-xl animate-pulse" />
        </div>

        {/* Section label skeleton */}
        <div className="h-3 w-16 bg-slate-800 rounded animate-pulse" />

        {/* Active task card skeletons */}
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-slate-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-slate-800 rounded" />
                  <div className="h-3 w-1/3 bg-slate-800/70 rounded" />
                </div>
                <div className="flex gap-1">
                  <div className="w-8 h-8 bg-slate-800/60 rounded-lg" />
                  <div className="w-8 h-8 bg-slate-800/60 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Completed section skeleton */}
        <div className="space-y-2 pt-2">
          <div className="h-3 w-20 bg-slate-800 rounded animate-pulse" />
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full border-2 border-slate-700 bg-slate-700/40 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-slate-800/70 rounded" />
                  <div className="h-3 w-1/4 bg-slate-800/50 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
