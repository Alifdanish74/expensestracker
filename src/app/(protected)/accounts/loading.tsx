
export default function AccountsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-4 mb-6 mt-12">
          <div>
            <div className="h-7 w-28 bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-4 w-52 bg-slate-800 rounded-lg animate-pulse mt-2" />
          </div>
          <div className="h-10 w-16 bg-slate-800 rounded-xl animate-pulse" />
        </div>

        {/* Card skeletons */}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 bg-slate-800 rounded" />
                  <div className="h-3 w-24 bg-slate-800/70 rounded" />
                  <div className="flex gap-4 mt-3">
                    <div className="h-8 w-20 bg-slate-800/60 rounded" />
                    <div className="h-8 w-20 bg-slate-800/60 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
