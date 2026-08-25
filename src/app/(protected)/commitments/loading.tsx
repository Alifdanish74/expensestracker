export default function CommitmentsLoading() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-800 rounded-xl" />
          <div className="space-y-2">
            <div className="h-5 w-48 bg-slate-800 rounded" />
            <div className="h-3 w-64 bg-slate-800/60 rounded" />
          </div>
        </div>

        {/* Total Summary Card Skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="h-4 w-40 bg-slate-800 rounded" />
          <div className="h-8 w-32 bg-slate-800 rounded" />
        </div>

        {/* Button Skeleton */}
        <div className="h-12 w-full bg-slate-800 rounded-xl" />

        {/* Cards Skeleton */}
        <div className="space-y-3">
          <div className="h-24 w-full bg-slate-900 border border-slate-800 rounded-2xl" />
          <div className="h-24 w-full bg-slate-900 border border-slate-800 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
