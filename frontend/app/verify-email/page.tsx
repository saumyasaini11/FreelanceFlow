"use client"

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Activity, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams ? searchParams.get('token') : null;

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing in the URL. Please request a new link.');
      return;
    }

    const verify = async () => {
      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully! You can now log in.');
      } catch (err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setStatus('error');
        setMessage(axiosError.response?.data?.error?.message || 'Failed to verify email. The token may be invalid or has expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-8 shadow-xl backdrop-blur-md text-center space-y-6">
      {status === 'loading' && (
        <div className="space-y-4 py-6">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <h3 className="text-lg font-semibold">{message}</h3>
          <p className="text-sm text-muted-foreground">Please wait while we validate your credentials.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4 py-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">Email Verified!</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button className="w-full flex items-center justify-center gap-2 cursor-pointer">
                Sign In <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4 py-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">Verification Failed</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button variant="outline" className="w-full cursor-pointer">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
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
            Email Verification
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Confirming your FreelanceFlow membership.
          </p>
        </div>

        <Suspense fallback={
          <div className="rounded-2xl border border-border bg-card/50 p-8 shadow-xl backdrop-blur-md text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-4">Loading verification...</p>
          </div>
        }>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
