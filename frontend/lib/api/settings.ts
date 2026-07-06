import api from '../api';
import { UserProfile } from '@/context/auth-context';

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  avatar?: string;
}

export const updateProfile = async (data: UpdateProfileInput): Promise<{ success: boolean; user: UserProfile }> => {
  const response = await api.put('/settings/profile', data);
  return response.data;
};

export interface ChangePasswordInput {
  currentPassword?: string;
  newPassword?: string;
}

export const changePassword = async (data: ChangePasswordInput): Promise<{ success: boolean; message: string }> => {
  const response = await api.put('/settings/password', data);
  return response.data;
};

export const deleteAccount = async (confirmation: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete('/settings/account', { data: { confirmation } });
  return response.data;
};
