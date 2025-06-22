// app/dashboard/page.tsx
'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { DashboardForm } from '@/components/forms/DashboardForm';

const TableSkeleton = () => (
  <div style={{ opacity: 0.6 }}>
    {[...Array(3)].map((_, i) => (
      <div key={i} style={{ height: '3.5rem', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
    ))}
  </div>
);

export default function DashboardPage() {
  const dashboardData = useQuery(api.dashboard.getDashboardSubmissions);
  
  const allSubmissions = dashboardData?.submissions ?? [];
  const isAdmin = dashboardData?.isAdmin ?? false;

  // UPDATED: Filter into three separate lists
  // Ensure each submission has the required modelTypes property for EnrichedReport
  const addModelTypes = (submission: any) => ({
    ...submission,
    modelTypes: submission.modelTypes ?? [],
  });

  const serviceReports = allSubmissions
    .filter(s => s.type === 'serviceReport')
    .map(addModelTypes);
  const complaints = allSubmissions
    .filter(s => s.type === 'complaint')
    .map(addModelTypes);
  const feedback = allSubmissions
    .filter(s => s.type === 'feedback')
    .map(addModelTypes);

  return (
    <div className="space-y-8">
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
        
        <div style={{ marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111827' }}>Dashboard</h1>
          <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '14px' }}>
            {isAdmin ? "Viewing all submissions as an administrator." : "Viewing your submitted reports."}
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Service Delay Reports (No change) */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#374151', marginBottom: '16px' }}>
              Service Delay Reports
            </h2>
            {dashboardData === undefined ? <TableSkeleton /> : <DashboardForm submissions={serviceReports} isAdmin={isAdmin} />}
          </div>

          {/* Section 2: Complaint Reports (No change) */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#374151', marginBottom: '16px' }}>
              Complaint Reports
            </h2>
            {dashboardData === undefined ? <TableSkeleton /> : <DashboardForm submissions={complaints} isAdmin={isAdmin} />}
          </div>
          
          {/* NEW: Section 3 for Customer Feedback, rendered only for admins */}
          {isAdmin && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '500', color: '#374151', marginBottom: '16px' }}>
                Customer Feedback
              </h2>
              {dashboardData === undefined ? <TableSkeleton /> : <DashboardForm submissions={feedback} isAdmin={isAdmin} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}