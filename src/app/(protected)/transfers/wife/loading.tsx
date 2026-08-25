export default function WifeTransferLoading() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-800 rounded-xl animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-5 w-36 bg-slate-800 rounded animate-pulse" />
            <div className="h-3 w-40 bg-slate-800/70 rounded animate-pulse" />
          </div>
        </div>

        {/* Month nav skeleton */}
        <div className="flex justify-center">
          <div className="h-9 w-56 bg-slate-800 rounded-xl animate-pulse" />
        </div>

        {/* Summary card skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse space-y-4">
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="h-8 w-40 bg-slate-700 rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 bg-slate-800/60 rounded-xl" />
            <div className="h-12 bg-slate-800/60 rounded-xl" />
          </div>
        </div>

        {/* History skeleton */}
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 animate-pulse flex items-center justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-slate-800 rounded" />
                <div className="h-3 w-32 bg-slate-800/70 rounded" />
              </div>
              <div className="h-5 w-20 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
