'use client';

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Loader2, History, CheckCircle, XCircle, ChevronRight, ServerCrash } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Suspense } from "react";

const StatusBadge = ({ isActive }: { isActive: boolean }) => {
    if (isActive) {
        return <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"><CheckCircle className="h-3 w-3" />Active</span>;
    }
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"><XCircle className="h-3 w-3" />Finished</span>;
};

const PeriodsListPage = () => {
    const periods = useQuery(api.servicePeriods.listAll);

    if (periods === undefined) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <ul className="divide-y divide-gray-200">
                    {[...Array(3)].map((_, i) => (
                        <li key={i} className="px-4 py-4 sm:px-6 animate-pulse">
                            <div className="flex items-center justify-between"><div className="w-1/3 h-5 bg-gray-300 rounded"></div><div className="w-1/4 h-5 bg-gray-200 rounded"></div></div>
                            <div className="mt-2 flex items-center justify-between"><div className="w-1/4 h-4 bg-gray-200 rounded"></div><div className="w-1/5 h-4 bg-gray-200 rounded"></div></div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
    
    if (periods === null) {
        return (
            <div className="text-center py-16 px-6 bg-white rounded-lg border">
                <ServerCrash className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Could Not Load Records</h3>
                <p className="mt-1 text-sm text-gray-500">There was an error fetching the service records. You may not have permission to view them.</p>
            </div>
        );
    }

    if (periods.length === 0) {
        return (
            <div className="text-center py-16 px-6 bg-white rounded-lg border">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">No History Yet</h3>
                <p className="mt-1 text-sm text-gray-500">No service periods have been activated in the system yet.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <ul role="list" className="divide-y divide-gray-200">
                {periods.map((period) => (
                    <li key={period._id}>
                        <Link href={`/dashboard/service-logs/management/${period._id}`} className="block hover:bg-gray-50 transition-colors">
                            <div className="flex items-center px-4 py-4 sm:px-6">
                                <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div className="truncate">
                                        <p className="text-sm font-medium text-indigo-600 truncate">{period.name}</p>
                                        <p className="mt-2 flex items-center text-sm text-gray-500">Started: {format(new Date(period.startDate), 'dd MMMM yyyy')}</p>
                                    </div>
                                    <div className="mt-4 flex-shrink-0 sm:mt-0 sm:ml-5">
                                        <div className="flex items-center gap-x-4">
                                            <div className="hidden sm:block text-right">
                                                <p className="text-sm text-gray-500">{period.logsCreated} logs</p>
                                                <p className="mt-2"><StatusBadge isActive={period.isActive} /></p>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default function ServiceRecordsManagementPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>}>
            <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <History className="w-8 h-8 text-gray-700" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Service Period Records</h1>
                            <p className="mt-1 text-sm text-gray-600">Review performance from all past and present service periods.</p>
                        </div>
                    </div>
                </div>
                <PeriodsListPage />
            </div>
        </Suspense>
    );
}