// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { DashboardForm, EnrichedReport } from '@/components/forms/DashboardForm';
import dynamic from 'next/dynamic';
import { 
  AlertCircle, 
  TrendingUp, 
  Activity,
  Settings,
  MessageSquare,
  FileText,
  Search,
  X,
} from 'lucide-react';
import Fuse from 'fuse.js';

// --- Debounce hook (unchanged) ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// --- All other components (SubmissionDetailsModal, SummaryCard, Skeletons, etc.) are unchanged ---
const SubmissionDetailsModal = dynamic(
  () => import('@/components/modals/SubmissionDetailsModal'),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
);

type DashboardStatsType = {
  isAdmin: boolean;
  pendingCount: number;
  submissionsTodayCount: number;
};

const SummaryCard = ({ title, count, icon: Icon, color, trend, onClick }: { title: string; count?: number; icon: React.ComponentType<{ className?: string }>; color: string; trend?: { value: number; label: string }; onClick?: () => void; }) => (
  <div onClick={onClick} className={`relative overflow-hidden bg-white rounded-xl border border-gray-200 p-6 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-gray-300 hover:scale-105' : ''}`}>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{count === undefined ? (<span className="inline-block w-8 h-8 bg-gray-200 rounded animate-pulse"></span>) : (count)}</p>
        {trend && (<div className="flex items-center gap-1 text-xs text-gray-500"><TrendingUp className="w-3 h-3" /><span>{trend.label}</span></div>)}
      </div>
      <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '50')}`}><Icon className={`w-6 h-6 ${color}`} /></div>
    </div>
    {onClick && (<div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>)}
  </div>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between"><div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-24"></div><div className="h-8 bg-gray-200 rounded w-16"></div></div><div className="w-12 h-12 bg-gray-200 rounded-full"></div></div>
      </div>
    ))}
  </div>
);
const TableSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-200 rounded-lg"></div><div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-20"></div><div className="h-3 bg-gray-200 rounded w-16"></div></div></div><div className="h-6 bg-gray-200 rounded-full w-16"></div></div><div className="space-y-2 mb-4"><div className="h-4 bg-gray-200 rounded w-full"></div><div className="h-4 bg-gray-200 rounded w-3/4"></div></div><div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>
    ))}
  </div>
);

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type TabType = 'complaints' | 'feedback' | 'serviceReports' | 'needsReview' | null;

const DashboardStats = React.memo(function DashboardStats({ stats, onReviewClick }: { stats: DashboardStatsType | undefined; onReviewClick: () => void; }) {
  if (stats === undefined) return <StatsSkeleton />;
  if (!stats.isAdmin) return null;
  const cards = [{title: "Pending Reviews",count: stats.pendingCount,icon: AlertCircle,color: "text-amber-600",onClick: onReviewClick},{title: "Today's Submissions",count: stats.submissionsTodayCount,icon: Activity,color: "text-blue-600",trend: { value: 12, label: "vs yesterday" }}];
  return (<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">{cards.map((card, index) => (<SummaryCard key={index} {...card} />))}</div>);
});

const ModernTab = ({ icon: Icon, label, isActive, onClick, badge }: { icon: React.ComponentType<{ className?: string }>; label: string; isActive: boolean; onClick: () => void; badge?: number;}) => (
  <button onClick={onClick} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
    <Icon className="w-4 h-4" /><span>{label}</span>
    {badge !== undefined && badge > 0 && (<span className="ml-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">{badge}</span>)}
  </button>
);

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<EnrichedReport | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const statsData = useQuery(api.dashboard.getDashboardStats);
  const isAdmin = statsData?.isAdmin;

  // This query now returns our unified EnrichedReport[]
  const submissionsData = useQuery(api.dashboard.getFilteredSubmissions, {
    tab: activeTab,
    statusFilter: activeTab === 'needsReview' ? 'pending' : statusFilter,
    searchQuery: debouncedSearchQuery,
  });

  const rawSubmissions = useMemo(
    () => (submissionsData?.submissions ?? []) as EnrichedReport[],
    [submissionsData]
  );
  
  const fuse = useMemo(() => {
    if (!rawSubmissions.length) return null;
    return new Fuse(rawSubmissions, {
      // --- MODIFIED: Search on the new unified fields ---
      keys: ['mainText', 'locationName', 'machineName', 'submitterName'], 
      includeScore: true,
      threshold: 0.4,
      minMatchCharLength: 2,
    });
  }, [rawSubmissions]);

  const displaySubmissions = useMemo(() => {
    if (searchQuery.trim() && fuse) {
      return fuse.search(searchQuery.trim()).map((result) => result.item);
    }
    return rawSubmissions;
  }, [searchQuery, rawSubmissions, fuse]);

  // --- All other useEffects and handlers are unchanged ---
  useEffect(() => {
    if (activeTab === null && isAdmin !== undefined && !debouncedSearchQuery) {
      setActiveTab(isAdmin ? 'needsReview' : 'serviceReports');
    }
  }, [isAdmin, activeTab, debouncedSearchQuery]);

  useEffect(() => {
    if(!debouncedSearchQuery) { 
      setStatusFilter('all');
    }
  }, [activeTab, debouncedSearchQuery]);
  
  useEffect(() => {
    if (debouncedSearchQuery) {
      setActiveTab(null);
    }
  }, [debouncedSearchQuery]);

  const handleReviewClick = useCallback(() => {
    setSearchQuery('');
    setActiveTab('needsReview');
  }, []);

  const handleViewSubmission = useCallback((submission: EnrichedReport) => setSelectedSubmission(submission), []);
  
  const handleTabClick = (tabKey: TabType) => {
    setSearchQuery(''); 
    setActiveTab(tabKey);
  }

  const tabs = [
    ...(isAdmin ? [{key: 'needsReview' as TabType,icon: AlertCircle,label: 'Needs Review',badge: statsData?.pendingCount}] : []),
    {key: 'serviceReports' as TabType,icon: Settings,label: 'Engineer Complaint',},
    {key: 'complaints' as TabType,icon: MessageSquare,label: 'Customer Complaints',},
    ...(isAdmin ? [{key: 'feedback' as TabType,icon: FileText,label: 'Feedback',}] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">
                {statsData === undefined ? 'Loading...' : isAdmin ? "Monitor submissions and manage your team's activity." : "Track your submissions and view approved company reports."}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards (Admin Only) */}
        <DashboardStats stats={statsData} onReviewClick={handleReviewClick} />

        {/* Main Content */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Tabs and Search Container */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="p-4 sm:px-6 sm:py-4 flex flex-col md:flex-row gap-4 items-center">
                {/* Search Input */}
                <div className="relative w-full md:max-w-xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search problems, clients, machines..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    {searchQuery && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>

              {/* Tabs Wrapper */}
              <div className="relative flex-1 w-full">
                <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {tabs.map((tab) => (
                    <ModernTab key={tab.key} icon={tab.icon} label={tab.label} isActive={activeTab === tab.key} onClick={() => handleTabClick(tab.key)} badge={tab.badge}/>
                  ))}
                </div>
                <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none md:hidden" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {submissionsData === undefined ? (
              <TableSkeleton />
            ) : (
              <DashboardForm
                submissions={displaySubmissions}
                isAdmin={!!isAdmin}
                currentStatusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                isFilterable={!searchQuery && activeTab !== 'needsReview' && activeTab !== 'feedback'}
                onViewSubmission={handleViewSubmission}
              />
            )}
          </div>
        </div>
      </div>
      
      <SubmissionDetailsModal
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      />
    </div>
  );
}