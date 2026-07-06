"use client"

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema } from '@/lib/validators/auth';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { Activity, Mail, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    if (recaptchaKey && !recaptchaToken) {
      setError('Please complete the reCAPTCHA verification.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email, recaptchaToken });
      setSuccessMessage(response.data.message || 'If an account matches that email, a password reset link has been sent.');
    } catch (err) {
      const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
      setError(axiosError.response?.data?.error?.message || 'Failed to request password reset. Please try again.');
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your email to receive a password reset link.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/50 p-8 shadow-xl backdrop-blur-md">
          {successMessage ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Check your inbox</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {successMessage}
              </p>
              <div className="pt-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2 cursor-pointer">
                    <ArrowLeft className="h-4 w-4" /> Back to Sign In
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
                <label htmlFor="email" className="text-sm font-medium text-muted-foreground block">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...register('email')}
                    className="block w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              {recaptchaKey && (
                <div className="flex justify-center my-4 overflow-hidden rounded-lg">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={recaptchaKey}
                    onChange={(token) => setRecaptchaToken(token)}
                    theme="dark"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full flex justify-center py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Sending link...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
                <Link href="/login" className="w-full">
                  <Button type="button" variant="ghost" className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                    <ArrowLeft className="h-4 w-4" /> Cancel
                  </Button>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
