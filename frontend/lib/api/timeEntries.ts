import api from '../api';

export interface TimeEntry {
  _id: string;
  projectId: {
    _id: string;
    name: string;
    clientId?: string;
  } | string;
  description: string;
  startTime: string;
  endTime?: string;
  duration: number; // minutes
  hourlyRate: number;
  isBilled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntrySummary {
  thisWeek: { hours: number; earnings: number };
  thisMonth: { hours: number; earnings: number };
  allTime: { hours: number; earnings: number };
}

export interface TimeEntryListResponse {
  success: boolean;
  timeEntries: TimeEntry[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface TimeEntryResponse {
  success: boolean;
  timeEntry: TimeEntry;
}

export interface CreateTimeEntryInput {
  projectId: string;
  description?: string;
  startTime: string;
  endTime?: string;
  hourlyRate?: number;
}

export const getTimeEntries = async (projectId = '', page = 1, limit = 20): Promise<TimeEntryListResponse> => {
  const response = await api.get('/time-entries', { params: { projectId, page, limit } });
  return response.data;
};

export const getTimeSummary = async (): Promise<{ success: boolean; summary: TimeEntrySummary }> => {
  const response = await api.get('/time-entries/summary');
  return response.data;
};

export const createTimeEntry = async (data: CreateTimeEntryInput): Promise<TimeEntryResponse> => {
  const response = await api.post('/time-entries', data);
  return response.data;
};

export const updateTimeEntry = async (id: string, data: Partial<CreateTimeEntryInput> & { isBilled?: boolean; endTime?: string }): Promise<TimeEntryResponse> => {
  const response = await api.put(`/time-entries/${id}`, data);
  return response.data;
};

export const deleteTimeEntry = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/time-entries/${id}`);
  return response.data;
};
