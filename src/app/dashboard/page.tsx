// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { DashboardForm, EnrichedReport, StatusFilter, FeedbackStatusFilter } from '@/components/forms/DashboardForm';
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
  ChevronDown,
  Check
} from 'lucide-react';
import Fuse from 'fuse.js';

// Debounce hook remains the same.
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Other components (Modal, Cards, Skeletons) remain the same.
const SubmissionDetailsModal = dynamic(() => import('@/components/modals/SubmissionDetailsModal'), { ssr: false });
type DashboardStatsType = { isAdmin: boolean; pendingCount: number; submissionsTodayCount: number };
const SummaryCard = ({ title, count, icon: Icon, color, trend, onClick }: { title: string; count?: number; icon: React.ComponentType<{ className?: string }>; color: string; trend?: { value: number; label: string }; onClick?: () => void; }) => (
  <div onClick={onClick} className={`relative overflow-hidden bg-white rounded-xl border border-gray-200 p-6 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-gray-300 hover:scale-105' : ''}`}>
    <div className="flex items-center justify-between"><div className="space-y-2"><p className="text-sm font-medium text-gray-600">{title}</p><p className="text-3xl font-bold text-gray-900">{count === undefined ? (<span className="inline-block w-8 h-8 bg-gray-200 rounded animate-pulse"></span>) : (count)}</p>{trend && (<div className="flex items-center gap-1 text-xs text-gray-500"><TrendingUp className="w-3 h-3" /><span>{trend.label}</span></div>)}</div><div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '50')}`}><Icon className={`w-6 h-6 ${color}`} /></div></div>
  </div>
);
const StatsSkeleton = () => <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">{[...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"><div className="flex items-center justify-between"><div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-24"></div><div className="h-8 bg-gray-200 rounded w-16"></div></div><div className="w-12 h-12 bg-gray-200 rounded-full"></div></div></div>)}</div>;
const TableSkeleton = () => <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-200 rounded-lg"></div><div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-20"></div><div className="h-3 bg-gray-200 rounded w-16"></div></div></div><div className="h-6 bg-gray-200 rounded-full w-16"></div></div><div className="space-y-2 mb-4"><div className="h-4 bg-gray-200 rounded w-full"></div><div className="h-4 bg-gray-200 rounded w-3/4"></div></div><div className="h-8 bg-gray-200 rounded w-24"></div></div>)}</div>;

export type TabType = 'complaints' | 'feedback' | 'serviceReports' | 'needsReview' | null;

const DashboardStats = React.memo(function DashboardStats({ stats, onReviewClick }: { stats: DashboardStatsType | undefined; onReviewClick: () => void; }) {
  if (stats === undefined) return <StatsSkeleton />;
  if (!stats.isAdmin) return null;
  const cards = [{title: "Pending Reviews",count: stats.pendingCount,icon: AlertCircle,color: "text-amber-600",onClick: onReviewClick},{title: "Today's Submissions",count: stats.submissionsTodayCount,icon: Activity,color: "text-blue-600"}];
  return (<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">{cards.map((card, index) => (<SummaryCard key={index} {...card} />))}</div>);
});

type DropdownOption = { key: TabType; label: string; icon: React.ComponentType<{className?: string}> };
const CategoryDropdown = ({ options, selected, onSelect }: { options: DropdownOption[]; selected: TabType; onSelect: (key: TabType) => void; }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.key === selected) || { label: "View Category" };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto justify-between">
        <span>{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {options.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => { onSelect(key!); setIsOpen(false); }} className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-gray-500" />{label}</div>
                {selected === key && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<EnrichedReport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- MODIFIED: State for both types of filters ---
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<FeedbackStatusFilter>('all');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const statsData = useQuery(api.dashboard.getDashboardStats);
  const isAdmin = statsData?.isAdmin;

  // --- MODIFIED: Conditionally pass the correct filter to the backend ---
  const submissionsData = useQuery(api.dashboard.getFilteredSubmissions, {
    tab: activeTab,
    statusFilter: activeTab === 'complaints' || activeTab === 'serviceReports' ? statusFilter : undefined,
    feedbackStatusFilter: activeTab === 'feedback' ? feedbackStatusFilter : undefined,
    searchQuery: debouncedSearchQuery,
  });

  const rawSubmissions = useMemo(() => (submissionsData?.submissions ?? []) as EnrichedReport[], [submissionsData]);
  
  const fuse = useMemo(() => {
    if (!rawSubmissions.length) return null;
    return new Fuse(rawSubmissions, { keys: ['mainText', 'locationName', 'machineName', 'submitterName'], includeScore: true, threshold: 0.4, minMatchCharLength: 2 });
  }, [rawSubmissions]);

  const displaySubmissions = useMemo(() => {
    if (searchQuery.trim() && fuse) {
      return fuse.search(searchQuery.trim()).map((result) => result.item);
    }
    return rawSubmissions;
  }, [searchQuery, rawSubmissions, fuse]);

  useEffect(() => {
    if (activeTab === null && isAdmin !== undefined && !debouncedSearchQuery) {
      setActiveTab(isAdmin ? 'needsReview' : 'serviceReports');
    }
  }, [isAdmin, activeTab, debouncedSearchQuery]);

  // --- MODIFIED: Reset both filters when tab changes ---
  useEffect(() => {
    if(!debouncedSearchQuery) { 
      setStatusFilter('all'); 
      setFeedbackStatusFilter('all');
    }
  }, [activeTab, debouncedSearchQuery]);
  
  useEffect(() => {
    if (debouncedSearchQuery) { setActiveTab(null); }
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

  const categoryTabs = [
    {key: 'serviceReports' as TabType, icon: Settings, label: 'Engineer Complaint'},
    {key: 'complaints' as TabType, icon: MessageSquare, label: 'Customer Complaints'},
    ...(isAdmin ? [{key: 'feedback' as TabType, icon: FileText, label: 'Feedback'}] : [])
  ];

  const nonAdminTabs = [
    {key: 'serviceReports' as TabType, icon: Settings, label: 'Engineer Complaint'},
    {key: 'complaints' as TabType, icon: MessageSquare, label: 'Customer Complaints'}
  ];
  
  // --- MODIFIED: Determine which filter should be shown ---
  const isComplaintFilterable = !searchQuery && (activeTab === 'complaints' || activeTab === 'serviceReports');
  const isFeedbackFilterable = !searchQuery && activeTab === 'feedback';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">{statsData === undefined ? 'Loading...' : isAdmin ? "Monitor submissions and manage your team's activity." : "Track your submissions and view approved company reports."}</p>
        </header>

        {isAdmin && <DashboardStats stats={statsData} onReviewClick={handleReviewClick} />}

        <main className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              
              {isAdmin ? (
                <div className="w-full flex flex-col sm:flex-row gap-2 items-center">
                  <button onClick={handleReviewClick} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all w-full sm:w-auto justify-center ${activeTab === 'needsReview' ? 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}>
                    <AlertCircle className="w-4 h-4" />
                    <span>Needs Review</span>
                    {statsData?.pendingCount !== undefined && statsData.pendingCount > 0 && (
                      <span className="ml-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                        {statsData.pendingCount}
                      </span>
                    )}
                  </button>
                  <CategoryDropdown options={categoryTabs} selected={activeTab} onSelect={handleTabClick} />
                  <div className="relative flex-grow w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" placeholder="Search problems, clients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    {searchQuery && (<div className="absolute inset-y-0 right-0 pr-3 flex items-center"><button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button></div>)}
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                    {nonAdminTabs.map((tab) => (
                      <button key={tab.key} onClick={() => handleTabClick(tab.key)} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === tab.key ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                          <tab.icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full md:max-w-xs ml-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" placeholder="Search approved reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    {searchQuery && (<div className="absolute inset-y-0 right-0 pr-3 flex items-center"><button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button></div>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {submissionsData === undefined ? (
              <TableSkeleton />
            ) : (
              // --- MODIFIED: Pass all filter states and handlers to the form ---
              <DashboardForm 
                submissions={displaySubmissions} 
                isAdmin={!!isAdmin} 
                currentStatusFilter={statusFilter} 
                onStatusFilterChange={setStatusFilter}
                currentFeedbackStatusFilter={feedbackStatusFilter}
                onFeedbackStatusFilterChange={setFeedbackStatusFilter}
                isComplaintFilterable={isComplaintFilterable}
                isFeedbackFilterable={isFeedbackFilterable}
                onViewSubmission={handleViewSubmission}
                activeTab={activeTab}
              />
            )}
          </div>
        </main>
      </div>
      
      <SubmissionDetailsModal submission={selectedSubmission} onClose={() => setSelectedSubmission(null)} />
    </div>
  );
}