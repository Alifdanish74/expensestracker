export default function CommitmentDetailLoading() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-800 rounded-xl" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-slate-800 rounded" />
            <div className="h-3 w-24 bg-slate-800/60 rounded" />
          </div>
        </div>

        {/* Amount Banner Skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 text-center">
          <div className="h-4 w-32 bg-slate-800 mx-auto rounded" />
          <div className="h-8 w-36 bg-slate-800 mx-auto rounded" />
        </div>

        {/* Details Card Skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-4 w-28 bg-slate-800 rounded" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-slate-800/60 rounded" />
            <div className="h-4 w-full bg-slate-800/60 rounded" />
            <div className="h-4 w-full bg-slate-800/60 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
