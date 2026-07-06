"use client"

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { generateProposal, getRateAdvice, getProjectHealth, RateAdvisorOutput, ProjectHealthOutput } from '@/lib/api/ai';
import { getProjects } from '@/lib/api/projects';
import { Sparkles, FileText, DollarSign, Activity, Copy, Check, Loader2, X, ChevronRight, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Proposal Tool ────────────────────────────────────────────────────────────
function ProposalGenerator() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ projectName: '', clientType: 'Business', scope: '', budget: '', deadline: '', skills: '' });
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: generateProposal,
    onSuccess: (data) => setResult(data.proposal),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      projectName: form.projectName,
      clientType: form.clientType,
      scope: form.scope,
      budget: Number(form.budget),
      deadline: form.deadline,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  const handleCopy = () => {
    if (result) { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <>
      <motion.div whileHover={{ y: -2, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
        className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl cursor-pointer group"
        onClick={() => setOpen(true)}>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Proposal Generator</h3>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">AI-crafted client proposals from a brief project description. Win more contracts.</p>
        <div className="flex items-center gap-1 mt-4 text-indigo-400 text-sm font-semibold">
          Open tool <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); setResult(null); }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-white/5 px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">Proposal Generator</h3>
                </div>
                <button onClick={() => { setOpen(false); setResult(null); }} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-6">
                {!result ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-semibold">Project Name *</label>
                        <input value={form.projectName} onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} required
                          placeholder="e.g. E-commerce Redesign"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-semibold">Client Type</label>
                        <select value={form.clientType} onChange={e => setForm(f => ({ ...f, clientType: e.target.value }))}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500">
                          <option>Business</option><option>Startup</option><option>Agency</option><option>Individual</option><option>Non-profit</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">Scope / Requirements *</label>
                      <textarea value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} required rows={4}
                        placeholder="Describe what the project involves, key deliverables, tech stack, etc."
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-semibold">Budget ($) *</label>
                        <input type="number" min="0" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} required
                          placeholder="5000"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-semibold">Deadline *</label>
                        <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} required
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">Your Skills (comma-separated)</label>
                      <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                        placeholder="React, Node.js, TypeScript, AWS"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit" disabled={mutation.isPending}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm disabled:opacity-50 cursor-pointer">
                        {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4" />Generate Proposal</>}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-semibold text-emerald-400">✓ Proposal generated</p>
                      <div className="flex gap-2">
                        <button onClick={handleCopy}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer">
                          {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                        </button>
                        <button onClick={() => setResult(null)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs cursor-pointer">Edit</button>
                      </div>
                    </div>
                    <div className="bg-slate-950/80 border border-white/5 rounded-xl p-5 max-h-96 overflow-y-auto">
                      <pre className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">{result}</pre>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Rate Advisor Tool ────────────────────────────────────────────────────────
function RateAdvisor() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ skills: '', experienceYears: 3, projectType: 'Web Development', location: 'United States' });
  const [result, setResult] = useState<RateAdvisorOutput | null>(null);

  const mutation = useMutation({
    mutationFn: getRateAdvice,
    onSuccess: (data) => setResult(data.advice),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      experienceYears: Number(form.experienceYears),
      projectType: form.projectType,
      location: form.location,
    });
  };

  return (
    <>
      <motion.div whileHover={{ y: -2, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
        className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl cursor-pointer group"
        onClick={() => setOpen(true)}>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Rate Advisor</h3>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">Get AI-recommended hourly and project rates based on your skills and market.</p>
        <div className="flex items-center gap-1 mt-4 text-emerald-400 text-sm font-semibold">
          Open tool <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); setResult(null); }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-white/5 px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">Rate Advisor</h3>
                </div>
                <button onClick={() => { setOpen(false); setResult(null); }} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-6">
                {!result ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">Your Skills *</label>
                      <input value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} required
                        placeholder="React, Node.js, Python, UI/UX"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-semibold">Experience (years)</label>
                        <input type="number" min="0" max="40" value={form.experienceYears}
                          onChange={e => setForm(f => ({ ...f, experienceYears: Number(e.target.value) }))}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-semibold">Project Type *</label>
                        <select value={form.projectType} onChange={e => setForm(f => ({ ...f, projectType: e.target.value }))}
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500">
                          <option>Web Development</option><option>Mobile Development</option><option>UI/UX Design</option>
                          <option>Data Science</option><option>DevOps</option><option>Content Writing</option><option>Consulting</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">Market / Location *</label>
                      <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required
                        placeholder="United States, Europe, India..."
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit" disabled={mutation.isPending}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm disabled:opacity-50 cursor-pointer">
                        {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4" />Get Advice</>}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    {/* Rate ranges */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400 font-semibold mb-1">Hourly Rate</p>
                        <p className="text-2xl font-extrabold text-emerald-400">${result.hourlyMin}–${result.hourlyMax}</p>
                        <p className="text-xs text-slate-500">/hour</p>
                      </div>
                      <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4 text-center">
                        <p className="text-xs text-slate-400 font-semibold mb-1">Project Rate</p>
                        <p className="text-2xl font-extrabold text-indigo-400">${(result.projectMin / 1000).toFixed(0)}k–${(result.projectMax / 1000).toFixed(0)}k</p>
                        <p className="text-xs text-slate-500">/project</p>
                      </div>
                    </div>
                    <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" />Reasoning</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{result.reasoning}</p>
                    </div>
                    <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" />Market Context</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{result.marketContext}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-amber-400" />Pro Tips</p>
                      {result.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="text-amber-400 font-bold shrink-0">{i + 1}.</span> {tip}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setResult(null)} className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-sm font-semibold cursor-pointer">Try again</button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Project Health Tool ───────────────────────────────────────────────────────
function ProjectHealthTool() {
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [result, setResult] = useState<{ health: ProjectHealthOutput; project: { name: string; status: string; progress: number } } | null>(null);

  const { data: projectsData } = useQuery({
    queryKey: ['projects-ai-selection'],
    queryFn: () => getProjects('', '', 1, 100),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () => getProjectHealth(selectedProjectId),
    onSuccess: (data) => setResult({ health: data.health, project: data.project }),
  });

  const gradeColors: Record<string, string> = {
    A: 'text-emerald-400', B: 'text-teal-400', C: 'text-amber-400', D: 'text-orange-400', F: 'text-rose-400',
  };
  const riskColors: Record<string, string> = {
    low: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    medium: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    high: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <>
      <motion.div whileHover={{ y: -2, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
        className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl cursor-pointer group"
        onClick={() => setOpen(true)}>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Project Health Monitor</h3>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">AI risk scoring for active projects. Catch issues before they become problems.</p>
        <div className="flex items-center gap-1 mt-4 text-purple-400 text-sm font-semibold">
          Open tool <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); setResult(null); }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-white/5 px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100">Project Health Monitor</h3>
                </div>
                <button onClick={() => { setOpen(false); setResult(null); }} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-6">
                {!result ? (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-semibold">Select Project *</label>
                      <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-purple-500">
                        <option value="">Choose a project...</option>
                        {projectsData?.projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => { if (selectedProjectId) mutation.mutate(); }} disabled={!selectedProjectId || mutation.isPending}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm disabled:opacity-50 cursor-pointer">
                        {mutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4" />Analyze Health</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Score gauge */}
                    <div className="flex items-center gap-5 bg-slate-950/60 border border-white/5 rounded-xl p-5">
                      <div className="relative w-24 h-24 shrink-0">
                        <svg viewBox="0 0 36 36" className="w-24 h-24 rotate-[-90deg]">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none" stroke="#6366f1" strokeWidth="3"
                            strokeDasharray={`${result.health.score}, 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-2xl font-extrabold ${gradeColors[result.health.grade]}`}>{result.health.grade}</span>
                          <span className="text-xs text-slate-400">{result.health.score}/100</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-slate-100">{result.project.name}</p>
                        <p className="text-sm text-slate-400 mt-0.5">{result.health.summary}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-500">{result.project.status}</span>
                          <span className="text-xs text-slate-600">·</span>
                          <span className="text-xs text-indigo-400">{result.project.progress}% done</span>
                        </div>
                      </div>
                    </div>

                    {/* Risks */}
                    {result.health.risks.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-rose-400" />Risk Flags</p>
                        {result.health.risks.map((risk, i) => (
                          <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg border ${riskColors[risk.severity]}`}>
                            <span className="font-bold uppercase shrink-0">{risk.severity}</span>
                            <span>{risk.message}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    {result.health.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-amber-400" />Recommended Actions</p>
                        {result.health.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-indigo-400 font-bold shrink-0">→</span> {rec}
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => { setResult(null); setSelectedProjectId(''); }}
                      className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white text-sm font-semibold cursor-pointer">
                      Analyze another project
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIAssistantPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-slate-100">

      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            AI Assistant
          </h1>
        </div>
        <p className="text-slate-400 text-sm max-w-2xl">
          Three AI-powered tools to help you win more clients, price your work competitively, and catch project risks early. Powered by GPT-4o-mini.
        </p>
      </div>

      {/* Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProposalGenerator />
        <RateAdvisor />
        <ProjectHealthTool />
      </div>

      {/* Info Footer */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-300">AI Model: GPT-4o-mini</p>
          <p className="text-xs text-slate-400 mt-0.5">
            All AI features require a valid <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-300">OPENAI_API_KEY</code> in your backend environment.
            Without it, the tools return high-quality mock responses so the interface remains fully usable.
          </p>
        </div>
      </div>
    </div>
  );
}
