export default function PaymentDetailLoading() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5 pb-24">
        {/* Back skeleton */}
        <div className="h-5 w-16 bg-slate-800 rounded animate-pulse" />

        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-32 bg-slate-800/70 rounded animate-pulse" />
        </div>

        {/* Detail card skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 last:border-0">
              <div className="h-3 w-20 bg-slate-800 rounded" />
              <div className="h-4 w-28 bg-slate-700 rounded" />
            </div>
          ))}
        </div>

        {/* Action buttons skeleton */}
        <div className="space-y-2">
          <div className="h-11 w-full bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-11 w-full bg-slate-800/60 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
