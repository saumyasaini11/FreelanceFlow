import api from '../api';

export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  _id: string;
  clientId: {
    _id: string;
    name: string;
    company: string;
    email: string;
    address?: string;
  } | string;
  invoiceNumber: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  dueDate: string;
  notes?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListResponse {
  success: boolean;
  invoices: Invoice[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface InvoiceResponse {
  success: boolean;
  invoice: Invoice;
}

export interface CreateInvoiceInput {
  clientId: string;
  lineItems: LineItem[];
  taxRate?: number;
  dueDate: string;
  notes?: string;
}

export const getInvoices = async (status = '', clientId = '', page = 1, limit = 20): Promise<InvoiceListResponse> => {
  const response = await api.get('/invoices', { params: { status, clientId, page, limit } });
  return response.data;
};

export const getInvoiceById = async (id: string): Promise<InvoiceResponse> => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

export const createInvoice = async (data: CreateInvoiceInput): Promise<InvoiceResponse> => {
  const response = await api.post('/invoices', data);
  return response.data;
};

export const updateInvoice = async (id: string, data: Partial<CreateInvoiceInput> & { status?: string }): Promise<InvoiceResponse> => {
  const response = await api.put(`/invoices/${id}`, data);
  return response.data;
};

export const deleteInvoice = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/invoices/${id}`);
  return response.data;
};

export const downloadInvoicePDF = (id: string): string => {
  return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/invoices/${id}/pdf`;
};
