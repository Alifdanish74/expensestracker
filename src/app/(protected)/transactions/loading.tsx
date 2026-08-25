export default function TransactionsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-28">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-4 mb-6 mt-12">
          <div className="h-7 w-36 bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-10 w-16 bg-slate-800 rounded-xl animate-pulse" />
        </div>

        {/* Month nav skeleton */}
        <div className="h-9 w-56 bg-slate-800 rounded-xl animate-pulse mb-5" />

        {/* Total card skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 animate-pulse">
          <div className="h-3 w-24 bg-slate-800 rounded mb-2" />
          <div className="h-6 w-32 bg-slate-800 rounded" />
        </div>

        {/* List skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 animate-pulse space-y-3">
              <div className="h-4 w-3/4 bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-800/70 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
