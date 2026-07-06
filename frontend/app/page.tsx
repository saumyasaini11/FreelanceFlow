"use client"

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnalyticsOverview, ActivityItem } from '@/lib/api/analytics';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/hooks/useAuth';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useRouter } from 'next/navigation';
import {
  DollarSign, Clock, Users, FolderKanban, ArrowUpRight,
  TrendingUp, FileText, Sparkles, Activity, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Animated counter ────────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, gradient, delay = 0 }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; gradient: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-extrabold text-slate-100 mt-2 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tooltip styles ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-xs">
        <p className="font-bold text-slate-200 mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.name === 'Revenue' ? `$${p.value.toLocaleString()}` : `${p.value}h`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 shadow-2xl text-xs">
        <p className="font-semibold text-slate-200">{payload[0].name}: <span className="text-white font-bold">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: getAnalyticsOverview,
    staleTime: 60000,
  });

  const overview = data?.overview;
  const kpis = overview?.kpis;

  const quickActions = [
    { label: 'Add Client', icon: Users, href: '/clients', color: 'from-indigo-500 to-purple-500' },
    { label: 'New Project', icon: FolderKanban, href: '/projects', color: 'from-purple-500 to-pink-500' },
    { label: 'Log Hours', icon: Clock, href: '/time-tracking', color: 'from-pink-500 to-rose-500' },
    { label: 'New Invoice', icon: FileText, href: '/invoices', color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <ProtectedRoute>
      <div className="space-y-8 max-w-7xl mx-auto">

        {/* Welcome Banner */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 p-7 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.15),_transparent_60%)]" />
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">AI-Powered Dashboard</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-100">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  {user?.name?.split(' ')[0] || 'Freelancer'}
                </span> 👋
              </h2>
              <p className="text-slate-400 mt-1 text-sm">Here&apos;s your business at a glance.</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/ai-assistant')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" /> AI Assistant
            </motion.button>
          </div>
        </motion.div>

        {/* KPI Row */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            <KPICard label="Total Revenue" value={`$${(kpis?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} sub={`$${(kpis?.outstanding ?? 0).toLocaleString()} outstanding`} icon={DollarSign} gradient="from-indigo-500 to-purple-500" delay={0} />
            <KPICard label="Total Hours" value={`${kpis?.totalHours ?? 0}h`} sub={`$${kpis?.avgRate ?? 0}/hr avg rate`} icon={Clock} gradient="from-purple-500 to-pink-500" delay={0.05} />
            <KPICard label="Active Clients" value={String(kpis?.activeClients ?? 0)} icon={Users} gradient="from-pink-500 to-rose-500" delay={0.1} />
            <KPICard label="Active Projects" value={String(kpis?.activeProjects ?? 0)} icon={FolderKanban} gradient="from-emerald-500 to-teal-500" delay={0.15} />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Revenue vs Hours — 2/3 width */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-200">Revenue vs Hours — Last 6 Months</h3>
            </div>
            {isLoading ? (
              <div className="h-64 animate-pulse bg-white/5 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={overview?.chartData ?? []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="rev" orientation="left" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <YAxis yAxisId="hrs" orientation="right" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                  <Bar yAxisId="rev" dataKey="revenue" name="Revenue" fill="#6366f1" fillOpacity={0.8} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="hrs" type="monotone" dataKey="hours" name="Hours" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Project Status Donut — 1/3 width */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-slate-200">Project Status</h3>
            </div>
            {isLoading ? (
              <div className="h-64 animate-pulse bg-white/5 rounded-xl" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={overview?.projectBreakdown ?? []} cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {(overview?.projectBreakdown ?? []).map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {(overview?.projectBreakdown ?? []).map(item => (
                    <div key={item.name} className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-400">{item.name}</span>
                      </span>
                      <span className="font-bold text-slate-200">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Top Clients */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-400" />
                <h3 className="text-base font-bold text-slate-200">Top Clients</h3>
              </div>
              <button onClick={() => router.push('/clients')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer">
                View all <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            {isLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 animate-pulse bg-white/5 rounded-xl" />)}</div>
            ) : (overview?.topClients ?? []).length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No invoiced clients yet.</p>
            ) : (
              <div className="space-y-4">
                {(overview?.topClients ?? []).map((client, idx) => {
                  const maxBilled = (overview?.topClients[0]?.totalBilled ?? 1);
                  return (
                    <div key={client._id}>
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{client.company || client.name}</p>
                          <p className="text-xs text-slate-500">{client.invoiceCount} invoice{client.invoiceCount !== 1 ? 's' : ''}</p>
                        </div>
                        <span className="text-sm font-bold text-emerald-400">${client.totalBilled.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${(client.totalBilled / maxBilled) * 100}%` }}
                          transition={{ delay: 0.4 + idx * 0.1, duration: 0.6 }}
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Activity Feed */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-200">Recent Activity</h3>
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 animate-pulse bg-white/5 rounded-xl" />)}</div>
            ) : (overview?.activityFeed ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <AlertCircle className="w-8 h-8 text-slate-600" />
                <p className="text-sm text-slate-400">No activity yet. Start by adding clients and logging time.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(overview?.activityFeed ?? []).map((item: ActivityItem, idx: number) => (
                  <motion.div key={item.id + idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'invoice' ? 'bg-indigo-500/15' : 'bg-emerald-500/15'}`}>
                        {item.type === 'invoice'
                          ? <FileText className="w-4 h-4 text-indigo-400" />
                          : <Clock className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{item.label}</p>
                        <p className="text-xs text-slate-500 truncate">{item.sub}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold text-slate-200">
                        {item.type === 'invoice' ? `$${item.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `${item.amount}h`}
                      </p>
                      <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map(action => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push(action.href)}
                className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-br ${action.color} bg-opacity-10 border border-white/5 text-white font-semibold text-sm cursor-pointer shadow-lg hover:shadow-xl transition-shadow`}
              >
                <span>{action.label}</span>
                <action.icon className="w-4 h-4 opacity-80" />
              </motion.button>
            ))}
          </div>
        </motion.div>

      </div>
    </ProtectedRoute>
  );
}
