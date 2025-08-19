// src/components/ManagementDashboardProtection.tsx
'use client';

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface ManagementDashboardProtectionProps {
  children: ReactNode;
}

export default function ManagementDashboardProtection({ children }: ManagementDashboardProtectionProps) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const router = useRouter();

  useEffect(() => {
    // If auth has loaded and the user is NOT authenticated, redirect to the login page.
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // If user data has loaded and the user CANNOT access the management dashboard, redirect.
    if (!authLoading && isAuthenticated && user !== undefined && !user?.canAccessManagementDashboard) {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, authLoading, user, router]);

  // --- UI States ---

  // 1. Show a loading spinner while checking auth status or fetching user data.
  if (authLoading || (isAuthenticated && user === undefined)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 2. If the user is authenticated but lacks permission, show "Access Denied".
  if (isAuthenticated && user !== undefined && user !== null && !user.canAccessManagementDashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <div className="mb-4">
          <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">You do not have permission to access the Management Dashboard section.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  // 3. If all checks pass (authenticated and has permission), render the children.
  if (isAuthenticated && user?.canAccessManagementDashboard) {
    return <>{children}</>;
  }

  // Fallback: render nothing while redirects are happening.
  return null;
}