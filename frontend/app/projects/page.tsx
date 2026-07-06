"use client"

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, createProject, updateProject, deleteProject, ProjectDetail } from '@/lib/api/projects';
import { getClients } from '@/lib/api/clients';
import { Plus, Calendar, DollarSign, Edit2, Trash2, ArrowRight, X, Loader2, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const projectFormSchema = z.object({
  clientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Please select a valid client'),
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  budget: z.number().min(1, 'Budget must be at least 1'),
  hourlyRate: z.number().min(0).optional(),
  deadline: z.string().min(1, 'Please select a deadline'),
  status: z.enum(['Not Started', 'In Progress', 'On Hold', 'Completed']).optional(),
  progress: z.number().min(0).max(100).optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectDetail | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      clientId: '',
      name: '',
      description: '',
      budget: 0,
      hourlyRate: 0,
      deadline: '',
      status: 'Not Started',
      progress: 0,
    }
  });

  // Query projects
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', statusFilter, page],
    queryFn: () => getProjects(statusFilter, '', page, 8),
  });

  // Query clients for selection
  const { data: clientsData } = useQuery({
    queryKey: ['clients-selection'],
    queryFn: () => getClients('', 1, 100),
  });

  // Add Mutation
  const addMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showNotification('Project created successfully!', 'success');
      closeModal();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = error.response?.data?.error?.message || 'Failed to create project.';
      showNotification(msg, 'error');
    }
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectFormValues> }) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showNotification('Project updated successfully!', 'success');
      closeModal();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = error.response?.data?.error?.message || 'Failed to update project.';
      showNotification(msg, 'error');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showNotification('Project deleted successfully!', 'success');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = error.response?.data?.error?.message || 'Failed to delete project.';
      showNotification(msg, 'error');
    }
  });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const openModal = (project?: ProjectDetail) => {
    if (project) {
      setEditingProject(project);
      const targetClientId = typeof project.clientId === 'object' ? project.clientId._id : project.clientId;
      setValue('clientId', targetClientId);
      setValue('name', project.name);
      setValue('description', project.description || '');
      setValue('budget', project.budget);
      setValue('hourlyRate', project.hourlyRate || 0);
      setValue('status', project.status);
      setValue('progress', project.progress);
      
      // format date to YYYY-MM-DD
      const dateVal = new Date(project.deadline).toISOString().split('T')[0];
      setValue('deadline', dateVal);
    } else {
      setEditingProject(null);
      reset({
        clientId: '',
        name: '',
        description: '',
        budget: 0,
        hourlyRate: 0,
        deadline: '',
        status: 'Not Started',
        progress: 0,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    reset();
  };

  const onSubmit = (values: ProjectFormValues) => {
    if (editingProject) {
      editMutation.mutate({ id: editingProject._id, data: values });
    } else {
      addMutation.mutate(values);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this project? This will permanently remove all data.')) {
      deleteMutation.mutate(id);
    }
  };

  const statuses = [
    { label: 'All Projects', value: '' },
    { label: 'Not Started', value: 'Not Started' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'On Hold', value: 'On Hold' },
    { label: 'Completed', value: 'Completed' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-slate-100">
      
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Projects & Contracts
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Track active scopes, deliverable milestones, budgets, and timelines.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </motion.button>
      </div>

      {/* Filter / Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/40 backdrop-blur-md p-2.5 rounded-2xl border border-white/5 shadow-xl">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => {
              setStatusFilter(status.value);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              statusFilter === status.value
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Grid of projects */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 rounded-2xl border border-white/5 bg-slate-900/20 animate-pulse flex flex-col justify-between p-6">
              <div className="space-y-4">
                <div className="h-6 w-3/4 bg-white/10 rounded-lg"></div>
                <div className="h-4 w-1/2 bg-white/10 rounded-lg"></div>
              </div>
              <div className="space-y-2 mt-8">
                <div className="h-2 w-full bg-white/10 rounded-lg"></div>
                <div className="h-4 w-1/3 bg-white/10 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 rounded-2xl border border-rose-500/10 bg-rose-500/5 text-rose-300">
          <p>Failed to load projects. Please check your network connection.</p>
        </div>
      ) : data?.projects.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-sm space-y-4">
          <Briefcase className="w-16 h-16 text-indigo-400 mx-auto opacity-75 animate-pulse" />
          <h3 className="text-xl font-bold">No projects found</h3>
          <p className="text-slate-400 max-w-sm mx-auto text-sm">
            {statusFilter ? "No projects match the selected status filter." : "You haven't created any projects yet. Click Add Project to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.projects.map((project) => {
              const clientCompany = typeof project.clientId === 'object' ? project.clientId.company : 'Unknown Company';
              
              return (
                <motion.div
                  key={project._id}
                  layout
                  whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}
                  className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 transition-all duration-300 shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="space-y-4 z-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/15">
                          {clientCompany}
                        </span>
                        <h2 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors mt-2">
                          {project.name}
                        </h2>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => openModal(project)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(project._id)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-2">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" 
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Details Row */}
                    <div className="grid grid-cols-2 gap-3 pt-3 text-xs font-semibold text-slate-400 border-t border-white/5">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 block uppercase">Budget</span>
                        <span className="text-emerald-400 text-sm font-bold flex items-center">
                          <DollarSign className="w-3.5 h-3.5" />
                          {project.budget.toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 block uppercase">Deadline</span>
                        <span className="text-slate-300 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          {new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 z-10 flex items-center justify-between gap-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                      project.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' :
                      project.status === 'On Hold' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' :
                      'bg-slate-500/10 text-slate-300 border border-white/10'
                    }`}>
                      {project.status}
                    </span>
                    <Link href={`/projects/${project._id}`}>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
                        <span>Milestones</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {data && data.pagination.pages > 1 && (
            <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-white/5">
              <span className="text-xs text-slate-400">
                Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
                  disabled={page === data.pagination.pages}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Project Modal overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden z-10"
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 pb-2">
                {editingProject ? 'Edit Project Scope' : 'Add New Project'}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm pb-6">
                Define your contract budget, link a client, and set key deadlines.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Link Client Profile *</label>
                  <select
                    {...register('clientId')}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a client...</option>
                    {clientsData?.clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name} ({client.company})
                      </option>
                    ))}
                  </select>
                  {errors.clientId && <p className="text-xs text-rose-400 mt-1">{errors.clientId.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Project Name *</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="e.g. Website Redesign"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold">Total Budget ($) *</label>
                    <input
                      type="number"
                      {...register('budget', { valueAsNumber: true })}
                      placeholder="5000"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    {errors.budget && <p className="text-xs text-rose-400 mt-1">{errors.budget.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold">Hourly Rate (Optional)</label>
                    <input
                      type="number"
                      {...register('hourlyRate', { valueAsNumber: true })}
                      placeholder="75"
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold">Target Deadline *</label>
                    <input
                      type="date"
                      {...register('deadline')}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    {errors.deadline && <p className="text-xs text-rose-400 mt-1">{errors.deadline.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold">Initial Status</label>
                    <select
                      {...register('status')}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                {editingProject && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
                      <label>Progress Tracker ({editingProject.progress}%)</label>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      {...register('progress', { valueAsNumber: true })}
                      className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Scope Description (Optional)</label>
                  <textarea
                    rows={3}
                    {...register('description')}
                    placeholder="Describe major deliverables..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addMutation.isPending || editMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm shadow-[0_0_15px_rgba(99,102,241,0.2)] disabled:opacity-50 cursor-pointer"
                  >
                    {(addMutation.isPending || editMutation.isPending) && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    <span>{editingProject ? 'Save Changes' : 'Create Project'}</span>
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
