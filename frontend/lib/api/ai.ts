import api from '../api';

// Proposal Generator
export interface ProposalInput {
  projectName: string;
  clientType: string;
  scope: string;
  budget: number;
  deadline: string;
  skills: string[];
}

export const generateProposal = async (data: ProposalInput): Promise<{ success: boolean; proposal: string }> => {
  const response = await api.post('/ai/proposal', data);
  return response.data;
};

// Rate Advisor
export interface RateAdvisorInput {
  skills: string[];
  experienceYears: number;
  projectType: string;
  location: string;
}

export interface RateAdvisorOutput {
  hourlyMin: number;
  hourlyMax: number;
  projectMin: number;
  projectMax: number;
  reasoning: string;
  marketContext: string;
  tips: string[];
}

export const getRateAdvice = async (data: RateAdvisorInput): Promise<{ success: boolean; advice: RateAdvisorOutput }> => {
  const response = await api.post('/ai/rate-advisor', data);
  return response.data;
};

// Project Health
export interface ProjectHealthOutput {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  risks: { severity: 'low' | 'medium' | 'high'; message: string }[];
  recommendations: string[];
}

export const getProjectHealth = async (projectId: string): Promise<{
  success: boolean;
  health: ProjectHealthOutput;
  project: { name: string; status: string; progress: number };
}> => {
  const response = await api.post('/ai/project-health', { projectId });
  return response.data;
};
