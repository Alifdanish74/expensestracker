export default function CreditCardsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-6">
        {/* Top bar skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-8 w-20 bg-slate-800 rounded-lg animate-pulse" />
        </div>

        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-4 w-60 bg-slate-800/60 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-slate-800 rounded-xl animate-pulse" />
        </div>

        {/* Cards skeleton */}
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-36 bg-slate-800 rounded-lg animate-pulse" />
                <div className="h-7 w-20 bg-slate-800 rounded-lg animate-pulse" />
              </div>
              <div className="h-16 bg-slate-950/60 rounded-xl animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-slate-800/50 rounded-xl animate-pulse" />
                <div className="h-12 bg-slate-800/50 rounded-xl animate-pulse" />
              </div>
              <div className="h-4 bg-slate-800 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
