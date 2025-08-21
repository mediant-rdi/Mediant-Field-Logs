// src/app/dashboard/call-logs/management/page.tsx
'use client';

import Link from 'next/link';
import { usePaginatedQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Doc } from '../../../../../convex/_generated/dataModel';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Phone, Search, Inbox, Loader2 } from 'lucide-react';
import ManagementDashboardProtection from '@/components/ManagementDashboardProtection';
import dynamic from 'next/dynamic';
// MODIFICATION: Changed path to use a root-level alias for robustness
import { getStatusBadge, ChartSkeleton } from '@/app/dashboard/call-logs/_components/shared';

type EnrichedCallLog = Doc<"callLogs"> & {
  clientName: string;
  engineers: string[];
};

// MODIFICATION: Dynamically import the chart using the corrected path
const DynamicCallLogChart = dynamic(() => import('@/app/dashboard/call-logs/_components/shared').then(mod => mod.CallLogChart), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

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

const TableSkeleton = () => (
  <div className="animate-pulse">
    <div className="space-y-3 md:hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-40 rounded-lg bg-gray-200"></div>
      ))}
    </div>
    <div className="hidden md:block">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 rounded bg-gray-200 mb-2"></div>
      ))}
    </div>
  </div>
);

// Simplified Row Component for Management View (No Assign Functionality)
const CallLogRow = React.memo(function CallLogRow({ log }: { log: EnrichedCallLog }) {
  return (
    <tr>
      <td className="px-4 py-3 text-sm text-gray-600">{format(new Date(log._creationTime), 'dd MMM yyyy')}</td>
      <td className="px-4 py-3 font-medium text-gray-900">{log.clientName}</td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-sm truncate" title={log.issue}>{log.issue}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{log.engineers.join(', ')}</td>
      <td className="px-4 py-3">
        <span className={`px-2 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusBadge(log.status)}`}>
          {log.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <Link href={`/dashboard/call-logs/${log._id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
            View
        </Link>
      </td>
    </tr>
  );
});

// Simplified Card Component for Management View (No Assign Functionality)
const CallLogCard = React.memo(function CallLogCard({ log }: { log: EnrichedCallLog }) {
  return (
    <div className="border rounded-lg shadow-sm bg-gray-50">
      <div className="p-4">
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
      <div className="p-4 pt-0 flex items-center justify-end">
        <Link href={`/dashboard/call-logs/${log._id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
          View Details →
        </Link>
      </div>
    </div>
  );
});

function CallLogsDataTable({
  callLogs,
  searchText,
  status,
  loadMore,
}: {
  callLogs: EnrichedCallLog[];
  searchText: string;
  status: 'LoadingFirstPage' | 'CanLoadMore' | 'LoadingMore' | 'Exhausted';
  loadMore: () => void;
}) {
  if (status === 'LoadingFirstPage') {
    return <TableSkeleton />;
  }

  if (callLogs.length === 0) {
    return (
        <div className="text-center py-16 px-6">
            <Inbox className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">{searchText ? 'No Matching Logs' : 'No Call Logs Found'}</h3>
            <p className="mt-1 text-sm text-gray-500">{searchText ? `Your search for "${searchText}" did not return any results.` : 'There are no call logs in the system yet.'}</p>
        </div>
    );
  }

  return (
    <>
      <div className="space-y-4 md:hidden">{callLogs.map((log) => <CallLogCard key={log._id} log={log} />)}</div>
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
          <tbody className="divide-y divide-gray-100">{callLogs.map((log) => <CallLogRow key={log._id} log={log} />)}</tbody>
        </table>
      </div>
      {status === 'CanLoadMore' && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={loadMore}
            className="bg-gray-100 text-gray-800 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
      {status === 'LoadingMore' && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}
    </>
  );
}

export default function CallLogManagementPage() {
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 300);
  const { results: callLogs, status, loadMore } = usePaginatedQuery(
    api.callLogs.searchCallLogs,
    { searchText: debouncedSearchText },
    { initialNumItems: 10 }
  );

  return (
    <ManagementDashboardProtection>
      <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <DynamicCallLogChart />

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                  <Phone className="w-8 h-8 text-gray-700" />
                  <div>
                      <h1 className="text-2xl font-bold text-gray-900">Call Log Records</h1>
                      <p className="mt-1 text-sm text-gray-600">Search and review all call logs raised in the system.</p>
                  </div>
              </div>
              <div className="relative mt-2 sm:mt-0 w-full sm:w-72">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                      type="search"
                      placeholder="Search by client, issue, engineer..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
              </div>
          </div>
          
          <div>
            <CallLogsDataTable
              callLogs={callLogs}
              searchText={searchText}
              status={status}
              loadMore={() => loadMore(10)}
            />
          </div>
        </div>
      </div>
    </ManagementDashboardProtection>
  );
}