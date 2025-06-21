// src/components/InvitePage.tsx

"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../convex/_generated/api';

export function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuthActions();
  const completeInvitation = useMutation(api.invitations.completeInvitation);

  const invitation = useQuery(
    api.invitations.verifyInvitation,
    token ? { token } : 'skip'
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
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
      // This is the line that was causing the schema error
      await signIn('password', {
        email: invitation.user.email,
        password,
        flow: 'signUp',
      });

      // This line would run after a successful (but crashing) signIn
      await completeInvitation({ token });

      router.push('/dashboard');

    } catch (err: any) {
      const errorMessage = err.data?.message || err.message || 'Failed to create account.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // --- RENDER LOGIC ---
  if (invitation === undefined) {
    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold">Verifying Invitation...</h2>
        </div>
    );
  }
  
  if (!invitation.valid) {
    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600">Invitation Invalid</h2>
            <p>{invitation.error}</p>
        </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Complete Your Registration</h2>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p><strong>Name:</strong> {invitation.user?.name}</p>
        <p><strong>Email:</strong> {invitation.user?.email}</p>
        <p><strong>Role:</strong> {invitation.user?.isAdmin ? 'Admin' : 'User'}</p>
      </div>
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400">
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
}