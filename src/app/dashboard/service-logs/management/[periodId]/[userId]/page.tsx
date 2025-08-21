// src/app/dashboard/service-logs/management/[periodId]/[userId]/page.tsx
'use client';

import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Loader2, CheckCircle, XCircle, Flag, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import React, { Suspense, use } from "react";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import ManagementDashboardProtection from "@/components/ManagementDashboardProtection";

type UserPeriodData = FunctionReturnType<typeof api.servicePeriods.getUserPeriodDetails>;
type EnrichedServiceLog = Exclude<UserPeriodData, null>['logs'][0];

const getStatusBadgeDetails = (status: string) => {
    switch (status) {
        case 'Finished': return <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"><CheckCircle className="h-3 w-3" />Finished</span>;
        case 'In Progress': return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"><Clock className="h-3 w-3" />In Progress</span>;
        case 'Pending': return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700"><Flag className="h-3 w-3" />Pending</span>;
        default: return <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"><XCircle className="h-3 w-3" />Unknown</span>;
    }
};

const LogDetailsTable = ({ logs }: { logs: EnrichedServiceLog[] }) => (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th scope="col" className="px-6 py-3">Site</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Start Time</th>
                    <th scope="col" className="px-6 py-3">Finish Time</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Details</span></th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                    <tr key={log._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.locationName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusBadgeDetails(log.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.jobStartTime ? format(new Date(log.jobStartTime), 'PPp') : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.jobEndTime ? format(new Date(log.jobEndTime), 'PPp') : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/dashboard/service-logs/${log._id}`} className="text-indigo-600 hover:text-indigo-900">View Details</Link>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const UserPeriodDetailsContent = ({ periodId, userId }: { periodId: Id<"servicePeriods">, userId: Id<"users"> }) => {
    const data = useQuery(api.servicePeriods.getUserPeriodDetails, { periodId, userId });

    if (data === undefined) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;
    if (data === null) return <div className="text-center p-8">Details not found. The user or period may not exist, or you may not have permission.</div>;

    const { period, user, logs } = data;

    return (
        <div>
            <nav className="flex items-center text-sm font-medium text-gray-500 mb-4">
                <Link href="/dashboard/service-logs/management" className="hover:text-gray-700">All Periods</Link>
                <span className="mx-2">/</span>
                <Link href={`/dashboard/service-logs/management/${period._id}`} className="hover:text-gray-700 truncate max-w-[200px]">{period.name}</Link>
                <span className="mx-2">/</span>
                <span className="text-gray-800 truncate max-w-[200px]">{user.name}</span>
            </nav>
            
            <div className="border-b border-gray-200 pb-5 mb-6">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">Service Logs for {user.name}</h1>
                <p className="mt-2 text-sm text-gray-500">
                    Showing {logs.length} assigned sites for the <span className="font-medium text-gray-700">{period.name}</span> service period.
                </p>
            </div>
            
            <LogDetailsTable logs={logs} />

            {logs.length === 0 && <p className="p-4 text-sm text-gray-500 bg-white rounded-lg border">This engineer had no logs assigned for this period.</p>}
        </div>
    );
};

export default function UserPeriodDetailsPage({ params }: { params: Promise<{ periodId: Id<"servicePeriods">, userId: Id<"users"> }> }) {
    const { periodId, userId } = use(params);

    return (
        <ManagementDashboardProtection>
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>}>
                <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                    <UserPeriodDetailsContent periodId={periodId} userId={userId} />
                </div>
            </Suspense>
        </ManagementDashboardProtection>
    );
}