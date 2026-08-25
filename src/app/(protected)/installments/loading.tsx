export default function InstalmentsLoading() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-800 rounded-xl" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-slate-800 rounded" />
            <div className="h-3 w-56 bg-slate-800/60 rounded" />
          </div>
        </div>

        {/* Add Button Skeleton */}
        <div className="h-12 w-full bg-slate-800 rounded-xl" />

        {/* Cards Skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-36 bg-slate-800/60 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-800 rounded" />
                  <div className="h-3 w-20 bg-slate-800/60 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-800 rounded" />
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full" />
              <div className="flex gap-4 pt-1">
                <div className="h-3 w-16 bg-slate-800/60 rounded" />
                <div className="h-3 w-24 bg-slate-800/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
