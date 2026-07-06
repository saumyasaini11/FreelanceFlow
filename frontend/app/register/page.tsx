"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@/lib/validators/auth';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { Activity, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import Script from 'next/script';

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const handleGoogleResponse = useCallback(async (response: { credential?: string }) => {
    if (!response.credential) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle(response.credential);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Google authentication failed.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }, [loginWithGoogle]);

  useEffect(() => {
    const google = (window as unknown as { 
      google?: { 
        accounts: { 
          id: { 
            initialize: (config: { client_id: string; callback: (res: { credential?: string }) => void }) => void; 
            renderButton: (parent: HTMLElement, options: { theme?: string; size?: string; text?: string; shape?: string; width?: number }) => void; 
          } 
        } 
      } 
    }).google;

    if (google && google.accounts && google.accounts.id && googleClientId) {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
      });

      const buttonDiv = document.getElementById('google-signup-btn');
      if (buttonDiv) {
        google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
          text: 'signup_with',
          shape: 'rectangular',
          width: buttonDiv.offsetWidth || 340,
        });
      }
    }
  }, [googleClientId, handleGoogleResponse, isScriptLoaded]);

  const onSubmit = async (data: RegisterFormValues) => {
    if (recaptchaKey && !recaptchaToken) {
      setError('Please complete the reCAPTCHA verification.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      const msg = await registerUser(data.name, data.email, data.password, recaptchaToken);
      setSuccessMessage(msg || 'Registration successful! Please check your email to verify your account.');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMsg);
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
      {googleClientId && (
        <Script 
          src="https://accounts.google.com/gsi/client" 
          onLoad={() => setIsScriptLoaded(true)}
          strategy="lazyOnload"
        />
      )}

      <div className="absolute top-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Activity className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/50 p-8 shadow-xl backdrop-blur-md">
          {successMessage ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Verify your email</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {successMessage}
              </p>
              <div className="pt-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full cursor-pointer">
                    Go to Sign In
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
                <label htmlFor="name" className="text-sm font-medium text-muted-foreground block">
                  Full Name
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    {...formRegister('name')}
                    className="block w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>

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
                    {...formRegister('email')}
                    className="block w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-muted-foreground block">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...formRegister('password')}
                    className="block w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
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

              <Button
                type="submit"
                className="w-full flex justify-center py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>

              {googleClientId && (
                <>
                  <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink mx-4 text-muted-foreground text-xs uppercase">Or continue with</span>
                    <div className="flex-grow border-t border-border"></div>
                  </div>

                  <div className="flex justify-center w-full">
                    <div id="google-signup-btn" className="w-full max-w-[340px] flex justify-center" />
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
