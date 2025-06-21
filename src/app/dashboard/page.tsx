// app/dashboard/page.tsx
'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { DashboardForm } from '@/components/forms/DashboardForm';

// A simple loading skeleton component, styled to match your clients page.
const TableSkeleton = () => (
  <div style={{ opacity: 0.6 }}>
    {[...Array(5)].map((_, i) => (
      <div key={i} style={{ height: '3.5rem', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
    ))}
  </div>
);

export default function DashboardPage() {
  // This single query fetches an object containing both the submissions and the user's admin status.
  const dashboardData = useQuery(api.dashboard.getDashboardSubmissions);

  // We safely extract the data from the query's result.
  // The `??` provides a default value (empty array or false) while the data is loading (i.e., when `dashboardData` is undefined).
  const submissions = dashboardData?.submissions ?? [];
  const isAdmin = dashboardData?.isAdmin ?? false;

  return (
    <div className="space-y-8">
      {/* Main container with white background and padding */}
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
        
        {/* Header section with title */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111827' }}>Dashboard</h1>
          <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '14px' }}>
            {isAdmin ? "Viewing all submissions as an administrator." : "Viewing your submitted reports."}
          </p>
        </div>

        {/* Submissions Table Section */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#374151', marginBottom: '16px' }}>
            Service Delay Reports
          </h2>
          
          {/* Conditional Rendering: Show a skeleton while `dashboardData` is undefined (loading) */}
          {dashboardData === undefined ? (
            <TableSkeleton />
          ) : (
            <DashboardForm submissions={submissions} isAdmin={isAdmin} />
          )}
        </div>
      </div>
    </div>
  );
}