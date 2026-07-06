import api from '../api';

export interface ClientProfile {
  _id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListResponse {
  success: boolean;
  clients: ClientProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ClientResponse {
  success: boolean;
  client: ClientProfile;
}

export interface CreateClientInput {
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export const getClients = async (search = '', page = 1, limit = 10): Promise<ClientListResponse> => {
  const response = await api.get('/clients', {
    params: { search, page, limit },
  });
  return response.data;
};

export const getClientById = async (id: string): Promise<ClientResponse> => {
  const response = await api.get(`/clients/${id}`);
  return response.data;
};

export const createClient = async (data: CreateClientInput): Promise<ClientResponse> => {
  const response = await api.post('/clients', data);
  return response.data;
};

export const updateClient = async (id: string, data: Partial<CreateClientInput>): Promise<ClientResponse> => {
  const response = await api.put(`/clients/${id}`, data);
  return response.data;
};

export const deleteClient = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/clients/${id}`);
  return response.data;
};
