"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTimeEntries, createTimeEntry, deleteTimeEntry, getTimeSummary, TimeEntry } from '@/lib/api/timeEntries';
import { getProjects } from '@/lib/api/projects';
import { Play, Square, Plus, Trash2, Clock, DollarSign, Calendar, X, Loader2, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';

interface ManualEntryForm {
  projectId: string;
  description: string;
  date: string;
  hours: number;
  minutes: number;
  hourlyRate: number;
}

export default function TimeTrackingPage() {
  const queryClient = useQueryClient();

  // Live timer state
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [timerProjectId, setTimerProjectId] = useState('');
  const [timerDescription, setTimerDescription] = useState('');
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manual form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ManualEntryForm>({
    defaultValues: { projectId: '', description: '', date: new Date().toISOString().split('T')[0], hours: 0, minutes: 30, hourlyRate: 0 },
  });

  // Queries
  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['time-entries'],
    queryFn: () => getTimeEntries('', 1, 50),
  });
  const { data: summaryData } = useQuery({
    queryKey: ['time-summary'],
    queryFn: getTimeSummary,
  });
  const { data: projectsData } = useQuery({
    queryKey: ['projects-selection'],
    queryFn: () => getProjects('', '', 1, 100),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-summary'] });
      showNotification('Time entry logged!', 'success');
      setIsModalOpen(false);
      reset();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      showNotification(e.response?.data?.error?.message || 'Failed to log entry.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTimeEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-summary'] });
      showNotification('Entry deleted.', 'success');
    },
  });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Timer tick
  const tick = useCallback(() => setElapsed(s => s + 1), []);

  const startTimer = () => {
    if (!timerProjectId) { showNotification('Please select a project first.', 'error'); return; }
    const start = new Date();
    setTimerStartTime(start);
    setIsRunning(true);
    setElapsed(0);
    // Create a time entry immediately so it persists even if browser closes
    createMutation.mutate(
      { projectId: timerProjectId, description: timerDescription, startTime: start.toISOString() },
      {
        onSuccess: (data) => {
          setActiveEntryId(data.timeEntry._id);
        },
      }
    );
  };

  const stopTimer = async () => {
    if (!activeEntryId || !timerStartTime) return;
    const endTime = new Date();
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    try {
      const { default: api } = await import('@/lib/api');
      await api.put(`/time-entries/${activeEntryId}`, { endTime: endTime.toISOString() });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-summary'] });
      showNotification('Timer stopped and entry saved!', 'success');
    } catch {
      showNotification('Timer stopped but failed to save duration.', 'error');
    }
    setActiveEntryId(null);
    setElapsed(0);
    setTimerStartTime(null);
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, tick]);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const onManualSubmit = (values: ManualEntryForm) => {
    const totalMinutes = values.hours * 60 + values.minutes;
    const startTime = new Date(`${values.date}T09:00:00.000Z`);
    const endTime = new Date(startTime.getTime() + totalMinutes * 60000);
    createMutation.mutate({
      projectId: values.projectId,
      description: values.description,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      hourlyRate: values.hourlyRate,
    });
  };

  const summary = summaryData?.summary;
  const entries = entriesData?.timeEntries || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-slate-100">
      
      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg backdrop-blur-md border flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            <span className="text-sm font-semibold">{notification.message}</span>
            <button onClick={() => setNotification(null)}><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Time Tracking
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Log work sessions, run timers, and track billable hours by project.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Manual Entry
        </motion.button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'This Week', hours: summary?.thisWeek.hours ?? 0, earnings: summary?.thisWeek.earnings ?? 0, color: 'from-indigo-500 to-purple-500' },
          { label: 'This Month', hours: summary?.thisMonth.hours ?? 0, earnings: summary?.thisMonth.earnings ?? 0, color: 'from-purple-500 to-pink-500' },
          { label: 'All Time', hours: summary?.allTime.hours ?? 0, earnings: summary?.allTime.earnings ?? 0, color: 'from-pink-500 to-rose-500' },
        ].map((card) => (
          <div key={card.label} className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-lg">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
            <div className="flex justify-between items-end mt-3">
              <div>
                <p className="text-2xl font-extrabold text-slate-100">{card.hours.toFixed(1)}<span className="text-sm text-slate-400 ml-1">hrs</span></p>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${card.color}`}>
                  ${card.earnings.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">earned</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Timer Widget */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-5">
          <Timer className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold">Live Timer</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 space-y-3">
            <select
              value={timerProjectId}
              onChange={e => setTimerProjectId(e.target.value)}
              disabled={isRunning}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="">Select project...</option>
              {projectsData?.projects.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={timerDescription}
              onChange={e => setTimerDescription(e.target.value)}
              disabled={isRunning}
              placeholder="What are you working on?"
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className={`text-4xl font-mono font-bold tabular-nums transition-all ${isRunning ? 'text-indigo-400' : 'text-slate-400'}`}>
              {formatElapsed(elapsed)}
            </div>
            {!isRunning ? (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={startTimer}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" /> Start
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={stopTimer}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" /> Stop
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Time Log Table */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-lg font-bold">Time Log</h3>
          <span className="text-xs text-slate-400">{entries.length} entries</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-t-indigo-500 border-white/5 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm">Loading entries...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Clock className="w-12 h-12 text-slate-500 mx-auto opacity-75" />
            <p className="font-bold text-slate-300">No time entries yet</p>
            <p className="text-xs text-slate-400">Start a timer or add a manual entry to begin tracking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Project</th>
                  <th className="text-left px-5 py-3">Description</th>
                  <th className="text-right px-5 py-3">Duration</th>
                  <th className="text-right px-5 py-3">Rate</th>
                  <th className="text-right px-5 py-3">Earned</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry: TimeEntry, idx: number) => {
                  const projectName = typeof entry.projectId === 'object' ? entry.projectId.name : 'Unknown';
                  const earnings = (entry.duration / 60) * entry.hourlyRate;
                  return (
                    <tr key={entry._id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                      <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(entry.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">{projectName}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-300 max-w-xs truncate">{entry.description || <span className="text-slate-500 italic">No description</span>}</td>
                      <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-200">
                        <span className="flex items-center justify-end gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {formatDuration(entry.duration)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-slate-400">${entry.hourlyRate}/hr</td>
                      <td className="px-5 py-3.5 text-right text-sm font-bold text-emerald-400">
                        <span className="flex items-center justify-end gap-0.5">
                          <DollarSign className="w-3.5 h-3.5" />{earnings.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => { if (confirm('Delete this time entry?')) deleteMutation.mutate(entry._id); }}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 z-10"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 pb-1">Add Manual Entry</h3>
              <p className="text-slate-400 text-sm pb-6">Log time you already worked without using the live timer.</p>

              <form onSubmit={handleSubmit(onManualSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Project *</label>
                  <select {...register('projectId', { required: 'Project is required' })}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500">
                    <option value="">Select a project...</option>
                    {projectsData?.projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  {errors.projectId && <p className="text-xs text-rose-400">{errors.projectId.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Description (optional)</label>
                  <input type="text" {...register('description')} placeholder="What did you work on?"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold">Date *</label>
                    <input type="date" {...register('date', { required: true })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold">Hours</label>
                    <input type="number" min="0" {...register('hours', { valueAsNumber: true })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold">Minutes</label>
                    <input type="number" min="0" max="59" {...register('minutes', { valueAsNumber: true })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Hourly Rate (override, optional)</label>
                  <input type="number" min="0" {...register('hourlyRate', { valueAsNumber: true })} placeholder="Uses project rate if 0"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-sm font-semibold cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" disabled={createMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm disabled:opacity-50 cursor-pointer">
                    {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Log Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
