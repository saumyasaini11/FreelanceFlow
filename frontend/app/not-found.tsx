"use client"

import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
          <FileQuestion className="w-10 h-10 text-indigo-400" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Page not found</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          We couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
