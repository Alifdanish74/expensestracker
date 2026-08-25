export default function TransactionDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-28">
        {/* Back nav skeleton */}
        <div className="h-5 w-24 bg-slate-800 rounded-lg animate-pulse mb-6" />

        {/* Title + amount skeleton */}
        <div className="mb-6 space-y-2">
          <div className="h-7 w-48 bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-slate-800 rounded-lg animate-pulse" />
        </div>

        {/* Detail card skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-5 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 last:border-0"
            >
              <div className="h-3 w-16 bg-slate-800 rounded" />
              <div className="h-4 w-24 bg-slate-800/80 rounded" />
            </div>
          ))}
        </div>

        {/* Action button skeletons */}
        <div className="space-y-3">
          <div className="h-12 w-full bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-12 w-full bg-red-500/10 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}
