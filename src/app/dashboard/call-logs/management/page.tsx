// src/app/dashboard/call-logs/management/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Phone, Search, ServerCrash, Inbox } from 'lucide-react';
import { format } from 'date-fns';

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'Pending': return 'bg-amber-100 text-amber-800';
    case 'In Progress': return 'bg-blue-100 text-blue-800';
    case 'Resolved': return 'bg-green-100 text-green-800';
    case 'Escalated': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const TableSkeleton = () => (
    <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-3/4 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-1/2 bg-gray-200 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-3/4 bg-gray-200 rounded"></div></td>
                </tr>
            ))}
            </tbody>
        </table>
    </div>
);

export default function CallLogManagementPage() {
    const [searchText, setSearchText] = useState('');
    // NOTE: This uses the `searchCallLogs` query. It is assumed this query
    // does not have any special permission checks for this management view.
    const callLogs = useQuery(api.callLogs.searchCallLogs, { searchText });

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Phone className="w-8 h-8 text-gray-700" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Call Log Records</h1>
                        <p className="mt-1 text-sm text-gray-600">Search and review all call logs raised in the system.</p>
                    </div>
                </div>
                <div className="relative mt-2 sm:mt-0 w-full sm:w-64">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="search"
                        placeholder="Search logs..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {callLogs === undefined && <TableSkeleton />}

                {callLogs === null && (
                    <div className="text-center py-16 px-6">
                        <ServerCrash className="mx-auto h-12 w-12 text-red-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">Could Not Load Call Logs</h3>
                        <p className="mt-1 text-sm text-gray-500">There was an error fetching the records. You may not have permission to view them.</p>
                    </div>
                )}

                {callLogs && callLogs.length === 0 && (
                    <div className="text-center py-16 px-6">
                        <Inbox className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">{searchText ? 'No Matching Logs' : 'No Call Logs Found'}</h3>
                        <p className="mt-1 text-sm text-gray-500">{searchText ? `Your search for "${searchText}" did not return any results.` : 'There are no call logs in the system yet.'}</p>
                    </div>
                )}
                
                {callLogs && callLogs.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location / Date</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engineers</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {callLogs.map((log) => (
                                    <tr key={log._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{log.clientName}</div>
                                            <div className="text-xs text-gray-500">{format(log._creationTime, 'dd MMM yyyy, h:mm a')}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-sm">{log.issue}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusBadgeStyle(log.status)}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.engineers.join(', ')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}