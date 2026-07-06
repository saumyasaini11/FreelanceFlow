"use client"

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoices, createInvoice, deleteInvoice, Invoice, LineItem } from '@/lib/api/invoices';
import { getClients } from '@/lib/api/clients';
import { Plus, X, Loader2, FileText, ChevronRight, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  Sent: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  Paid: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  Overdue: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
};

const ALL_STATUSES = ['All', 'Draft', 'Sent', 'Paid', 'Overdue'];

interface InvoiceFormState {
  clientId: string;
  taxRate: number;
  dueDate: string;
  notes: string;
  lineItems: LineItem[];
}

const emptyForm = (): InvoiceFormState => ({
  clientId: '',
  taxRate: 0,
  dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  notes: '',
  lineItems: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
});

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeStatus, setActiveStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<InvoiceFormState>(emptyForm());
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [page, setPage] = useState(1);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', activeStatus, page],
    queryFn: () => getInvoices(activeStatus === 'All' ? '' : activeStatus, '', page, 12),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-selection'],
    queryFn: () => getClients('', 1, 100),
  });

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showNotification('Invoice created!', 'success');
      setIsModalOpen(false);
      setForm(emptyForm());
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      showNotification(e.response?.data?.error?.message || 'Failed to create invoice.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showNotification('Invoice deleted.', 'success');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      showNotification(e.response?.data?.error?.message || 'Cannot delete this invoice.', 'error');
    },
  });

  // Line item helpers
  const updateLineItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setForm(f => {
      const items = [...f.lineItems];
      const item = { ...items[idx], [field]: value };
      if (field === 'quantity' || field === 'rate') {
        item.amount = Math.round((Number(item.quantity) * Number(item.rate)) * 100) / 100;
      }
      items[idx] = item;
      return { ...f, lineItems: items };
    });
  };

  const addLineItem = () => setForm(f => ({ ...f, lineItems: [...f.lineItems, { description: '', quantity: 1, rate: 0, amount: 0 }] }));
  const removeLineItem = (idx: number) => setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, i) => i !== idx) }));

  const subtotal = form.lineItems.reduce((sum, i) => sum + (i.amount || 0), 0);
  const taxAmount = (subtotal * (form.taxRate || 0)) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = () => {
    if (!form.clientId) { showNotification('Please select a client.', 'error'); return; }
    if (form.lineItems.some(i => !i.description)) { showNotification('All line items need a description.', 'error'); return; }
    createMutation.mutate({
      clientId: form.clientId,
      lineItems: form.lineItems,
      taxRate: form.taxRate,
      dueDate: new Date(form.dueDate).toISOString(),
      notes: form.notes,
    });
  };

  const invoices = invoicesData?.invoices || [];
  const totalPages = invoicesData?.pagination.pages || 1;

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
            Invoices
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Create and manage client invoices, download PDFs, and track payment status.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => { setForm(emptyForm()); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Invoice
        </motion.button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {ALL_STATUSES.map(status => (
          <button
            key={status}
            onClick={() => { setActiveStatus(status); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeStatus === status
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                : 'bg-slate-900/40 border border-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Invoice Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-t-indigo-500 border-white/5 rounded-full animate-spin"></div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <FileText className="w-16 h-16 text-slate-600" />
          <p className="text-xl font-bold text-slate-300">No invoices found</p>
          <p className="text-sm text-slate-500">Create your first invoice to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {invoices.map((invoice: Invoice) => {
            const client = typeof invoice.clientId === 'object' ? invoice.clientId : null;
            return (
              <motion.div
                key={invoice._id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-lg flex flex-col gap-4 cursor-pointer group"
                onClick={() => router.push(`/invoices/${invoice._id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-500 font-mono">{invoice.invoiceNumber}</p>
                    <p className="text-lg font-bold text-slate-100 mt-0.5">{client?.company || client?.name || 'Unknown Client'}</p>
                    <p className="text-xs text-slate-400">{client?.email}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${STATUS_STYLES[invoice.status]}`}>{invoice.status}</span>
                </div>

                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                  <div>
                    <p className="text-xs text-slate-500">Due</p>
                    <p className="text-sm font-semibold text-slate-300">
                      {new Date(invoice.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-2xl font-extrabold text-emerald-400">${invoice.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-slate-500">{invoice.lineItems.length} line item{invoice.lineItems.length !== 1 ? 's' : ''}</p>
                  <div className="flex items-center gap-2">
                    {invoice.status !== 'Paid' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${invoice.invoiceNumber}?`)) deleteMutation.mutate(invoice._id); }}
                        className="p-1 rounded-md hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <FileText className="w-3 h-3" />
                      </button>
                    )}
                    <span className="text-xs text-indigo-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      View details <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all cursor-pointer ${p === page ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Create Invoice Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-white/5 px-6 py-5 flex justify-between items-center z-10">
                <div>
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">New Invoice</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Fill in details below — invoice number is auto-generated.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Client + Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold">Client *</label>
                    <select value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500">
                      <option value="">Select client...</option>
                      {clientsData?.clients.map(c => <option key={c._id} value={c._id}>{c.company || c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-semibold">Due Date *</label>
                    <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>

                {/* Line Items */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-slate-400 font-semibold">Line Items *</label>
                    <button onClick={addLineItem} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer">
                      <Plus className="w-3.5 h-3.5" /> Add row
                    </button>
                  </div>

                  {/* Header row */}
                  <div className="grid grid-cols-12 gap-2 text-xs text-slate-500 font-semibold px-1">
                    <span className="col-span-5">Description</span><span className="col-span-2">Qty</span><span className="col-span-2">Rate</span><span className="col-span-2">Amount</span><span className="col-span-1" />
                  </div>

                  {form.lineItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input value={item.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} placeholder="Describe the work..."
                        className="col-span-5 bg-slate-950 border border-white/10 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                      <input type="number" min="0" value={item.quantity} onChange={e => updateLineItem(idx, 'quantity', Number(e.target.value))}
                        className="col-span-2 bg-slate-950 border border-white/10 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                      <input type="number" min="0" value={item.rate} onChange={e => updateLineItem(idx, 'rate', Number(e.target.value))}
                        className="col-span-2 bg-slate-950 border border-white/10 rounded-lg px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500" />
                      <div className="col-span-2 bg-slate-800/50 border border-white/5 rounded-lg px-3 py-2.5 text-emerald-400 text-sm font-semibold flex items-center">
                        ${item.amount.toFixed(2)}
                      </div>
                      <button onClick={() => removeLineItem(idx)} disabled={form.lineItems.length === 1}
                        className="col-span-1 flex items-center justify-center text-slate-500 hover:text-rose-400 disabled:opacity-30 transition-colors cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Totals summary */}
                <div className="bg-slate-800/40 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-slate-200 font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Tax</span>
                      <input type="number" min="0" max="100" value={form.taxRate}
                        onChange={e => setForm(f => ({ ...f, taxRate: Number(e.target.value) }))}
                        className="w-14 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500" />
                      <span className="text-slate-500 text-xs">%</span>
                    </div>
                    <span className="text-slate-200 font-semibold">${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base pt-2 border-t border-white/10">
                    <span className="font-bold text-slate-200 flex items-center gap-1"><DollarSign className="w-4 h-4 text-emerald-400" /> Total Due</span>
                    <span className="font-extrabold text-emerald-400 text-xl">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">Notes (optional)</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Payment terms, bank details, thank-you message..."
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
                </div>
              </div>

              <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md border-t border-white/5 px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-sm font-semibold cursor-pointer">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={createMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm disabled:opacity-50 cursor-pointer">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Invoice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
