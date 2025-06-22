// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react'; // <-- Import useEffect
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { DashboardForm } from '@/components/forms/DashboardForm';

const SummaryCard = ({ title, count, onClick }: { title: string, count?: number, onClick?: () => void }) => (
  <div onClick={onClick} style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: onClick ? 'pointer' : 'default', transition: 'background-color 0.2s' }} onMouseEnter={(e) => { if(onClick) e.currentTarget.style.backgroundColor = '#f3f4f6'; }} onMouseLeave={(e) => { if(onClick) e.currentTarget.style.backgroundColor = '#f9fafb'; }}>
    <h3 style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
    <p style={{ margin: '4px 0 0 0', color: '#111827', fontSize: '28px', fontWeight: '700' }}>{count === undefined ? '...' : count}</p>
  </div>
);

const TableSkeleton = () => (
  <div style={{ opacity: 0.6 }}>{[...Array(3)].map((_, i) => (<div key={i} style={{ height: '3.5rem', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>))}</div>
);

export default function DashboardPage() {
  // Set initial state to null, so we can set it based on the user's role later.
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const dashboardData = useQuery(api.dashboard.getDashboardSubmissions);
  
  // Use a direct variable for isAdmin. It will be undefined initially.
  const isAdmin = dashboardData?.isAdmin;

  // --- FIX: Use an effect to set the default tab based on the user's role ---
  useEffect(() => {
    // This effect will run when `isAdmin` changes from undefined to true/false.
    if (isAdmin === true) {
      // If the user is an admin, default to the 'Needs Review' tab.
      setActiveTab('needsReview');
    } else if (isAdmin === false) {
      // If the user is a normal user, default to the 'Service Reports' tab.
      setActiveTab('serviceReports');
    }
    // The dependency array ensures this effect only runs when isAdmin's value is loaded.
  }, [isAdmin]);

  const allSubmissions = dashboardData?.submissions ?? [];

  // This helper function is fine, ensures data consistency for the DashboardForm component
  const addModelTypes = (submission: any): any => ({
    ...submission,
    modelTypes: submission.modelTypes ?? [],
  });

  const pendingSubmissions = allSubmissions
    .filter((s): s is typeof s & { status: string } => 'status' in s && s.status === 'pending')
    .map(addModelTypes);
  const serviceReports = allSubmissions
    .filter(s => s.type === 'serviceReport')
    .map(addModelTypes);
  const complaints = allSubmissions
    .filter(s => s.type === 'complaint')
    .map(addModelTypes);
  const feedback = allSubmissions
    .filter(s => s.type === 'feedback')
    .map(addModelTypes);

  const tabStyle = (tabName: string): React.CSSProperties => ({
    padding: '8px 16px', fontSize: '14px', fontWeight: 500, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: activeTab === tabName ? '#1e40af' : '#6b7280', borderBottom: activeTab === tabName ? '2px solid #1e40af' : '2px solid transparent', marginBottom: '-1px', transition: 'color 0.2s, border-color 0.2s',
  });

  return (
    <div className="space-y-6">
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111827' }}>Dashboard</h1>
          <p style={{ marginTop: '8px', color: '#6b7280', fontSize: '14px' }}>{isAdmin ? "Review submissions and track activity." : "Viewing your submitted reports and approved company reports."}</p>
        </div>

        {isAdmin && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <SummaryCard title="Pending Approval" count={dashboardData?.pendingCount} onClick={() => setActiveTab('needsReview')} />
                <SummaryCard title="Submissions Today" count={dashboardData?.submissionsTodayCount} />
            </div>
        )}

        <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
            {/* These buttons are conditionally rendered based on the user's role */}
            {isAdmin && <button style={tabStyle('needsReview')} onClick={() => setActiveTab('needsReview')}>Needs Review</button>}
            <button style={tabStyle('serviceReports')} onClick={() => setActiveTab('serviceReports')}>Service Reports</button>
            <button style={tabStyle('complaints')} onClick={() => setActiveTab('complaints')}>Complaints</button>
            {isAdmin && <button style={tabStyle('feedback')} onClick={() => setActiveTab('feedback')}>Customer Feedback</button>}
        </div>

        <div>
          {/* Show a skeleton loader while data is loading OR before the default tab is set */}
          {dashboardData === undefined || activeTab === null ? <TableSkeleton /> : (
            <>
              {isAdmin && activeTab === 'needsReview' && <DashboardForm submissions={pendingSubmissions} isAdmin={isAdmin} />}
              {activeTab === 'serviceReports' && <DashboardForm submissions={serviceReports} isAdmin={!!isAdmin} />}
              {activeTab === 'complaints' && <DashboardForm submissions={complaints} isAdmin={!!isAdmin} />}
              {isAdmin && activeTab === 'feedback' && <DashboardForm submissions={feedback} isAdmin={isAdmin} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}