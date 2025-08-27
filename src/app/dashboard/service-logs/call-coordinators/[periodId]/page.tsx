// src/app/dashboard/service-logs/call-coordinators/[periodId]/page.tsx
'use client';

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Loader2, ArrowLeft, PieChart, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import React, { useMemo, Suspense, use } from "react";
import type { FunctionReturnType } from "convex/server";
import { Id } from "../../../../../../convex/_generated/dataModel";
import CallLogAccessProtection from "@/components/CallLogAccessProtection"; // MODIFICATION: Import protection component

type PeriodDetailsData = FunctionReturnType<typeof api.servicePeriods.getByIdWithLogs>;
type EnrichedServiceLog = Exclude<PeriodDetailsData, null>['serviceLogs'][0];

const StatusBarGraph = ({ logs }: { logs: EnrichedServiceLog[] }) => {
    const stats = useMemo(() => {
        const counts = { 'Finished': 0, 'In Progress': 0, 'Pending': 0 };
        logs.forEach(log => {
            if (log.status in counts) {
                counts[log.status as keyof typeof counts]++;
            }
        });
        return counts;
    }, [logs]);

    const total = logs.length;
    if (total === 0) return null;

    const finishedPercent = (stats.Finished / total) * 100;
    const inProgressPercent = (stats['In Progress'] / total) * 100;
    const pendingPercent = (stats.Pending / total) * 100;

    return (
        <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><PieChart className="w-5 h-5"/>Overall Progress</h2>
            <div className="flex h-8 w-full rounded-full overflow-hidden bg-gray-200">
                <div style={{ width: `${finishedPercent}%` }} className="bg-green-500 transition-all duration-500" title={`Finished: ${stats.Finished}`}></div>
                <div style={{ width: `${inProgressPercent}%` }} className="bg-blue-500 transition-all duration-500" title={`In Progress: ${stats['In Progress']}`}></div>
                <div style={{ width: `${pendingPercent}%` }} className="bg-amber-500 transition-all duration-500" title={`Pending: ${stats.Pending}`}></div>
            </div>
            <div className="mt-3 flex justify-between text-sm text-gray-600">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div>Finished ({stats.Finished})</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div>In Progress ({stats['In Progress']})</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div>Pending ({stats.Pending})</div>
            </div>
        </div>
    );
};

function PeriodDetailsContent({ periodId }: { periodId: Id<"servicePeriods"> }) {
    const data = useQuery(api.servicePeriods.getByIdWithLogs, { periodId });

    const logsByEngineer = useMemo(() => {
        if (!data?.serviceLogs) return new Map();
        const grouped = data.serviceLogs.reduce((acc, log) => {
            const engineerId = log.engineerId;
            if (!acc.has(engineerId)) {
                acc.set(engineerId, { 
                    engineerName: log.assignedEngineerName, 
                    logs: [], 
                    completedCount: 0, 
                    isInProgress: false 
                });
            }
            const engineerData = acc.get(engineerId)!;
            engineerData.logs.push(log);
            if (log.status === 'Finished') engineerData.completedCount += 1;
            if (log.status === 'In Progress') engineerData.isInProgress = true;
            return acc;
        }, new Map<Id<"users">, { engineerName: string; logs: EnrichedServiceLog[]; completedCount: number; isInProgress: boolean }>());
        return new Map([...grouped.entries()].sort((a, b) => a[1].engineerName.localeCompare(b[1].engineerName)));
    }, [data?.serviceLogs]);

    if (data === undefined) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;
    if (data === null) return <div className="text-center p-8">Service Period not found or you do not have permission to view it.</div>;

    return (
        <div>
            {/* MODIFICATION: Corrected Link path */}
            <Link href="/dashboard/service-logs/call-coordinators" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />Back to All Periods
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
            <p className="mt-1 text-sm text-gray-600">Started on {format(new Date(data.startDate), 'dd MMMM yyyy')} &bull; {data.logsCreated} logs created</p>

            <div className="mt-6">
                {data.isActive && <StatusBarGraph logs={data.serviceLogs} />}

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="p-4 border-b"><h2 className="text-lg font-semibold text-gray-800">Participating Engineers ({logsByEngineer.size})</h2></div>
                    <ul className="divide-y divide-gray-200">
                        {Array.from(logsByEngineer.entries()).map(([engineerId, { engineerName, logs, completedCount, isInProgress }]) => (
                            <li key={engineerId}>
                                {/* MODIFICATION: Corrected Link path */}
                                <Link href={`/dashboard/service-logs/call-coordinators/${periodId}/${engineerId}`} className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 focus:outline-none transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <User className="w-5 h-5 text-gray-500" />
                                            {isInProgress && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" title="Actively at work"></div>
                                            )}
                                        </div>
                                        <span className="font-medium text-gray-800">{engineerName}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600">{completedCount} / {logs.length} Completed</span>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </Link>
                            </li>
                        ))}
                        {logsByEngineer.size === 0 && <p className="p-4 text-sm text-gray-500">No engineers were assigned logs for this period.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default function PeriodDetailsPage({ params }: { params: Promise<{ periodId: Id<"servicePeriods"> }> }) {
    const { periodId } = use(params);

    return (
        // --- MODIFICATION START ---
        <CallLogAccessProtection>
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>}>
                <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                    <PeriodDetailsContent periodId={periodId} />
                </div>
            </Suspense>
        </CallLogAccessProtection>
        // --- MODIFICATION END ---
    );
}