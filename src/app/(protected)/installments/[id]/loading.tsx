export default function InstalmentDetailLoading() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-800 rounded-xl" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-slate-800 rounded" />
              <div className="h-3 w-24 bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="h-9 w-16 bg-slate-800 rounded-xl" />
        </div>

        {/* Amount Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center space-y-2">
          <div className="h-3 w-32 bg-slate-800 rounded mx-auto" />
          <div className="h-10 w-40 bg-slate-800 rounded mx-auto" />
          <div className="h-3 w-48 bg-slate-800/60 rounded mx-auto" />
        </div>

        {/* Progress Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-4 w-36 bg-slate-800 rounded" />
          <div className="flex justify-between">
            <div className="h-8 w-16 bg-slate-800 rounded" />
            <div className="h-8 w-16 bg-slate-800 rounded" />
          </div>
          <div className="h-3 w-full bg-slate-800 rounded-full" />
        </div>

        {/* Details Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-4 w-32 bg-slate-800 rounded" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-24 bg-slate-800/60 rounded" />
              <div className="h-4 w-28 bg-slate-800 rounded" />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <div className="h-12 w-full bg-slate-800 rounded-xl" />
          <div className="h-12 w-full bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
