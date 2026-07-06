import api from '../api';

export interface ProjectDetail {
  _id: string;
  clientId: {
    _id: string;
    name: string;
    company: string;
  } | string;
  name: string;
  description?: string;
  budget: number;
  hourlyRate?: number;
  deadline: string;
  status: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';
  progress: number;
  deliverables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResponse {
  success: boolean;
  projects: ProjectDetail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProjectResponse {
  success: boolean;
  project: ProjectDetail;
}

export interface CreateProjectInput {
  clientId: string;
  name: string;
  description?: string;
  budget: number;
  hourlyRate?: number;
  deadline: string;
  status?: string;
  progress?: number;
  deliverables?: string[];
}

export const getProjects = async (
  status = '',
  clientId = '',
  page = 1,
  limit = 10
): Promise<ProjectListResponse> => {
  const response = await api.get('/projects', {
    params: { status, clientId, page, limit },
  });
  return response.data;
};

export const getProjectById = async (id: string): Promise<ProjectResponse> => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

export const createProject = async (data: CreateProjectInput): Promise<ProjectResponse> => {
  const response = await api.post('/projects', data);
  return response.data;
};

export const updateProject = async (id: string, data: Partial<CreateProjectInput>): Promise<ProjectResponse> => {
  const response = await api.put(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};
