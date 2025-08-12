// app/dashboard/call-logs/page.tsx
'use client';

// --- MODIFICATION: Import the new protection component ---
import CallLogProtection from '@/components/CallLogAccessProtection';
import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Doc, Id } from '../../../../../convex/_generated/dataModel';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, UserPlus } from 'lucide-react';

// ... (rest of the components: useDebounce, getStatusBadge, TableSkeleton, etc. are unchanged)
type EnrichedCallLog = Doc<"callLogs"> & {
  clientName: string;
  engineers: string[];
};

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
    case 'Escalated': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

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

const AssignEngineerControl = ({ job, onAssign, onCancel, isProcessing }: { job: EnrichedCallLog; onAssign: (newEngineerId: Id<"users">) => void; onCancel: () => void; isProcessing: boolean; }) => {
    const [search, setSearch] = useState('');
    const results = useQuery(api.users.searchEngineers, search ? { searchText: search } : 'skip');
    const availableEngineers = results?.filter(eng => !job.engineerIds.includes(eng._id));
  
    return (
      <div className="w-full p-4 bg-red-50 border-t border-red-200">
        <h4 className="font-semibold text-red-800 mb-2">Assign New Engineer:</h4>
        <div className="relative">
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for an engineer..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            disabled={isProcessing}
          />
          {isProcessing && <Loader2 className="absolute right-2 top-2.5 w-5 h-5 animate-spin text-gray-400" />}
          {availableEngineers && availableEngineers.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border mt-1 rounded-md shadow-lg max-h-40 overflow-auto">
              {availableEngineers.map(eng => (
                <li key={eng._id}
                    onClick={() => onAssign(eng._id)}
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                >{eng.name}</li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={onCancel} disabled={isProcessing} className="mt-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
      </div>
    );
};

const CallLogRow = React.memo(function CallLogRow({ log }: { log: EnrichedCallLog }) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const assignEngineer = useMutation(api.callLogs.assignEscalatedEngineer);
  const needsAssignment = 
    log.status === 'Escalated' &&
    (log.engineersAtEscalation === undefined || log.engineersAtEscalation === log.engineerIds.length);

  const handleAssign = async (newEngineerId: Id<"users">) => {
    setIsProcessing(true);
    try {
      await assignEngineer({ callLogId: log._id, newEngineerId });
      setIsAssigning(false); 
    } catch(err) {
      alert(err instanceof Error ? err.message : "Failed to assign engineer");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <tr className={needsAssignment && !isAssigning ? 'bg-red-50' : ''}>
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
          {needsAssignment ? (
              <button 
                onClick={() => setIsAssigning(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md shadow-sm hover:bg-red-700"
              >
                  <UserPlus className="w-4 h-4" /> Assign
              </button>
          ) : (
              <Link href={`/dashboard/call-logs/${log._id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                  View
              </Link>
          )}
        </td>
      </tr>
      {isAssigning && (
          <tr>
              <td colSpan={6} className="p-2">
                  <AssignEngineerControl 
                    job={log} 
                    onAssign={handleAssign} 
                    onCancel={() => setIsAssigning(false)}
                    isProcessing={isProcessing} 
                  />
              </td>
          </tr>
      )}
    </>
  );
});

const CallLogCard = React.memo(function CallLogCard({ log }: { log: EnrichedCallLog }) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const assignEngineer = useMutation(api.callLogs.assignEscalatedEngineer);

  const needsAssignment = 
    log.status === 'Escalated' &&
    (log.engineersAtEscalation === undefined || log.engineersAtEscalation === log.engineerIds.length);

  const handleAssign = async (newEngineerId: Id<"users">) => {
    setIsProcessing(true);
    try {
      await assignEngineer({ callLogId: log._id, newEngineerId });
      setIsAssigning(false);
    } catch(err) {
      alert(err instanceof Error ? err.message : "Failed to assign engineer");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`border rounded-lg shadow-sm flex flex-col justify-between ${needsAssignment && !isAssigning ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
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
      <div className="p-4 pt-0">
        {isAssigning ? (
          <AssignEngineerControl 
            job={log} 
            onAssign={handleAssign} 
            onCancel={() => setIsAssigning(false)} 
            isProcessing={isProcessing} 
          />
        ) : (
          <div className="flex items-center justify-end">
            {needsAssignment ? (
              <button 
                onClick={() => setIsAssigning(true)} 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700"
              >
                <UserPlus className="w-4 h-4" /> Assign Engineer
              </button>
            ) : (
              <Link href={`/dashboard/call-logs/${log._id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                View Details →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

function CallLogsDataTable({ callLogs, isAdmin, searchText, }: { callLogs: EnrichedCallLog[] | undefined; isAdmin: boolean; searchText: string; }) {
  if (callLogs === undefined) {
    return <TableSkeleton />;
  }
  if (callLogs.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <h3 className="text-lg font-medium text-gray-900">{searchText ? "No Call Logs Found" : "No Call Logs Available"}</h3>
        <p className="mt-1 text-sm text-gray-500">{searchText ? `No logs match your search for "${searchText}".` : "Get started by adding a new call log."}</p>
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
    </>
  );
}

// Main page component wrapped in protection
export default function ViewCallLogsPage() {
  return (
    // --- MODIFICATION: Wrap the entire page content ---
    <CallLogProtection>
      <PageContent />
    </CallLogProtection>
  );
}

// Extracted the original page content into its own component
function PageContent() {
  const currentUser = useQuery(api.users.current);
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 300);
  const callLogs = useQuery(api.callLogs.searchCallLogs, { searchText: debouncedSearchText });

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
          <p className="mt-1 text-sm text-gray-600">A list of all support calls in the system.</p>
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