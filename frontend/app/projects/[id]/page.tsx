"use client"

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectById, updateProject, CreateProjectInput } from '@/lib/api/projects';
import { ArrowLeft, Calendar, DollarSign, Clock, Layers, Plus, Trash2, CheckCircle2, Circle, Loader2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;
  
  const [newDeliverable, setNewDeliverable] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch project details
  const { data: projectData, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
  });

  // Update Project Mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateProjectInput>) => updateProject(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      showNotification('Project updated successfully!', 'success');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = error.response?.data?.error?.message || 'Failed to update project.';
      showNotification(msg, 'error');
    }
  });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const project = projectData?.project;
  const clientName = typeof project?.clientId === 'object' ? project.clientId.name : 'Client Contact';
  const clientCompany = typeof project?.clientId === 'object' ? project.clientId.company : 'Client Company';

  // Toggle Deliverable status
  const handleToggleDeliverable = (indexToToggle: number, isChecked: boolean) => {
    if (!project) return;
    
    // We can denote checked deliverables by appending "[DONE] " prefix to the text,
    // or keep a separate array, or format them. Let's use "[DONE] " prefix as a lightweight
    // flag, or simply keep track of checked state. 
    // Let's model checked state by prefixing the deliverable string with "[DONE] "!
    // This allows us to store the complete state in the Mongoose array "deliverables" without schemas change.
    const updatedDeliverables = project.deliverables.map((item, idx) => {
      if (idx !== indexToToggle) return item;
      if (isChecked) {
        return item.startsWith('[DONE] ') ? item : `[DONE] ${item}`;
      } else {
        return item.startsWith('[DONE] ') ? item.replace('[DONE] ', '') : item;
      }
    });

    // Calculate new progress based on checked ratio
    const doneCount = updatedDeliverables.filter(item => item.startsWith('[DONE] ')).length;
    const totalCount = updatedDeliverables.length;
    const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    updateMutation.mutate({
      deliverables: updatedDeliverables,
      progress,
      status: progress === 100 ? 'Completed' : project.status,
    });
  };

  // Add Deliverable
  const handleAddDeliverable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !newDeliverable.trim()) return;

    const updatedDeliverables = [...project.deliverables, newDeliverable.trim()];
    
    // Recalculate progress
    const doneCount = updatedDeliverables.filter(item => item.startsWith('[DONE] ')).length;
    const totalCount = updatedDeliverables.length;
    const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    updateMutation.mutate({
      deliverables: updatedDeliverables,
      progress,
    });
    setNewDeliverable('');
  };

  // Delete Deliverable
  const handleDeleteDeliverable = (indexToDelete: number) => {
    if (!project) return;

    const updatedDeliverables = project.deliverables.filter((_, idx) => idx !== indexToDelete);
    
    // Recalculate progress
    const doneCount = updatedDeliverables.filter(item => item.startsWith('[DONE] ')).length;
    const totalCount = updatedDeliverables.length;
    const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    updateMutation.mutate({
      deliverables: updatedDeliverables,
      progress,
    });
  };

  // Update project status
  const handleStatusChange = (status: string) => {
    if (!project) return;
    updateMutation.mutate({ status });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 space-y-4">
        <div className="w-10 h-10 border-4 border-t-indigo-500 border-white/5 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-6 rounded-2xl">
          <p className="font-semibold">Project not found or access denied.</p>
        </div>
        <button 
          onClick={() => router.push('/projects')}
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100 min-h-screen">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg backdrop-blur-md border flex items-center gap-3 ${
              notification.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            <span className="text-sm font-semibold">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Back button */}
      <div>
        <Link href="/projects">
          <span className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects List
          </span>
        </Link>
      </div>

      {/* Project Banner Info */}
      <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-md shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/15">
            {clientCompany} • {clientName}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-3">{project.name}</h1>
          {project.description && (
            <p className="text-slate-400 mt-2 text-sm max-w-2xl">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Project Status:</span>
          <select
            value={project.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Financials and Progress Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Budget Card */}
        <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-lg backdrop-blur-md">
          <div className="p-3 bg-emerald-500/15 rounded-xl text-emerald-400 border border-emerald-500/10">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold">Total Budget</span>
            <span className="text-xl font-bold text-slate-200 mt-0.5 block">
              ${project.budget.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Hourly Rate Card */}
        <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-lg backdrop-blur-md">
          <div className="p-3 bg-indigo-500/15 rounded-xl text-indigo-400 border border-indigo-500/10">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold">Hourly Billing</span>
            <span className="text-xl font-bold text-slate-200 mt-0.5 block">
              {project.hourlyRate ? `$${project.hourlyRate}/hr` : 'Fixed Budget'}
            </span>
          </div>
        </div>

        {/* Target Deadline Card */}
        <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-lg backdrop-blur-md">
          <div className="p-3 bg-purple-500/15 rounded-xl text-purple-400 border border-purple-500/10">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-semibold">Target Deadline</span>
            <span className="text-xl font-bold text-slate-200 mt-0.5 block">
              {new Date(project.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-slate-900/40 border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-lg backdrop-blur-md">
          <div className="p-3 bg-pink-500/15 rounded-xl text-pink-400 border border-pink-500/10">
            <Layers className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <span className="text-xs text-slate-400 block font-semibold">Project Progress</span>
            <span className="text-xl font-bold text-slate-200 mt-0.5 block">{project.progress}%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar (Visual representation) */}
      <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
        <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500" 
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Interactive Milestones Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Deliverables checklist - takes 2 cols */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-bold">Scope & Deliverables Checklist</h3>
              <p className="text-xs text-slate-400 mt-1">
                Checking deliverables automatically updates the project progress bar.
              </p>
            </div>
            {updateMutation.isPending && (
              <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </span>
            )}
          </div>

          {/* Add deliverable form */}
          <form onSubmit={handleAddDeliverable} className="flex gap-3">
            <input
              type="text"
              placeholder="Add new milestone or scope deliverable..."
              value={newDeliverable}
              onChange={(e) => setNewDeliverable(e.target.value)}
              className="flex-1 bg-slate-950/60 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={updateMutation.isPending || !newDeliverable.trim()}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {/* Checklist Items */}
          {project.deliverables.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl space-y-3">
              <AlertCircle className="w-8 h-8 text-slate-500 mx-auto opacity-75 animate-bounce" />
              <h4 className="font-bold text-slate-300 text-sm">No deliverables added yet</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Add milestones like &quot;Design UI Mockup&quot; or &quot;Deploy Production Server&quot; above to build your scope.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {project.deliverables.map((item, idx) => {
                const isCompleted = item.startsWith('[DONE] ');
                const displayText = isCompleted ? item.replace('[DONE] ', '') : item;

                return (
                  <motion.div
                    key={idx}
                    layout
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isCompleted 
                        ? 'bg-emerald-500/5 border-emerald-500/10 text-slate-400 line-through' 
                        : 'bg-slate-950/30 border-white/5 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 cursor-pointer select-none" onClick={() => handleToggleDeliverable(idx, !isCompleted)}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 hover:text-indigo-400 flex-shrink-0 transition-colors" />
                      )}
                      <span className="text-sm font-medium">{displayText}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteDeliverable(idx)}
                      disabled={updateMutation.isPending}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Info/Guide Card */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md shadow-xl h-fit space-y-6">
          <h4 className="font-bold text-slate-200">Contract Helper</h4>
          <div className="space-y-4 text-xs text-slate-400 leading-relaxed font-medium">
            <p>
              Use this dashboard to coordinate with clients and track delivery velocity.
            </p>
            <ul className="list-disc pl-4 space-y-2">
              <li>
                Clicking checkmarks updates the progress bar instantly in the cloud.
              </li>
              <li>
                If progress reaches 100%, the project status updates automatically to <strong>Completed</strong>.
              </li>
              <li>
                You can add new deliverables dynamically as scope adjustments occur.
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
