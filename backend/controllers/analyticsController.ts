import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Client } from '../models/Client';
import { Project, ProjectStatus } from '../models/Project';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { TimeEntry } from '../models/TimeEntry';

// GET /api/analytics/overview
export const getAnalyticsOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const uid = new mongoose.Types.ObjectId(userId as unknown as string);

    // Date helpers
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // ─── Run all queries in parallel ─────────────────────────────────────────
    const [
      clientCount,
      projectStatusCounts,
      invoiceStatusCounts,
      revenueByMonth,
      hoursByMonth,
      topClients,
      recentInvoices,
      recentTimeEntries,
      kpiData,
    ] = await Promise.all([
      // Active client count
      Client.countDocuments({ userId: uid }),

      // Project counts by status
      Project.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Invoice counts by status
      Invoice.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      // Revenue (total) by month – last 6 months
      Invoice.aggregate([
        {
          $match: {
            userId: uid,
            status: { $in: [InvoiceStatus.PAID, InvoiceStatus.SENT] },
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: '$total' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Hours by month – last 6 months
      TimeEntry.aggregate([
        {
          $match: {
            userId: uid,
            startTime: { $gte: sixMonthsAgo },
            endTime: { $ne: null },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$startTime' },
              month: { $month: '$startTime' },
            },
            minutes: { $sum: '$duration' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // Top 3 clients by invoiced value
      Invoice.aggregate([
        {
          $match: {
            userId: uid,
            status: { $in: [InvoiceStatus.PAID, InvoiceStatus.SENT] },
          },
        },
        { $group: { _id: '$clientId', totalBilled: { $sum: '$total' }, invoiceCount: { $sum: 1 } } },
        { $sort: { totalBilled: -1 } },
        { $limit: 3 },
        {
          $lookup: {
            from: 'clients',
            localField: '_id',
            foreignField: '_id',
            as: 'client',
          },
        },
        { $unwind: '$client' },
        { $project: { name: '$client.name', company: '$client.company', totalBilled: 1, invoiceCount: 1 } },
      ]),

      // Recent 5 invoices
      Invoice.find({ userId: uid })
        .populate('clientId', 'name company')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('invoiceNumber total status createdAt clientId'),

      // Recent 5 time entries
      TimeEntry.find({ userId: uid })
        .populate('projectId', 'name')
        .sort({ startTime: -1 })
        .limit(5)
        .select('description duration startTime projectId'),

      // KPI aggregates
      Promise.all([
        Invoice.aggregate([
          { $match: { userId: uid, status: InvoiceStatus.PAID } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Invoice.aggregate([
          { $match: { userId: uid, status: { $in: [InvoiceStatus.SENT, InvoiceStatus.OVERDUE] } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        TimeEntry.aggregate([
          { $match: { userId: uid } },
          { $group: { _id: null, totalMinutes: { $sum: '$duration' }, avgRate: { $avg: '$hourlyRate' } } },
        ]),
      ]),
    ]);

    // ─── Shape month-by-month chart data ─────────────────────────────────────
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartMonths: { month: string; revenue: number; hours: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const rev = revenueByMonth.find((r: { _id: { year: number; month: number }; revenue: number }) => r._id.year === y && r._id.month === m);
      const hrs = hoursByMonth.find((h: { _id: { year: number; month: number }; minutes: number }) => h._id.year === y && h._id.month === m);
      chartMonths.push({
        month: monthNames[m - 1],
        revenue: rev ? Math.round(rev.revenue * 100) / 100 : 0,
        hours: hrs ? Math.round((hrs.minutes / 60) * 10) / 10 : 0,
      });
    }

    // ─── Project status map ───────────────────────────────────────────────────
    const projectMap: Record<string, number> = {};
    (projectStatusCounts as { _id: string; count: number }[]).forEach(p => { projectMap[p._id] = p.count; });

    // ─── Invoice status map ───────────────────────────────────────────────────
    const invoiceMap: Record<string, number> = {};
    (invoiceStatusCounts as { _id: string; count: number }[]).forEach(i => { invoiceMap[i._id] = i.count; });

    // ─── KPIs ─────────────────────────────────────────────────────────────────
    const [revenueAgg, outstandingAgg, hoursAgg] = kpiData as [
      { _id: null; total: number }[],
      { _id: null; total: number }[],
      { _id: null; totalMinutes: number; avgRate: number }[],
    ];

    const totalRevenue = revenueAgg[0]?.total ?? 0;
    const outstanding = outstandingAgg[0]?.total ?? 0;
    const totalHours = Math.round(((hoursAgg[0]?.totalMinutes ?? 0) / 60) * 10) / 10;
    const avgRate = Math.round((hoursAgg[0]?.avgRate ?? 0) * 100) / 100;

    // ─── Recent activity feed ─────────────────────────────────────────────────
    const activityFeed = [
      ...recentInvoices.map(inv => ({
        type: 'invoice' as const,
        id: String(inv._id),
        label: `Invoice ${inv.invoiceNumber}`,
        sub: (inv.clientId as unknown as { name: string; company: string })?.company || (inv.clientId as unknown as { name: string })?.name || '',
        amount: inv.total,
        status: inv.status,
        date: inv.createdAt,
      })),
      ...recentTimeEntries.map(te => ({
        type: 'time' as const,
        id: String(te._id),
        label: te.description || 'Time entry',
        sub: (te.projectId as unknown as { name: string })?.name || '',
        amount: Math.round((te.duration / 60) * 100) / 100,
        status: 'Logged',
        date: te.startTime,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    res.status(200).json({
      success: true,
      overview: {
        kpis: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          outstanding: Math.round(outstanding * 100) / 100,
          totalHours,
          avgRate,
          activeClients: clientCount,
          activeProjects: projectMap[ProjectStatus.IN_PROGRESS] ?? 0,
        },
        chartData: chartMonths,
        projectBreakdown: [
          { name: 'In Progress', value: projectMap[ProjectStatus.IN_PROGRESS] ?? 0, color: '#6366f1' },
          { name: 'Completed', value: projectMap[ProjectStatus.COMPLETED] ?? 0, color: '#10b981' },
          { name: 'Not Started', value: projectMap[ProjectStatus.NOT_STARTED] ?? 0, color: '#64748b' },
          { name: 'On Hold', value: projectMap[ProjectStatus.ON_HOLD] ?? 0, color: '#f59e0b' },
        ],
        invoiceBreakdown: [
          { name: 'Draft', value: invoiceMap[InvoiceStatus.DRAFT] ?? 0, color: '#64748b' },
          { name: 'Sent', value: invoiceMap[InvoiceStatus.SENT] ?? 0, color: '#6366f1' },
          { name: 'Paid', value: invoiceMap[InvoiceStatus.PAID] ?? 0, color: '#10b981' },
          { name: 'Overdue', value: invoiceMap[InvoiceStatus.OVERDUE] ?? 0, color: '#ef4444' },
        ],
        topClients,
        activityFeed,
      },
    });
  } catch (error) {
    next(error);
  }
};
