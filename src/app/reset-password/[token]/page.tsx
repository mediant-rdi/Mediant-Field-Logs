// src/app/reset-password/[token]/page.tsx
"use client";

import { useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
// --- FIX #1: We need useAction for resetPasswordWithToken ---
import { useQuery, useAction } from 'convex/react'; 
import { api } from '../../../../convex/_generated/api';
import Image from 'next/image';
import { Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
        <p className="mt-4 text-slate-600">Verifying reset link...</p>
      </div>
    </div>
  );
}

function InvalidState({ error }: { error?: string }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-md">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-2xl font-bold text-slate-800">Link Invalid</h2>
        <p className="mt-2 text-slate-600">{error || "This link may have expired or been used already."}</p>
        <button 
          onClick={() => router.push('/login')}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}

function SuccessState() {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-md">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-4 text-2xl font-bold text-slate-800">Password Reset!</h2>
        <p className="mt-2 text-slate-600">Your password has been successfully updated.</p>
        <button 
          onClick={() => router.push('/login')}
          className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Proceed to Login
        </button>
      </div>
    </div>
  );
}


export default function PasswordResetPage() {
  const params = useParams();
  const token = params.token as string; // This is the public URL token

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // --- FIX #2: Use the simple `resetPasswordWithToken` action ---
  const resetPasswordAction = useAction(api.passwordResets.resetPasswordWithToken);
  
  // --- FIX #3: Use the simple `verifyPasswordResetToken` query ---
  const tokenData = useQuery(
    api.passwordResets.verifyPasswordResetToken,
    token ? { token } : 'skip'
  );

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setLoading(true);
    try {
      // --- FIX #4: Call our simple action with just the token and new password ---
      await resetPasswordAction({ token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      console.error("Password reset failed:", err);
      setError(err.data?.message || err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };
  
  if (success) return <SuccessState />;
  if (tokenData === undefined) return <LoadingState />;
  if (!tokenData.valid) return <InvalidState error={tokenData.error} />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-6 shadow-md sm:p-8">
        <div className="text-center">
          <Image src="/images/logo.jpg" alt="Mediant Logo" width={70} height={70} className="mx-auto rounded-full" priority />
          <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Create a New Password</h1>
          {/* --- FIX #5: Use `tokenData.user.email` --- */}
          <p className="mt-2 text-sm text-slate-600">Resetting password for: <span className='font-medium'>{tokenData.user?.email}</span></p>
        </div>
        
        {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
            </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">New Password</label>
            <div className="relative mt-1">
              <input type={isPasswordVisible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 pr-10 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" placeholder="Enter new password" />
              <button type="button" onClick={() => setIsPasswordVisible(!isPasswordVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">{isPasswordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Must be at least 8 characters long.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
            <div className="relative mt-1">
              <input type={isConfirmVisible ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 pr-10 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500" placeholder="Confirm new password" />
              <button type="button" onClick={() => setIsConfirmVisible(!isConfirmVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">{isConfirmVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
          </div>
          <button type="submit" disabled={loading || !password || !confirmPassword} className="flex w-full justify-center items-center rounded-md border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Updating Password...</>) : ('Reset Password')}
          </button>
        </form>
      </div>
    </div>
  );
}