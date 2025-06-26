// src/components/InvitePage.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useAction } from 'convex/react'; 
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../convex/_generated/api';
import Image from 'next/image';
import { Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-slate-600">Verifying your invitation...</p>
      </div>
    </div>
  );
}

function InvalidState({ error }: { error?: string }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-md">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-600 mb-2">Invitation Invalid</h2>
        <p className="text-slate-600">{error || "This link may have expired or been used already."}</p>
        <button 
          onClick={() => router.push('/login')}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Login Page
        </button>
      </div>
    </div>
  );
}

function SuccessState() {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => router.push('/dashboard'), 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-md">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-600 mb-2">Account Created!</h2>
        <p className="text-slate-600 mb-4">Your account has been successfully created and you are now logged in.</p>
        <div className="text-sm text-slate-500">Redirecting to dashboard in 3 seconds...</div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
}

export function InvitePage() {
  const params = useParams();
  const token = params.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { signIn } = useAuthActions();
  const setPasswordAndActivate = useAction(api.invitations.setPasswordAndCompleteInvitation);

  // --- THE FIX IS HERE ---
  // We tell the query to 'skip' if the token is missing OR if the process has already succeeded.
  // This prevents it from re-running after a successful submission.
  const invitation = useQuery(
    api.invitations.verifyInvitation,
    (token && !success) ? { token } : 'skip'
  );

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long.';
    if (!/(?=.*[a-z])/.test(pwd)) return 'Password must contain at least one lowercase letter.';
    if (!/(?=.*[A-Z])/.test(pwd)) return 'Password must contain at least one uppercase letter.';
    if (!/(?=.*\d)/.test(pwd)) return 'Password must contain at least one number.';
    return '';
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!invitation?.valid || !invitation.user?.email) {
      setError("Invitation data is invalid. Please check the link.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Call backend action to create the user account and delete the invitation.
      await setPasswordAndActivate({ token, password });
      
      // Step 2: Now that the account exists, sign the user in from the client.
      await signIn("password", { 
        email: invitation.user.email, 
        password 
      });
      
      // Step 3: Show the success screen. This will now take priority on the next render.
      setSuccess(true);
    } catch (err: unknown) {
      console.error("Account creation/login failed:", err);
      let friendlyMessage = "An unexpected error occurred. Please try again.";
      if (err instanceof Error) {
        friendlyMessage = err.message;
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Show success state first (highest priority)
  if (success) return <SuccessState />;
  
  // Show loading state while invitation is being fetched for the first time
  if (invitation === undefined) return <LoadingState />;
  
  // Show invalid state if the initial fetch shows the token is invalid
  if (!invitation.valid) return <InvalidState error={invitation.error} />;

  // If all checks pass, show the form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-6 shadow-md sm:p-8">
        <div className="text-center">
          <Image src="/images/logo.jpg" alt="Mediant Logo" width={70} height={70} className="mx-auto rounded-full" priority />
          <h1 className="mt-5 text-center text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Complete Your Registration</h1>
          <p className="mt-2 text-sm text-slate-600">Set up your password to access your account</p>
        </div>
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm">
          <p><span className="font-semibold text-slate-700">Name:</span> {invitation.user?.name}</p>
          <p><span className="font-semibold text-slate-700">Email:</span> {invitation.user?.email}</p>
          <p><span className="font-semibold text-slate-700">Role:</span> {invitation.user?.isAdmin ? 'Admin' : 'User'}</p>
        </div>

        {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
            </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <div className="relative mt-1">
              <input type={isPasswordVisible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 pr-10 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" placeholder="Enter your password" />
              <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">{isPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Must be 8+ characters with uppercase, lowercase, and a number.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
            <div className="relative mt-1">
              <input type={isConfirmVisible ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 pr-10 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" placeholder="Confirm your password" />
              <button type="button" onClick={() => setIsConfirmVisible(!isConfirmVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">{isConfirmVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
          </div>
          <button type="submit" disabled={loading || !password || !confirmPassword} className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Creating Account...</>) : ('Create Account')}</button>
        </form>
      </div>
    </div>
  );
}