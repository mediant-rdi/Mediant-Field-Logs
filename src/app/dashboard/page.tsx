// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { DashboardForm, EnrichedReport, ComplaintStatusFilter, FeedbackStatusFilter } from '@/components/forms/DashboardForm';
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
  Check,
  Loader2,
  ListChecks,
  AlertTriangle,
} from 'lucide-react';
import { Doc } from '../../../convex/_generated/dataModel';
import { format } from 'date-fns';
import Link from 'next/link';
import { useAccurateLocation } from '@/hooks/useAccurateLocation';


// --- HELPER COMPONENTS & TYPES FOR THE CALL LOG TABLE ---

type EnrichedCallLog = Doc<"callLogs"> & {
  clientName: string;
  engineers: string[];
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Resolved': return 'bg-green-100 text-green-800';
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'In Progress': return 'bg-blue-100 text-blue-800';
    case 'Escalated': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const TableSkeleton = () => (
  <div className="animate-pulse">
    <div className="space-y-3 md:hidden">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-40 rounded-lg bg-gray-200"></div>
      ))}
    </div>
    <div className="hidden md:block">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-12 rounded bg-gray-200 mb-2"></div>
      ))}
    </div>
  </div>
);


const CallLogCard = React.memo(function CallLogCard({ log, currentUser }: { log: EnrichedCallLog; currentUser: Doc<"users"> | null }) {
  const acceptJobMutation = useMutation(api.callLogs.acceptJob);
  const finishJobMutation = useMutation(api.callLogs.finishJob);
  // --- FIXED: Use the correct mutation ---
  const requestEscalationMutation = useMutation(api.callLogs.requestEscalation);
  const { getLocation, isGettingLocation } = useAccurateLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJobAction = async (action: 'accept' | 'finish' | 'escalate') => {
    setIsSubmitting(true);
    try {
      if (action === 'escalate') {
        if (window.confirm("Are you sure you want to escalate this job? An admin will need to assign a new engineer.")) {
          await requestEscalationMutation({ callLogId: log._id });
        }
      } else {
        const position = await getLocation();
        const payload = {
          callLogId: log._id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        if (action === 'accept') await acceptJobMutation(payload);
        if (action === 'finish') await finishJobMutation(payload);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isGettingLocation || isSubmitting;
  const isUserAccepted = !!currentUser?._id && !!log.acceptedBy?.includes(currentUser._id);

  return (
    <div className="bg-gray-50 p-4 border rounded-lg shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start">
            <span className="font-semibold text-gray-900">{log.clientName}</span>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(log.status)}`}>
              {log.status}
            </span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{format(new Date(log._creationTime), 'dd MMMM yyyy')}</p>
        <p className="mt-2 text-sm text-gray-700 truncate" title={log.issue}>
          <span className="font-medium">Issue:</span> {log.issue}
        </p>
        <p className="mt-1 text-sm text-gray-700">
          <span className="font-medium">Engineers:</span> {log.engineers.join(', ')}
        </p>
      </div>
      <div className="mt-4 flex flex-col items-end gap-2">
        <div className="flex items-center justify-end gap-x-2 w-full">
            {(log.status === 'Pending' || (log.status === 'Escalated' && !isUserAccepted)) && (
            <button onClick={() => handleJobAction('accept')} disabled={isLoading} className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGettingLocation ? 'Locating...' : 'Accept Job'}
            </button>
            )}
            {log.status === 'In Progress' && (
                <>
                <button onClick={() => handleJobAction('finish')} disabled={isLoading} className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Finish Job
                </button>
                {!log.isEscalated && (
                    <button onClick={() => handleJobAction('escalate')} disabled={isLoading} className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <AlertTriangle className="mr-2 h-4 w-4" /> Escalate
                    </button>
                )}
                </>
            )}
            {log.status === 'Resolved' && (
            <Link href={`/dashboard/call-logs/${log._id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                View Details →
            </Link>
            )}
        </div>
      </div>
    </div>
  );
});

const CallLogRow = React.memo(function CallLogRow({ log, currentUser }: { log: EnrichedCallLog; currentUser: Doc<"users"> | null }) {
  const acceptJobMutation = useMutation(api.callLogs.acceptJob);
  const finishJobMutation = useMutation(api.callLogs.finishJob);
  // --- FIXED: Use the correct mutation ---
  const requestEscalationMutation = useMutation(api.callLogs.requestEscalation);
  const { getLocation, isGettingLocation } = useAccurateLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJobAction = async (action: 'accept' | 'finish' | 'escalate') => {
    setIsSubmitting(true);
    try {
      if (action === 'escalate') {
        if(window.confirm("Are you sure you want to escalate this job? An admin will need to assign a new engineer.")){
           await requestEscalationMutation({ callLogId: log._id });
        }
      } else {
        const position = await getLocation();
        const payload = {
          callLogId: log._id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        if (action === 'accept') await acceptJobMutation(payload);
        if (action === 'finish') await finishJobMutation(payload);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isGettingLocation || isSubmitting;
  const isUserAccepted = !!currentUser?._id && !!log.acceptedBy?.includes(currentUser._id);

  return (
    <>
    <tr>
      <td className="px-4 py-3 text-sm text-gray-600">{format(new Date(log._creationTime), 'dd MMM yyyy')}</td>
      <td className="px-4 py-3 font-medium text-gray-900">{log.clientName}</td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-sm truncate" title={log.issue}>{log.issue}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{log.engineers.join(', ')}</td>
      <td className="px-4 py-3">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(log.status)}`}>
          {log.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right space-x-2">
        {(log.status === 'Pending' || (log.status === 'Escalated' && !isUserAccepted)) && (
          <button onClick={() => handleJobAction('accept')} disabled={isLoading} className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            {isLoading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {isGettingLocation ? 'Locating...' : 'Accept'}
          </button>
        )}
        {log.status === 'In Progress' && (
          <>
            <button onClick={() => handleJobAction('finish')} disabled={isLoading} className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              {isLoading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Finish
            </button>
            {!log.isEscalated && (
                <button onClick={() => handleJobAction('escalate')} disabled={isLoading} className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    {isLoading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                    <AlertTriangle className="mr-1 h-4 w-4" /> Escalate
                </button>
            )}
          </>
        )}
        {log.status === 'Resolved' && (
          <Link href={`/dashboard/call-logs/${log._id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            View
          </Link>
        )}
      </td>
    </tr>
    </>
  );
});

function CallLogsDataTable({
  callLogs,
  currentUser,
}: {
  callLogs: EnrichedCallLog[] | undefined;
  currentUser: Doc<"users"> | null;
}) {
  if (callLogs === undefined) {
    return <TableSkeleton />;
  }
  if (callLogs.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <h3 className="text-lg font-medium text-gray-900">No Assigned Jobs</h3>
        <p className="mt-1 text-sm text-gray-500">
          You have not been assigned to any jobs yet.
        </p>
      </div>
    );
  }
  return (
    <>
      <div className="space-y-4 md:hidden">
        {callLogs.map((log) => <CallLogCard key={log._id} log={log} currentUser={currentUser} />)}
      </div>
      <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase tracking-wider text-xs">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Bank + Branch</th>
              <th className="px-4 py-3 font-medium">Issue</th>
              <th className="px-4 py-3 font-medium">Engineers</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {callLogs.map((log) => <CallLogRow key={log._id} log={log} currentUser={currentUser} />)}
          </tbody>
        </table>
      </div>
    </>
  );
}

// --- STANDARD DASHBOARD HELPER COMPONENTS (UNCHANGED) ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
const SubmissionDetailsModal = dynamic(() => import('@/components/modals/SubmissionDetailsModal'), { ssr: false });
type DashboardStatsType = { isAdmin: boolean; pendingCount: number; submissionsTodayCount: number };
const SummaryCard = ({ title, count, icon: Icon, color, trend, onClick }: { title: string; count?: number; icon: React.ComponentType<{ className?: string }>; color: string; trend?: { value: number; label: string }; onClick?: () => void; }) => ( <div onClick={onClick} className={`relative overflow-hidden bg-white rounded-xl border border-gray-200 p-6 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg hover:border-gray-300 hover:scale-105' : ''}`}><div className="flex items-center justify-between"><div className="space-y-2"><p className="text-sm font-medium text-gray-600">{title}</p><p className="text-3xl font-bold text-gray-900">{count === undefined ? (<span className="inline-block w-8 h-8 bg-gray-200 rounded animate-pulse"></span>) : (count)}</p>{trend && (<div className="flex items-center gap-1 text-xs text-gray-500"><TrendingUp className="w-3 h-3" /><span>{trend.label}</span></div>)}</div><div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '50')}`}><Icon className={`w-6 h-6 ${color}`} /></div></div></div>);
const StatsSkeleton = () => <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">{[...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"><div className="flex items-center justify-between"><div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-24"></div><div className="h-8 bg-gray-200 rounded w-16"></div></div><div className="w-12 h-12 bg-gray-200 rounded-full"></div></div></div>)}</div>;
const AdminTableSkeleton = () => <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gray-200 rounded-lg"></div><div className="space-y-2"><div className="h-4 bg-gray-200 rounded w-20"></div><div className="h-3 bg-gray-200 rounded w-16"></div></div></div><div className="h-6 bg-gray-200 rounded-full w-16"></div></div><div className="space-y-2 mb-4"><div className="h-4 bg-gray-200 rounded w-full"></div><div className="h-4 bg-gray-200 rounded w-3/4"></div></div><div className="h-8 bg-gray-200 rounded w-24"></div></div>)}</div>;
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
  useEffect(() => { const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, [dropdownRef]);
  return ( <div className="relative" ref={dropdownRef}><button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full justify-between"><span>{selectedOption.label}</span><ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></button>{isOpen && ( <div className="absolute z-10 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"><div className="py-1">{options.map(({ key, label, icon: Icon }) => ( <button key={key} onClick={() => { onSelect(key!); setIsOpen(false); }} className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"><div className="flex items-center gap-2"><Icon className="w-4 h-4 text-gray-500" />{label}</div>{selected === key && <Check className="w-4 h-4 text-blue-600" />}</button>))}</div></div>)}</div>);
};


// =================================================================
// THE MAIN DASHBOARD PAGE
// =================================================================
export default function DashboardPage() {
  const currentUser = useQuery(api.users.current);
  const isAdmin = currentUser?.isAdmin ?? false;

  const assignedJobs = useQuery(
    api.callLogs.getMyAssignedJobs,
    currentUser ? {} : 'skip' 
  );
  
  // --- MODIFICATION: State and memo to handle visible jobs ---
  const [visibleJobsCount, setVisibleJobsCount] = useState(3);

  const latestAssignedJobs = useMemo(() => {
    return assignedJobs?.slice(0, visibleJobsCount);
  }, [assignedJobs, visibleJobsCount]);


  // --- State for the Admin portion of the dashboard ---
  const [activeTab, setActiveTab] = useState<TabType>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<EnrichedReport | null>(null);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<ComplaintStatusFilter>('all');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<FeedbackStatusFilter>('all');
  const debouncedAdminSearchQuery = useDebounce(adminSearchQuery, 300);
  
  const statsData = useQuery(api.dashboard.getDashboardStats, isAdmin ? {} : 'skip');
  const submissionsData = useQuery(api.dashboard.getFilteredSubmissions, {
    tab: activeTab,
    complaintStatusFilter: activeTab === 'complaints' || activeTab === 'serviceReports' ? complaintStatusFilter : undefined,
    feedbackStatusFilter: activeTab === 'feedback' ? feedbackStatusFilter : undefined,
    searchQuery: debouncedAdminSearchQuery,
  });
  const rawSubmissions = useMemo(() => (submissionsData?.submissions ?? []) as EnrichedReport[], [submissionsData]);
  const displaySubmissions = useMemo(() => rawSubmissions, [rawSubmissions]);
  useEffect(() => {
    if (activeTab === null && currentUser && !debouncedAdminSearchQuery) {
      setActiveTab(isAdmin ? 'needsReview' : 'serviceReports');
    }
  }, [currentUser, isAdmin, activeTab, debouncedAdminSearchQuery]);
  useEffect(() => { if(!debouncedAdminSearchQuery) { setComplaintStatusFilter('all'); setFeedbackStatusFilter('all'); } }, [activeTab, debouncedAdminSearchQuery]);
  useEffect(() => { if (debouncedAdminSearchQuery) { setActiveTab(null); } }, [debouncedAdminSearchQuery]);
  const handleReviewClick = useCallback(() => { setAdminSearchQuery(''); setActiveTab('needsReview'); }, []);
  const handleViewSubmission = useCallback((submission: EnrichedReport) => setSelectedSubmission(submission), []);
  const handleTabClick = (tabKey: TabType) => { setAdminSearchQuery(''); setActiveTab(tabKey); }
  const categoryTabs = [ {key: 'serviceReports' as TabType, icon: Settings, label: 'Engineer Complaint'}, {key: 'complaints' as TabType, icon: MessageSquare, label: 'Customer Complaints'}, ...(isAdmin ? [{key: 'feedback' as TabType, icon: FileText, label: 'Feedback'}] : []) ];
  const nonAdminTabs = [ {key: 'serviceReports' as TabType, icon: Settings, label: 'Engineer Complaint'}, {key: 'complaints' as TabType, icon: MessageSquare, label: 'Customer Complaints'} ];
  const isComplaintFilterable = !adminSearchQuery && (activeTab === 'complaints' || activeTab === 'serviceReports');
  const isFeedbackFilterable = !adminSearchQuery && activeTab === 'feedback';

  if (currentUser === undefined) {
      return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">View your assigned jobs and track other submissions.</p>
        </header>
        
        {isAdmin && <DashboardStats stats={statsData} onReviewClick={handleReviewClick} />}

        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between gap-4">
              <div className='flex items-center gap-3'>
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <ListChecks className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">My Assigned Jobs</h2>
                  <p className="text-sm text-gray-600">Showing the {latestAssignedJobs?.length ?? 0} most recent jobs assigned to you.</p>
                </div>
              </div>
              {isAdmin && (
                <Link href="/dashboard/call-logs/add" className="hidden md:inline-flex bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex-shrink-0">
                  + Add New Log
                </Link>
              )}
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <CallLogsDataTable callLogs={latestAssignedJobs} currentUser={currentUser} />
          </div>
          
          {/* --- MODIFICATION: "View More" button --- */}
          {assignedJobs && assignedJobs.length > 3 && visibleJobsCount === 3 && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 text-center">
              <button
                onClick={() => setVisibleJobsCount(6)}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                View More...
              </button>
            </div>
          )}
        </section>

        <main className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {isAdmin ? (
                 <div className="w-full flex flex-col sm:flex-row gap-2 items-center">
                  <button onClick={handleReviewClick} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all w-full sm:w-auto justify-center ${activeTab === 'needsReview' ? 'bg-blue-600 text-white hover:bg-blue-700 border border-transparent' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}><AlertCircle className="w-4 h-4" /><span>Needs Review</span>{statsData?.pendingCount !== undefined && statsData.pendingCount > 0 && (<span className="ml-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">{statsData.pendingCount}</span>)}</button>
                  <div className="w-full sm:w-56">
                    <CategoryDropdown options={categoryTabs} selected={activeTab} onSelect={handleTabClick} />
                  </div>
                  <div className="relative flex-grow w-full sm:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
                    <input type="text" placeholder="Search problems, clients, authors..." value={adminSearchQuery} onChange={(e) => setAdminSearchQuery(e.target.value)} className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    {adminSearchQuery && (<div className="absolute inset-y-0 right-0 pr-3 flex items-center"><button onClick={() => setAdminSearchQuery('')} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button></div>)}
                  </div>
                </div>
              ) : (
                 <div className="w-full flex flex-col md:flex-row gap-4 items-center">
                  <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>{nonAdminTabs.map((tab) => ( <button key={tab.key} onClick={() => handleTabClick(tab.key)} className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === tab.key ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}><tab.icon className="w-4 h-4" /><span>{tab.label}</span></button>))}</div>
                  <div className="relative w-full md:max-w-xs ml-auto"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div><input type="text" placeholder="Search approved reports..." value={adminSearchQuery} onChange={(e) => setAdminSearchQuery(e.target.value)} className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />{adminSearchQuery && (<div className="absolute inset-y-0 right-0 pr-3 flex items-center"><button onClick={() => setAdminSearchQuery('')} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button></div>)}</div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {submissionsData === undefined ? ( <AdminTableSkeleton /> ) : (
              <DashboardForm 
                submissions={displaySubmissions} 
                isAdmin={isAdmin} 
                currentComplaintStatusFilter={complaintStatusFilter} 
                onComplaintStatusFilterChange={setComplaintStatusFilter}
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