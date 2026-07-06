"use client"

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/protected-route';
import { updateProfile, changePassword, deleteAccount } from '@/lib/api/settings';
import { User, Shield, AlertTriangle, Loader2, Save, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const { user, refreshSession, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'danger'>('profile');
  
  // Profile state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  // Danger state
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await updateProfile({ name, bio, avatar });
      await refreshSession(); // update local context
      setProfileMsg('Profile updated successfully.');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setProfileMsg(error.response?.data?.error?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg({ text: '', type: '' });
    try {
      const res = await changePassword({ currentPassword, newPassword });
      setPasswordMsg({ text: res.message, type: 'success' });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => logout(), 2000); // force re-login
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setPasswordMsg({ text: error.response?.data?.error?.message || 'Failed to change password.', type: 'error' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirm !== 'DELETE') return;
    setDeleteLoading(true);
    try {
      await deleteAccount(deleteConfirm);
      logout();
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      setDeleteMsg(error.response?.data?.error?.message || 'Failed to delete account.');
      setDeleteLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ] as const;

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto space-y-8 text-slate-100 pb-12">
        <div className="flex justify-between items-end border-b border-white/10 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
            <p className="text-slate-400 mt-1">Manage your account preferences and security.</p>
          </div>
          <button onClick={() => logout()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 shrink-0 flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap
                ${activeTab === tab.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-8 shadow-xl min-h-[400px]">
            <AnimatePresence mode="wait">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold">Public Profile</h2>
                    <p className="text-sm text-slate-400 mt-1">This information will be displayed on your invoices.</p>
                  </div>
                  <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-md">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center overflow-hidden shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-slate-500" />}
                      </div>
                      <div className="space-y-1 flex-1">
                        <label className="text-xs font-semibold text-slate-400">Avatar URL</label>
                        <input value={avatar} onChange={e => setAvatar(e.target.value)} type="url" placeholder="https://..."
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Full Name *</label>
                      <input value={name} onChange={e => setName(e.target.value)} required
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-400">Bio (Optional)</label>
                      <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 resize-none" />
                    </div>
                    <div className="pt-2 flex items-center gap-4">
                      <button type="submit" disabled={profileSaving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-50">
                        {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
                      </button>
                      {profileMsg && <span className="text-sm font-semibold text-emerald-400">{profileMsg}</span>}
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold">Security</h2>
                    <p className="text-sm text-slate-400 mt-1">Manage your password and authentication.</p>
                  </div>
                  {user?.googleId ? (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5 flex items-start gap-3 max-w-md">
                      <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-indigo-300 text-sm">Google Authentication Enabled</p>
                        <p className="text-xs text-slate-400 mt-1">You log in using your Google account. Password changes are managed through Google.</p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Current Password</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">New Password</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400">Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8}
                          className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" />
                      </div>
                      <div className="pt-2 flex flex-col gap-2">
                        <button type="submit" disabled={passwordSaving}
                          className="self-start flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors disabled:opacity-50">
                          {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                        </button>
                        {passwordMsg.text && (
                          <span className={`text-sm font-semibold ${passwordMsg.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {passwordMsg.text}
                          </span>
                        )}
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

              {/* Danger Tab */}
              {activeTab === 'danger' && (
                <motion.div key="danger" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6 max-w-lg">
                  <div>
                    <h2 className="text-xl font-bold text-rose-500">Danger Zone</h2>
                    <p className="text-sm text-slate-400 mt-1">Irreversible and destructive actions.</p>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-rose-400">Delete Account</h3>
                      <p className="text-xs text-rose-200/70 mt-1 leading-relaxed">
                        Once you delete your account, there is no going back. Please be certain.
                        This will permanently delete your profile, all your clients, all projects, time entries, and invoices.
                      </p>
                    </div>
                    <form onSubmit={handleDeleteAccount} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-rose-400 uppercase tracking-wide">Type DELETE to confirm</label>
                        <input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} required placeholder="DELETE"
                          className="w-full bg-slate-950/50 border border-rose-500/30 rounded-lg px-3 py-2 text-sm text-rose-100 focus:outline-none focus:border-rose-500 placeholder:text-rose-900" />
                      </div>
                      <button type="submit" disabled={deleteConfirm !== 'DELETE' || deleteLoading}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Permanently Delete Account'}
                      </button>
                      {deleteMsg && <p className="text-xs font-semibold text-rose-400 text-center">{deleteMsg}</p>}
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
