export default function CreditCardDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-24 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-slate-800 rounded-lg animate-pulse" />
        </div>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-6 w-44 bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-4 w-28 bg-slate-800/60 rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="h-20 bg-slate-950/80 rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
            <div className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
          </div>
          <div className="h-6 bg-slate-800 rounded-full animate-pulse" />
        </div>

        <div className="space-y-3">
          <div className="h-6 w-36 bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-24 bg-slate-900 rounded-2xl border border-slate-800 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
