import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm pointer-events-none">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-200">Loading...</span>
      </div>
    </div>
  );
}
