"use client"

import { useEffect } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service if connected
    console.error('Unhandled runtime error caught by boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-rose-500/20 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6">
          <AlertOctagon className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-slate-400 text-sm mb-6">
          An unexpected error occurred in the application. We&apos;ve logged the issue.
        </p>
        <div className="bg-slate-950 rounded-lg p-3 text-left mb-6 overflow-x-auto border border-white/5">
          <code className="text-xs text-rose-400 whitespace-pre-wrap font-mono">
            {error.message || 'Unknown error'}
          </code>
        </div>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
      </motion.div>
    </div>
  );
}
