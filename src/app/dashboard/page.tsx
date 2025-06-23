// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { DashboardForm, EnrichedReport } from '@/components/forms/DashboardForm';
import { SubmissionDetailsModal } from '@/components/modals/SubmissionDetailsModal';

// A responsive SummaryCard component using Tailwind CSS
const SummaryCard = ({ title, count, onClick }: { title: string, count?: number, onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`bg-gray-50 p-4 rounded-lg border border-gray-200 transition-colors ${onClick ? 'cursor-pointer hover:bg-gray-100' : ''}`}
  >
    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
    <p className="mt-1 text-gray-900 text-3xl font-bold">
      {count === undefined ? '...' : count}
    </p>
  </div>
);

// A simple TableSkeleton component using Tailwind CSS
const TableSkeleton = () => (
  <div className="opacity-60 space-y-2">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-14 bg-gray-200 rounded-md"></div>
    ))}
  </div>
);

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<EnrichedReport | null>(null);
  
  const dashboardData = useQuery(api.dashboard.getDashboardSubmissions);
  const isAdmin = dashboardData?.isAdmin;

  useEffect(() => {
    if (isAdmin === true) {
      setActiveTab('needsReview');
    } else if (isAdmin === false) {
      setActiveTab('serviceReports');
    }
  }, [isAdmin]);

  useEffect(() => {
    setStatusFilter('all');
  }, [activeTab]);

  const allSubmissions = dashboardData?.submissions ?? [];
  // Infer the submission type from the API response to avoid `any`.
  type ApiSubmission = (typeof allSubmissions)[number];
  
  // This helper ensures submission objects conform to the EnrichedReport type,
  // specifically by guaranteeing `modelTypes` is a non-null array.
  const addModelTypes = (submission: ApiSubmission): EnrichedReport => ({...submission, modelTypes: submission.modelTypes ?? [] });
  
  const pendingSubmissions = allSubmissions.filter((s): s is typeof s & { status: string } => 'status' in s && s.status === 'pending').map(addModelTypes);
  const engineerComplaints = allSubmissions.filter(s => s.type === 'serviceReport').map(addModelTypes);
  const customerComplaints = allSubmissions.filter(s => s.type === 'complaint').map(addModelTypes);
  const feedback = allSubmissions.filter(s => s.type === 'feedback').map(addModelTypes);

  const getDisplaySubmissions = () => {
    let submissions: EnrichedReport[];
    switch (activeTab) {
      case 'needsReview': submissions = pendingSubmissions; break;
      case 'serviceReports': submissions = engineerComplaints; break;
      case 'complaints': submissions = customerComplaints; break;
      case 'feedback': submissions = feedback; break;
      default: submissions = [];
    }
    if (isAdmin && statusFilter !== 'all') {
      return submissions.filter(s => s.status === statusFilter);
    }
    return submissions;
  };

  const displaySubmissions = getDisplaySubmissions();
  
  const getTabClass = (tabName: string) => {
    const isActive = activeTab === tabName;
    return `px-3 sm:px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
      isActive
        ? 'border-blue-700 text-blue-700'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            {isAdmin ? "Review submissions and track activity." : "Viewing your submitted reports and approved company reports."}
          </p>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <SummaryCard title="Pending Approval" count={dashboardData?.pendingCount} onClick={() => setActiveTab('needsReview')} />
            <SummaryCard title="Submissions Today" count={dashboardData?.submissionsTodayCount} />
          </div>
        )}

        {/* Responsive, scrollable tab container */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto" aria-label="Tabs">
            {isAdmin && <button className={getTabClass('needsReview')} onClick={() => setActiveTab('needsReview')}>Needs Review</button>}
            <button className={getTabClass('serviceReports')} onClick={() => setActiveTab('serviceReports')}>Engineer Complaints</button>
            <button className={getTabClass('complaints')} onClick={() => setActiveTab('complaints')}>Customer Complaints</button>
            {isAdmin && <button className={getTabClass('feedback')} onClick={() => setActiveTab('feedback')}>Customer Feedback</button>}
          </nav>
        </div>

        <div className="mt-6">
          {dashboardData === undefined || activeTab === null ? (
            <TableSkeleton />
          ) : (
            <DashboardForm
              submissions={displaySubmissions}
              isAdmin={!!isAdmin}
              currentStatusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              isFilterable={activeTab !== 'needsReview'}
              onViewSubmission={(submission) => setSelectedSubmission(submission)}
            />
          )}
        </div>
      </div>

      <SubmissionDetailsModal
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      />
    </div>
  );
}