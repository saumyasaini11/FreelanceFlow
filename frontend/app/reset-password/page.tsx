"use client"

import React, { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '@/lib/validators/auth';
import api from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { Activity, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams ? searchParams.get('token') : null;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setError('Reset token is missing in URL.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password: data.password });
      setSuccess(true);
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosError.response?.data?.error?.message || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 p-8 shadow-xl backdrop-blur-md text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-emerald-500/20">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold">Invalid Reset Request</h3>
        <p className="text-sm text-muted-foreground">
          The password reset token is missing or invalid. Please request a new link.
        </p>
        <div className="pt-2">
          <Link href="/forgot-password">
            <Button className="w-full cursor-pointer">Request New Link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-8 shadow-xl backdrop-blur-md">
      {success ? (
        <div className="text-center space-y-4 py-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Password Reset Complete</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button className="w-full flex items-center justify-center gap-2 cursor-pointer">
                Sign In <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="flex items-center gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-muted-foreground block">
              New Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="block w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full flex justify-center py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Resetting password...
              </div>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Activity className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Set your new login credentials.
          </p>
        </div>

        <Suspense fallback={
          <div className="rounded-2xl border border-border bg-card/50 p-8 shadow-xl backdrop-blur-md text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-4">Loading reset context...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
