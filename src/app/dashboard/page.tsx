// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { DashboardForm, EnrichedReport } from '@/components/forms/DashboardForm';
import dynamic from 'next/dynamic';

const SubmissionDetailsModal = dynamic(
  () => import('@/components/modals/SubmissionDetailsModal'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">Loading details...</div>
      </div>
    ),
    ssr: false
  }
);

// NEW: Define a specific type for the dashboard stats data to replace 'any'
type DashboardStatsType = {
  isAdmin: boolean;
  pendingCount: number;
  submissionsTodayCount: number;
};

const SummaryCard = ({ title, count, onClick }: { title: string, count?: number, onClick?: () => void }) => (
  <div
    onClick={onClick}
    className={`bg-gray-50 p-4 rounded-lg border border-gray-200 transition-colors ${onClick ? 'cursor-pointer hover:bg-gray-100' : ''}`}
  >
    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
    <p className="mt-1 text-gray-900 text-3xl font-bold">
      {count === undefined ? <span className="opacity-50">...</span> : count}
    </p>
  </div>
);

const TableSkeleton = () => (
  <div className="animate-pulse space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-14 bg-gray-200 rounded-md"></div>
    ))}
  </div>
);

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

// FIX: Replaced 'any' with the specific 'DashboardStatsType'.
// The prop can be 'undefined' while the query is loading.
const DashboardStats = React.memo(function DashboardStats({ stats, onReviewClick }: { stats: DashboardStatsType | undefined, onReviewClick: () => void }) {
  if (!stats?.isAdmin) {
    return null;
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <SummaryCard title="Pending Approval" count={stats?.pendingCount} onClick={onReviewClick} />
      <SummaryCard title="Submissions Today" count={stats?.submissionsTodayCount} />
    </div>
  );
});

type TabType = 'complaints' | 'feedback' | 'serviceReports' | 'needsReview' | null;

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<EnrichedReport | null>(null);
  
  const statsData = useQuery(api.dashboard.getDashboardStats);
  const isAdmin = statsData?.isAdmin;

  const submissionsData = useQuery(api.dashboard.getFilteredSubmissions, {
    tab: activeTab,
    statusFilter: activeTab === 'needsReview' ? 'pending' : statusFilter,
  });
  const displaySubmissions = (submissionsData?.submissions ?? []) as EnrichedReport[];

  useEffect(() => {
    if (activeTab === null && isAdmin !== undefined) {
        setActiveTab(isAdmin ? 'needsReview' : 'serviceReports');
    }
  }, [isAdmin, activeTab]);

  useEffect(() => {
    setStatusFilter('all');
  }, [activeTab]);

  const handleReviewClick = useCallback(() => setActiveTab('needsReview'), []);
  const handleViewSubmission = useCallback((submission: EnrichedReport) => setSelectedSubmission(submission), []);

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
            {statsData === undefined
              ? 'Loading...'
              : isAdmin ? "Review submissions and track activity." : "Viewing your submitted reports and approved company reports."}
          </p>
        </div>
        
        <DashboardStats stats={statsData} onReviewClick={handleReviewClick} />

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto" aria-label="Tabs">
            {isAdmin && <button className={getTabClass('needsReview')} onClick={() => setActiveTab('needsReview')}>Needs Review</button>}
            <button className={getTabClass('serviceReports')} onClick={() => setActiveTab('serviceReports')}>Engineer Complaints</button>
            <button className={getTabClass('complaints')} onClick={() => setActiveTab('complaints')}>Customer Complaints</button>
            {isAdmin && <button className={getTabClass('feedback')} onClick={() => setActiveTab('feedback')}>Customer Feedback</button>}
          </nav>
        </div>

        <div className="mt-6">
          {submissionsData === undefined ? (
            <TableSkeleton />
          ) : (
            <DashboardForm
              submissions={displaySubmissions}
              isAdmin={!!isAdmin}
              currentStatusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              isFilterable={activeTab !== 'needsReview' && activeTab !== 'feedback'}
              onViewSubmission={handleViewSubmission}
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