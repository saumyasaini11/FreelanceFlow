"use client"

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, createClient, updateClient, deleteClient, ClientProfile } from '@/lib/api/clients';
import { Plus, Search, Mail, Phone, Building2, MapPin, Edit2, Trash2, ArrowRight, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const clientFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  company: z.string().min(2, 'Company must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form setup
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    }
  });

  // Query list
  const { data, isLoading, error } = useQuery({
    queryKey: ['clients', search, page],
    queryFn: () => getClients(search, page, 8),
  });

  // Add Mutation
  const addMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showNotification('Client added successfully!', 'success');
      closeModal();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = error.response?.data?.error?.message || 'Failed to add client.';
      showNotification(msg, 'error');
    }
  });

  // Edit Mutation
  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClientProfile> }) => updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showNotification('Client updated successfully!', 'success');
      closeModal();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = error.response?.data?.error?.message || 'Failed to update client.';
      showNotification(msg, 'error');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showNotification('Client deleted successfully!', 'success');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = error.response?.data?.error?.message || 'Failed to delete client.';
      showNotification(msg, 'error');
    }
  });

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const openModal = (client?: ClientProfile) => {
    if (client) {
      setEditingClient(client);
      setValue('name', client.name);
      setValue('company', client.company);
      setValue('email', client.email);
      setValue('phone', client.phone || '');
      setValue('address', client.address || '');
      setValue('notes', client.notes || '');
    } else {
      setEditingClient(null);
      reset({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    reset();
  };

  const onSubmit = (values: ClientFormValues) => {
    if (editingClient) {
      editMutation.mutate({ id: editingClient._id, data: values });
    } else {
      addMutation.mutate(values);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this client? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

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
            Clients Workspace
          </h1>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            Build, nurture, and track client relations, and link new contracts.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </motion.button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-4 bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search clients by name, email, or company..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Grid of clients */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl border border-white/5 bg-slate-900/20 animate-pulse flex flex-col justify-between p-6">
              <div className="space-y-4">
                <div className="h-6 w-3/4 bg-white/10 rounded-lg"></div>
                <div className="h-4 w-1/2 bg-white/10 rounded-lg"></div>
              </div>
              <div className="h-10 w-full bg-white/10 rounded-lg mt-8"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 rounded-2xl border border-rose-500/10 bg-rose-500/5 text-rose-300">
          <p>Failed to load clients. Please check your network connection.</p>
        </div>
      ) : data?.clients.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-sm space-y-4">
          <Building2 className="w-16 h-16 text-indigo-400 mx-auto opacity-75" />
          <h3 className="text-xl font-bold">No clients found</h3>
          <p className="text-slate-400 max-w-sm mx-auto text-sm">
            {search ? "No clients match your filter criteria. Try adjusting your query." : "You haven't added any clients yet. Click Add Client to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.clients.map((client) => (
              <motion.div
                key={client._id}
                layout
                whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-white/10 transition-all duration-300 shadow-lg"
              >
                {/* Background overlay glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="space-y-4 z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                        {client.name}
                      </h2>
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold mt-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{client.company}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => openModal(client)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(client._id)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 text-xs text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span className="truncate">{client.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 z-10">
                  <Link href={`/clients/${client._id}`}>
                    <span className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-white/5 hover:bg-indigo-500 text-slate-200 hover:text-white font-semibold text-xs transition-all cursor-pointer">
                      <span>View Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>
              </motion.div>
            ))}
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

      {/* Add / Edit Client Modal overlay */}
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
                {editingClient ? 'Edit Client Profile' : 'Add New Client'}
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm pb-6">
                Fill out the form below to create or update this client profile.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold">Contact Name *</label>
                    <input
                      type="text"
                      {...register('name')}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold">Company / Org *</label>
                    <input
                      type="text"
                      {...register('company')}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    {errors.company && <p className="text-xs text-rose-400 mt-1">{errors.company.message}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Email Address *</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Phone Number (Optional)</label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Billing Address (Optional)</label>
                  <input
                    type="text"
                    {...register('address')}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Internal Notes (Optional)</label>
                  <textarea
                    rows={3}
                    {...register('notes')}
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
                    <span>{editingClient ? 'Save Changes' : 'Create Client'}</span>
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
