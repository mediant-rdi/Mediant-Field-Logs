// src/app/dashboard/service-logs/call-coordinators/[periodId]/[userId]/page.tsx
'use client';

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Loader2, CheckCircle, XCircle, Flag, Clock } from "lucide-react";
import Link from "next/link";
import React, { Suspense, use, useState, useMemo } from "react";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";
import CallLogAccessProtection from "@/components/CallLogAccessProtection";

// MODIFICATION: Update type definitions for team view
type PeriodData = FunctionReturnType<typeof api.servicePeriods.getByIdWithLogs>;
type EnrichedServiceLog = Exclude<PeriodData, null>['serviceLogs'][0];

const getStatusBadgeDetails = (status: string) => {
    switch (status) {
        case 'Finished': return <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"><CheckCircle className="h-3 w-3" />Finished</span>;
        case 'In Progress': return <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"><Clock className="h-3 w-3" />In Progress</span>;
        case 'Pending': return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700"><Flag className="h-3 w-3" />Pending</span>;
        default: return <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"><XCircle className="h-3 w-3" />Unknown</span>;
    }
};

// --- MODIFICATION START: Reverted components to original state (no "Assigned To") ---

// Desktop-only Table View
const LogDetailsTable = ({ logs, onFinishClick }: { logs: EnrichedServiceLog[], onFinishClick: (log: EnrichedServiceLog) => void }) => (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th scope="col" className="px-6 py-3">Site</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                    <tr key={log._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.locationName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusBadgeDetails(log.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                            {log.status === 'Pending' && (
                                <button
                                    onClick={() => onFinishClick(log)}
                                    className="text-red-600 hover:text-red-800 font-semibold"
                                >
                                    Finish Job
                                </button>
                            )}
                            <Link href={`/dashboard/service-logs/${log._id}`} className="text-indigo-600 hover:text-indigo-900">View Details</Link>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// Mobile-only Card View
const LogCard = ({ log, onFinishClick }: { log: EnrichedServiceLog, onFinishClick: (log: EnrichedServiceLog) => void }) => (
    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-3">
        <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-gray-800 break-words">{log.locationName}</h3>
            {getStatusBadgeDetails(log.status)}
        </div>
        <div className="flex justify-end items-center space-x-4 border-t pt-3 mt-3">
            {log.status === 'Pending' && (
                <button
                    onClick={() => onFinishClick(log)}
                    className="text-red-600 hover:text-red-800 font-semibold text-sm"
                >
                    Finish Job
                </button>
            )}
            <Link href={`/dashboard/service-logs/${log._id}`} className="text-indigo-600 hover:text-indigo-900 text-sm font-semibold">
                View Details
            </Link>
        </div>
    </div>
);

// Component that switches between Table and Cards
const ResponsiveLogList = ({ logs, onFinishClick }: { logs: EnrichedServiceLog[], onFinishClick: (log: EnrichedServiceLog) => void }) => {
    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
                <LogDetailsTable logs={logs} onFinishClick={onFinishClick} />
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {logs.map(log => (
                    <LogCard key={log._id} log={log} onFinishClick={onFinishClick} />
                ))}
            </div>
        </>
    );
};
// --- MODIFICATION END ---

const FinishJobModal = ({ log, onClose, onSubmit, isSubmitting }: { log: EnrichedServiceLog, onClose: () => void, onSubmit: (notes: string) => void, isSubmitting: boolean }) => {
    const [notes, setNotes] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (notes.trim()) {
            onSubmit(notes);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-bold text-gray-900">Manually Finish Job</h2>
                <p className="mt-2 text-sm text-gray-600">
                    You are finishing the job for site: <span className="font-semibold">{log.locationName}</span>. Please provide a mandatory reason below.
                </p>
                <form onSubmit={handleSubmit} className="mt-4">
                    <div>
                        <label htmlFor="completion-notes" className="block text-sm font-medium text-gray-700">Reason for manual completion</label>
                        <textarea
                            id="completion-notes"
                            name="completion-notes"
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                        <button
                            type="submit"
                            disabled={!notes.trim() || isSubmitting}
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Finish'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const UserPeriodDetailsContent = ({ periodId, userId }: { periodId: Id<"servicePeriods">, userId: Id<"users"> }) => {
    // Fetch all data for the period, and all users, to compute team details on the client.
    const periodWithAllLogs = useQuery(api.servicePeriods.getByIdWithLogs, { periodId });
    const allUsers = useQuery(api.users.listAll);

    // useMemo to efficiently calculate team data and prevent re-renders
    const teamData = useMemo(() => {
        // Wait for all data to load
        if (periodWithAllLogs === undefined || allUsers === undefined) return undefined;
        if (periodWithAllLogs === null || allUsers === null) return null;

        const leader = allUsers.find(u => u._id === userId);
        if (!leader) return null; // Leader specified in URL not found

        const teamMemberIds = new Set([leader._id, ...(leader.taggedTeamMemberIds ?? [])]);
        
        const teamMembers = allUsers
            .filter(u => teamMemberIds.has(u._id))
            .sort((a,b) => (a.name ?? "").localeCompare(b.name ?? ""));

        const teamLogs = periodWithAllLogs.serviceLogs
            .filter(log => teamMemberIds.has(log.engineerId))
            .sort((a, b) => a.locationName.localeCompare(b.locationName));

        return {
            period: periodWithAllLogs,
            leader,
            teamMembers,
            logs: teamLogs
        };
    }, [periodWithAllLogs, allUsers, userId]);

    const finishJobMutation = useMutation(api.serviceLogs.finishPendingServiceByCoordinator);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalState, setModalState] = useState<{ isOpen: boolean; log: EnrichedServiceLog | null }>({
        isOpen: false,
        log: null,
    });

    const handleOpenModal = (log: EnrichedServiceLog) => {
        setModalState({ isOpen: true, log });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, log: null });
    };
    
    const handleFinishSubmit = async (notes: string) => {
        if (!modalState.log) return;
        setIsSubmitting(true);
        try {
            await finishJobMutation({
                serviceLogId: modalState.log._id,
                completionNotes: notes,
            });
            handleCloseModal();
        } catch (error) {
            console.error("Failed to finish job:", error);
            alert(`Error: ${(error as Error).message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (teamData === undefined) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;
    if (teamData === null) return <div className="text-center p-8">Details not found. The team leader or period may not exist, or you may not have permission.</div>;

    const { period, leader, teamMembers, logs } = teamData;
    const teamMemberNames = teamMembers.map(m => m.name).join(', ');

    return (
        <div>
            <nav className="flex items-center text-sm font-medium text-gray-500 mb-4 flex-wrap">
                <Link href="/dashboard/service-logs/call-coordinators" className="hover:text-gray-700">All Periods</Link>
                <span className="mx-2">/</span>
                <Link href={`/dashboard/service-logs/call-coordinators/${period._id}`} className="hover:text-gray-700 truncate max-w-[150px] sm:max-w-[200px]">{period.name}</Link>
                <span className="mx-2">/</span>
                <span className="text-gray-800 truncate max-w-[150px] sm:max-w-[200px]">{leader.name}'s Team</span>
            </nav>
            
            <div className="border-b border-gray-200 pb-5 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Service Logs for {teamMemberNames}</h1>
                <p className="mt-2 text-sm text-gray-500">
                    Showing {logs.length} total assigned sites for the team during the <span className="font-medium text-gray-700">{period.name}</span> service period.
                </p>
            </div>
            
            <ResponsiveLogList logs={logs} onFinishClick={handleOpenModal} />

            {logs.length === 0 && <p className="p-4 mt-4 text-sm text-gray-500 bg-white rounded-lg border">This team had no logs assigned for this period.</p>}
            
            {modalState.isOpen && modalState.log && (
                <FinishJobModal
                    log={modalState.log}
                    onClose={handleCloseModal}
                    onSubmit={handleFinishSubmit}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
};

export default function UserPeriodDetailsPage({ params }: { params: Promise<{ periodId: Id<"servicePeriods">, userId: Id<"users"> }> }) {
    const { periodId, userId } = use(params);

    return (
        <CallLogAccessProtection>
            <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>}>
                <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
                    <UserPeriodDetailsContent periodId={periodId} userId={userId} />
                </div>
            </Suspense>
        </CallLogAccessProtection>
    );
}