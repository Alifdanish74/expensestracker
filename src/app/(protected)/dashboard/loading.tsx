export default function DashboardLoading() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24 animate-pulse">

        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-28 bg-slate-800 rounded-lg" />
            <div className="h-3 w-32 bg-slate-800/60 rounded" />
          </div>
          <div className="flex gap-1.5">
            <div className="w-14 h-9 bg-slate-800 rounded-xl" />
            <div className="w-16 h-9 bg-slate-800 rounded-xl" />
            <div className="w-9 h-9 bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* Month nav skeleton */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-9 h-9 bg-slate-800 rounded-xl" />
          <div className="h-5 w-32 bg-slate-800 rounded-lg" />
          <div className="w-9 h-9 bg-slate-800 rounded-xl" />
        </div>

        {/* Net income card skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="h-4 w-36 bg-slate-800 rounded" />
          <div className="h-8 w-44 bg-slate-800 rounded-lg" />
        </div>

        {/* Actual spending card skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-32 bg-slate-800 rounded" />
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between">
              <div className="h-4 w-32 bg-slate-800 rounded" />
              <div className="h-5 w-24 bg-slate-800 rounded" />
            </div>
            <div className="border-t border-slate-800 pt-3 flex justify-between">
              <div className="h-4 w-44 bg-slate-800 rounded" />
              <div className="h-5 w-24 bg-slate-800 rounded" />
            </div>
          </div>
        </div>

        {/* Add expense button skeleton */}
        <div className="h-12 bg-slate-800 rounded-xl" />

        {/* Category section skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-40 bg-slate-800 rounded" />
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-4 py-3.5 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-32 bg-slate-800 rounded" />
                  <div className="h-4 w-20 bg-slate-800 rounded" />
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Monthly obligations skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-40 bg-slate-800 rounded" />
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between">
              <div className="h-4 w-36 bg-slate-800 rounded" />
              <div className="h-6 w-28 bg-slate-800 rounded" />
            </div>
            <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-4">
              <div className="h-10 bg-slate-800/60 rounded-lg" />
              <div className="h-10 bg-slate-800/60 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Payments to handle skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-36 bg-slate-800 rounded" />
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-800/60 last:border-0">
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-slate-800 rounded" />
                  <div className="h-3 w-20 bg-slate-800/60 rounded" />
                </div>
                <div className="h-5 w-20 bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
