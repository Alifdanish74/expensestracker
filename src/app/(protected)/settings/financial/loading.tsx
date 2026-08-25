export default function FinancialSettingsLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24">
        {/* Back skeleton */}
        <div className="h-5 w-20 bg-slate-800 rounded animate-pulse mb-6" />

        {/* Title skeleton */}
        <div className="space-y-2 mb-6">
          <div className="h-7 w-48 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-800/70 rounded animate-pulse" />
        </div>

        {/* Form card skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse space-y-5">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-slate-800 rounded" />
            <div className="h-10 w-full bg-slate-800/60 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-10 w-full bg-slate-800/60 rounded-xl" />
          </div>
          <div className="h-11 w-full bg-slate-800 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
