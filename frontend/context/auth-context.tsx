"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api, { setAccessToken } from '@/lib/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  avatar?: string;
  bio?: string;
  industries?: string[];
  googleId?: string;
  token?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, recaptchaToken?: string | null) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string, industries?: string[], recaptchaToken?: string | null) => Promise<string>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshSession = async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      const { accessToken, user: userData } = response.data;
      setAccessToken(accessToken);
      setUser(userData);
    } catch (err) {
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();

    const handleLogout = () => {
      setUser(null);
      router.push('/login');
    };

    window.addEventListener('auth-logout', handleLogout);
    return () => window.removeEventListener('auth-logout', handleLogout);
  }, [router]);

  const login = async (email: string, password: string, recaptchaToken?: string | null) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password, recaptchaToken });
      const { accessToken, user: userData } = response.data;
      setAccessToken(accessToken);
      setUser(userData);
      router.push('/');
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      throw new Error(axiosError.response?.data?.error?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/google', { credential });
      const { accessToken, user: userData } = response.data;
      setAccessToken(accessToken);
      setUser(userData);
      router.push('/');
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      throw new Error(axiosError.response?.data?.error?.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (name: string, email: string, password: string, industries?: string[], recaptchaToken?: string | null): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password, industries, recaptchaToken });
      return response.data.message || 'Verification email sent';
    } catch (error) {
      const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
      throw new Error(axiosError.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };
  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore API logout errors
    } finally {
      setAccessToken(null);
      setUser(null);
      setIsLoading(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithGoogle,
        register: registerUser,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
