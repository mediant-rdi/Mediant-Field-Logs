// app/dashboard/call-logs/page.tsx
'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Doc } from '../../../../convex/_generated/dataModel';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

type EnrichedCallLog = Doc<"callLogs"> & {
  clientName: string;
  engineers: string[];
};

// Debounce hook to prevent rapid-fire queries
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Resolved': return 'bg-green-100 text-green-800';
    case 'Pending': return 'bg-yellow-100 text-yellow-800';
    case 'In Progress': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// A responsive loading skeleton component.
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

// Memoized component for the mobile card view.
const CallLogCard = React.memo(function CallLogCard({ log }: { log: EnrichedCallLog }) {
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
      <div className="mt-4 flex items-center justify-end gap-x-6">
        {/* Placeholder for future actions */}
        <Link
          href={`/dashboard/call-logs/${log._id}`} // Example: Link to a details page
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
});

// Memoized component for the desktop table row.
const CallLogRow = React.memo(function CallLogRow({ log }: { log: EnrichedCallLog }) {
  return (
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
      <td className="px-4 py-3 text-right">
        {/* Placeholder for future actions */}
        <Link
          href={`/dashboard/call-logs/${log._id}`} // Example: Link to a details page
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          View
        </Link>
      </td>
    </tr>
  );
});

// Responsive component to display the call log data.
function CallLogsDataTable({
  callLogs,
  isAdmin,
  searchText,
}: {
  callLogs: EnrichedCallLog[] | undefined;
  isAdmin: boolean;
  searchText: string;
}) {
  if (callLogs === undefined) {
    return <TableSkeleton />;
  }

  if (callLogs.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <h3 className="text-lg font-medium text-gray-900">
          {searchText ? "No Call Logs Found" : "No Call Logs Available"}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchText
            ? `No logs match your search for "${searchText}".`
            : "Get started by adding a new call log."}
        </p>
        {isAdmin && !searchText && (
          <div className="mt-6">
            <Link href="/dashboard/call-logs/add" className="bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
              + Add New Log
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {callLogs.map((log) => <CallLogCard key={log._id} log={log} />)}
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
            {callLogs.map((log) => <CallLogRow key={log._id} log={log} />)}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function ViewCallLogsPage() {
  const currentUser = useQuery(api.users.current);
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 300);

  const callLogs = useQuery(
    api.callLogs.searchCallLogs,
    { searchText: debouncedSearchText }
  );

  if (currentUser === undefined) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="animate-pulse flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <div className="h-7 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mt-2"></div>
          </div>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const isAdmin = currentUser?.isAdmin === true;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Call Log Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            A list of all support calls in the system.
          </p>
        </div>
        {isAdmin && (
          <div className="self-start sm:self-auto">
            <Link href="/dashboard/call-logs/add" className="bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
              + Add New Log
            </Link>
          </div>
        )}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by client, issue, engineer..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full sm:w-72 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <CallLogsDataTable callLogs={callLogs} isAdmin={isAdmin} searchText={searchText} />
      </div>
    </div>
  );
}