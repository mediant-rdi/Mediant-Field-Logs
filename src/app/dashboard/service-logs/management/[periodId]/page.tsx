// src/app/dashboard/service-logs/management/[periodId]/page.tsx
'use client';

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Loader2, ArrowLeft, PieChart, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import React, { useMemo, Suspense, use } from "react";
import type { FunctionReturnType } from "convex/server";
import { Id } from "../../../../../../convex/_generated/dataModel";
import ManagementDashboardProtection from "@/components/ManagementDashboardProtection";

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
    // --- MODIFICATION START: Fetch all users to determine team structure ---
    const allUsers = useQuery(api.users.listAll);

    const logsByTeamLeader = useMemo(() => {
        if (!data?.serviceLogs || !allUsers) return new Map();

        const findLeader = (engineerId: Id<"users">) => {
            const leader = allUsers.find(u => u.taggedTeamMemberIds?.includes(engineerId));
            return leader || allUsers.find(u => u._id === engineerId);
        };

        type TeamData = {
            leaderName: string;
            logs: EnrichedServiceLog[];
            completedCount: number;
            isInProgress: boolean;
            teamMemberNames: string[];
        };
        
        const grouped = data.serviceLogs.reduce((acc, log) => {
            const leader = findLeader(log.engineerId);
            if (!leader) return acc;

            const leaderId = leader._id;
            if (!acc.has(leaderId)) {
                const teamMemberIds = leader.taggedTeamMemberIds ?? [];
                const teamMembers = allUsers.filter(u => teamMemberIds.includes(u._id));
                const teamMemberNames = teamMembers.map(m => m.name ?? 'Unnamed').sort();
                
                acc.set(leaderId, { 
                    leaderName: leader.name ?? "Unknown Leader", 
                    logs: [], 
                    completedCount: 0, 
                    isInProgress: false,
                    teamMemberNames,
                });
            }

            const leaderData = acc.get(leaderId)!;
            leaderData.logs.push(log);
            if (log.status === 'Finished') leaderData.completedCount += 1;
            if (log.status === 'In Progress') leaderData.isInProgress = true;
            
            return acc;
        }, new Map<Id<"users">, TeamData>());

        return new Map([...grouped.entries()].sort((a, b) => a[1].leaderName.localeCompare(b[1].leaderName)));
    }, [data?.serviceLogs, allUsers]);

    if (data === undefined || allUsers === undefined) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;
    // --- MODIFICATION END ---
    if (data === null) return <div className="text-center p-8">Service Period not found or you do not have permission to view it.</div>;

    return (
        <div>
            <Link href="/dashboard/service-logs/management" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />Back to All Periods
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
            <p className="mt-1 text-sm text-gray-600">Started on {format(new Date(data.startDate), 'dd MMMM yyyy')} &bull; {data.logsCreated} logs created</p>

            <div className="mt-6">
                {data.isActive && <StatusBarGraph logs={data.serviceLogs} />}

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    {/* --- MODIFICATION START: Update UI to show teams --- */}
                    <div className="p-4 border-b"><h2 className="text-lg font-semibold text-gray-800">Participating Teams & Engineers ({logsByTeamLeader.size})</h2></div>
                    <ul className="divide-y divide-gray-200">
                        {Array.from(logsByTeamLeader.entries()).map(([leaderId, { leaderName, logs, completedCount, isInProgress, teamMemberNames }]) => (
                            <li key={leaderId}>
                                <Link href={`/dashboard/service-logs/management/${periodId}/${leaderId}`} className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 focus:outline-none transition-colors">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="relative flex-shrink-0">
                                            <User className="w-5 h-5 text-gray-500" />
                                            {isInProgress && (
                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white" title="Team actively at work"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate">{leaderName}</p>
                                            {teamMemberNames.length > 0 && (
                                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                    Team: {teamMemberNames.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600">{completedCount} / {logs.length} Completed</span>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                    </div>
                                </Link>
                            </li>
                        ))}
                        {logsByTeamLeader.size === 0 && <p className="p-4 text-sm text-gray-500">No engineers were assigned logs for this period.</p>}
                    </ul>
                    {/* --- MODIFICATION END --- */}
                </div>
            </div>
        </div>
    );
};

export default function PeriodDetailsPage({ params }: { params: Promise<{ periodId: Id<"servicePeriods"> }> }) {
    const { periodId } = use(params);

    return (
        <ManagementDashboardProtection>
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>}>
                <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                    <PeriodDetailsContent periodId={periodId} />
                </div>
            </Suspense>
        </ManagementDashboardProtection>
    );
}