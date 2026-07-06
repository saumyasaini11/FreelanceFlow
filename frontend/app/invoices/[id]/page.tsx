"use client"

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInvoiceById, updateInvoice, deleteInvoice } from '@/lib/api/invoices';
import { ArrowLeft, Download, CheckCircle, Send, Trash2, Loader2, X, Calendar, DollarSign, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  Sent: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  Paid: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  Overdue: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoiceById(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => updateInvoice(id, { status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showNotification(`Invoice marked as ${data.invoice.status}!`, 'success');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      showNotification(e.response?.data?.error?.message || 'Update failed.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      router.push('/invoices');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      showNotification(e.response?.data?.error?.message || 'Cannot delete this invoice.', 'error');
    },
  });

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const { default: api } = await import('@/lib/api');
      const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice?.invoiceNumber || 'invoice'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotification('PDF downloaded!', 'success');
    } catch {
      showNotification('Failed to generate PDF.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-t-indigo-500 border-white/5 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !data?.invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Invoice not found.</p>
        <button onClick={() => router.push('/invoices')} className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm">
          Back to Invoices
        </button>
      </div>
    );
  }

  const invoice = data.invoice;
  const client = typeof invoice.clientId === 'object' ? invoice.clientId : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 min-h-screen text-slate-100">

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

      {/* Navigation + Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button onClick={() => router.push('/invoices')} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </button>

        <div className="flex gap-2 flex-wrap">
          {/* Download PDF */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleDownloadPDF} disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 hover:text-white text-sm font-semibold disabled:opacity-50 cursor-pointer">
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </motion.button>

          {/* Mark as Sent */}
          {invoice.status === 'Draft' && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => updateMutation.mutate({ status: 'Sent' })} disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-sm font-semibold disabled:opacity-50 cursor-pointer">
              <Send className="w-4 h-4" /> Mark as Sent
            </motion.button>
          )}

          {/* Mark as Paid */}
          {(invoice.status === 'Sent' || invoice.status === 'Overdue') && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => updateMutation.mutate({ status: 'Paid' })} disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-sm font-semibold disabled:opacity-50 cursor-pointer">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Mark as Paid
            </motion.button>
          )}

          {/* Delete */}
          {invoice.status !== 'Paid' && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => { if (confirm(`Delete invoice ${invoice.invoiceNumber}?`)) deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-sm font-semibold disabled:opacity-50 cursor-pointer">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </motion.button>
          )}
        </div>
      </div>

      {/* Invoice Document */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/60 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Invoice Header Band */}
        <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">FreelanceFlow</h1>
            <p className="text-indigo-400 text-sm mt-1">AI-Powered Freelance Management</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-extrabold text-white tracking-widest">INVOICE</h2>
            <p className="text-indigo-400 font-mono text-sm mt-1">{invoice.invoiceNumber}</p>
            <span className={`inline-block mt-2 text-xs font-bold px-3 py-1 rounded-lg ${STATUS_STYLES[invoice.status]}`}>{invoice.status}</span>
          </div>
        </div>

        {/* Bill To / Dates */}
        <div className="px-8 py-6 grid grid-cols-2 gap-8 border-b border-white/5">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bill To</p>
            <p className="text-lg font-bold text-slate-100">{client?.company || client?.name || '—'}</p>
            {client?.company && <p className="text-sm text-slate-300">{client.name}</p>}
            <p className="text-sm text-slate-400">{client?.email}</p>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Issue Date', value: new Date(invoice.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), icon: <Calendar className="w-3.5 h-3.5" /> },
              { label: 'Due Date', value: new Date(invoice.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), icon: <Calendar className="w-3.5 h-3.5" /> },
              ...(invoice.paidAt ? [{ label: 'Paid On', value: new Date(invoice.paidAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> }] : []),
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="text-slate-500">{icon}</div>
                <span className="text-xs text-slate-500 w-24">{label}</span>
                <span className="text-sm font-semibold text-slate-200">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="px-8 py-6">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-white/10 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="text-left pb-3">Description</th>
                <th className="text-right pb-3">Qty</th>
                <th className="text-right pb-3">Rate</th>
                <th className="text-right pb-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {invoice.lineItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pr-4 text-sm text-slate-200">{item.description}</td>
                  <td className="py-3.5 text-right text-sm text-slate-300">{item.quantity}</td>
                  <td className="py-3.5 text-right text-sm text-slate-300">${item.rate.toFixed(2)}</td>
                  <td className="py-3.5 text-right text-sm font-semibold text-slate-100">${item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-8 pb-8">
          <div className="ml-auto max-w-xs space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Subtotal</span>
              <span className="font-semibold text-slate-200">${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Tax ({invoice.taxRate}%)</span>
              <span className="font-semibold text-slate-200">${invoice.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Total Due
              </span>
              <span className="text-3xl font-extrabold text-emerald-400">${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="px-8 pb-8 border-t border-white/5 pt-5">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</p>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-950/40 px-8 py-4 border-t border-white/5 text-center">
          <p className="text-xs text-slate-600">Generated by FreelanceFlow · freelanceflow.app</p>
        </div>
      </motion.div>
    </div>
  );
}
