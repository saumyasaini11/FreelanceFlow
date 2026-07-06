import api from '../api';

export interface KPIs {
  totalRevenue: number;
  outstanding: number;
  totalHours: number;
  avgRate: number;
  activeClients: number;
  activeProjects: number;
}

export interface ChartMonth {
  month: string;
  revenue: number;
  hours: number;
}

export interface BreakdownItem {
  name: string;
  value: number;
  color: string;
}

export interface TopClient {
  _id: string;
  name: string;
  company: string;
  totalBilled: number;
  invoiceCount: number;
}

export interface ActivityItem {
  type: 'invoice' | 'time';
  id: string;
  label: string;
  sub: string;
  amount: number;
  status: string;
  date: string;
}

export interface AnalyticsOverview {
  kpis: KPIs;
  chartData: ChartMonth[];
  projectBreakdown: BreakdownItem[];
  invoiceBreakdown: BreakdownItem[];
  topClients: TopClient[];
  activityFeed: ActivityItem[];
}

export const getAnalyticsOverview = async (): Promise<{ success: boolean; overview: AnalyticsOverview }> => {
  const response = await api.get('/analytics/overview');
  return response.data;
};
