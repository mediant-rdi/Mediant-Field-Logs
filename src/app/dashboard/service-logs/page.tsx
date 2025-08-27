// src/app/dashboard/service-logs/page.tsx
'use client';

import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import React, { useState, useMemo, useCallback } from 'react';
import { Doc, Id } from '../../../../convex/_generated/dataModel';
import { Loader2, CheckCircle, Wrench, Play, Flag, UserCheck, MessageSquare, Search, Users, UserCog } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useAccurateLocation } from '../../../hooks/useAccurateLocation';
import { CompletionNotesModal } from '../../../components/modals/CompletionNotesModal';

type EnrichedServiceLog = Doc<"serviceLogs"> & {
  locationName: string;
  assignedEngineerName: string;
  completedByName?: string;
  startedByName?: string;
};

type ActionHandler = (id: Id<"serviceLogs">, action: 'start' | 'finish') => void;

interface LogComponentProps {
    serviceLog: EnrichedServiceLog | undefined;
    onAction: ActionHandler;
    processingId: Id<"serviceLogs"> | null;
    isGettingLocation: boolean;
    isAnotherJobActive: boolean;
    currentUserId: Id<"users"> | undefined;
    currentUser: Doc<"users"> | null | undefined;
}

interface ActionButtonsProps extends LogComponentProps {
  size?: 'small' | 'default';
}

const getStatusBadge = (status: string, startedByName?: string) => {
  const styles: { [key: string]: string } = {
    'Pending': 'bg-amber-100 text-amber-800 ring-amber-200',
    'In Progress': 'bg-blue-100 text-blue-800 ring-blue-200',
    'Finished': 'bg-green-100 text-green-800 ring-green-200',
    'Inactive': 'bg-gray-100 text-gray-800 ring-gray-200',
  };
  const baseClasses = `inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ring-1 ring-inset whitespace-nowrap`;
  const style = styles[status] || styles['Inactive'];

  if (status === 'In Progress' && startedByName) {
    return (
      <div className={`${baseClasses} ${style}`} title={`Started by ${startedByName}`}>
        <UserCog className="h-3 w-3" />
        In Progress
      </div>
    );
  }

  return <span className={`${baseClasses} ${style}`}>{status}</span>;
};

const CardSkeleton = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="flex justify-between items-start"><div className="h-6 w-1/2 bg-gray-300 rounded"></div><div className="h-6 w-20 bg-gray-300 rounded-full"></div></div>
                <div className="mt-8 flex justify-end"><div className="h-9 w-24 bg-gray-300 rounded-md"></div></div>
            </div>
        ))}
    </div>
);

const TableSkeleton = () => (
    <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200 bg-white">
                {[...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 w-3/4 bg-gray-300 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-300 rounded-full"></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-1/2 bg-gray-300 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-9 w-24 bg-gray-300 rounded-md"></div></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const ActionButtons = ({ serviceLog, onAction, processingId, isGettingLocation, isAnotherJobActive, size = 'default', currentUserId }: ActionButtonsProps) => {
    if (!serviceLog?._id) return null;
    const isProcessing = processingId === serviceLog._id;
    const padding = size === 'small' ? 'px-3 py-1.5' : 'px-4 py-2';
    const rounding = size === 'small' ? 'rounded-md' : 'rounded-lg';
    const gap = size === 'small' ? 'gap-1' : 'gap-2';
    const iconSize = 'w-4 h-4';
    const baseButtonClasses = `inline-flex items-center justify-center text-sm font-semibold text-white shadow-sm disabled:opacity-50 ${padding} ${rounding} ${gap}`;

    if (serviceLog.status === 'Pending') {
        return (
            <button 
                onClick={() => onAction(serviceLog._id, 'start')} 
                disabled={isProcessing || isGettingLocation || isAnotherJobActive} 
                className={`${baseButtonClasses} bg-blue-600 hover:bg-blue-700`} 
                title={isAnotherJobActive ? 'Finish your current job before starting a new one' : 'Start this job'}
            >
                {isProcessing ? <Loader2 className={`${iconSize} animate-spin`}/> : <Play className={iconSize} />} Start
            </button>
        );
    }
    if (serviceLog.status === 'In Progress') {
        const canFinish = serviceLog.startedByUserId === currentUserId;
        return (
            <button 
                onClick={() => onAction(serviceLog._id, 'finish')} 
                disabled={!canFinish || isProcessing || isGettingLocation} 
                className={`${baseButtonClasses} bg-green-600 hover:bg-green-700`}
                title={!canFinish ? `This job was started by ${serviceLog.startedByName}` : 'Finish this job'}
            >
                {isProcessing ? <Loader2 className={`${iconSize} animate-spin`}/> : <Flag className={iconSize} />} Finish
            </button>
        );
    }
    if (serviceLog.status === 'Finished') {
        return (
            <Link href={`/dashboard/service-logs/${serviceLog._id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                {size === 'small' ? 'View' : 'View Details →'}
            </Link>
        );
    }
    return null;
};

const ServiceLogCard = React.memo(({ serviceLog, onAction, processingId, isGettingLocation, isAnotherJobActive, currentUserId, currentUser }: LogComponentProps) => {
    const status = serviceLog?.status ?? 'Inactive';
    return (
        <div className={`rounded-lg border shadow-sm transition-all ${status === 'Finished' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
            <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{serviceLog?.locationName ?? 'N/A'}</h3>
                        <p className="text-xs text-gray-500 mt-1">Assigned to: {serviceLog?.assignedEngineerName}</p>
                    </div>
                    {getStatusBadge(status, serviceLog?.startedByName)}
                </div>
                {status === 'Finished' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-sm text-gray-600">
                        {serviceLog?.completionMethod === 'Call Log' ? (<div className="flex items-center gap-2"><UserCheck className="w-4 h-4 text-sky-600 flex-shrink-0"/><span>Via Call Log by {serviceLog.completedByName || 'engineer'}</span></div>) : (<span>{serviceLog?.completionMethod || 'N/A'}</span>)}
                        {serviceLog?.completionNotes && (<div className="flex items-start gap-2.5 text-gray-500"><MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" /><p className="text-xs italic">&quot;{serviceLog.completionNotes}&quot;</p></div>)}
                    </div>
                )}
            </div>
            <div className="bg-gray-50/75 px-4 py-3 rounded-b-lg flex justify-end">
                <ActionButtons {...{ serviceLog, onAction, processingId, isGettingLocation, isAnotherJobActive, currentUserId, currentUser }} />
            </div>
        </div>
    );
});
ServiceLogCard.displayName = 'ServiceLogCard';

const ServiceLogTableRow = React.memo(({ serviceLog, onAction, processingId, isGettingLocation, isAnotherJobActive, currentUserId, currentUser }: LogComponentProps) => {
    const status = serviceLog?.status ?? 'Inactive';
    return (
        <tr className={status === 'Finished' ? 'bg-gray-50' : 'bg-white'}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                <div>{serviceLog?.locationName ?? 'N/A'}</div>
                <div className="text-xs text-gray-500">Assigned to: {serviceLog?.assignedEngineerName}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getStatusBadge(status, serviceLog?.startedByName)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {status === 'Finished' ? (
                    <div className="flex items-center gap-2">
                        {serviceLog?.completionMethod === 'Call Log' && (<span title={`Completed via Call Log by ${serviceLog.completedByName || 'engineer'}`}><UserCheck className="w-4 h-4 text-sky-600 flex-shrink-0" /></span>)}
                        {serviceLog?.completionNotes && (<span title={serviceLog.completionNotes}><MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" /></span>)}
                        <span className="truncate">{serviceLog?.completionMethod === 'Call Log' ? `By ${serviceLog.completedByName || 'engineer'}` : serviceLog?.completionMethod}</span>
                    </div>
                ) : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <ActionButtons {...{ serviceLog, onAction, processingId, isGettingLocation, isAnotherJobActive, currentUserId, currentUser }} size="small" />
            </td>
        </tr>
    );
});
ServiceLogTableRow.displayName = 'ServiceLogTableRow';

export default function ServiceLogsPage() {
  const settings = useQuery(api.systemSettings.getServicePeriodStatus);
  const assignedLocations = useQuery(api.users.getMyAssignedLocations);
  const activeServiceLogs = useQuery(api.serviceLogs.getMyServiceLogs);
  const currentUser = useQuery(api.users.current);
  const teamInfo = useQuery(api.users.getMyTeamInfo);
  
  const startService = useMutation(api.serviceLogs.startPlannedService);
  const finishService = useMutation(api.serviceLogs.finishPlannedService);
  
  const [processingId, setProcessingId] = useState<Id<"serviceLogs"> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalState, setModalState] = useState<{ isOpen: boolean; serviceLogId: Id<"serviceLogs"> | null; }>({ isOpen: false, serviceLogId: null });

  const { getLocation, isGettingLocation } = useAccurateLocation();
  
  const isJobInProgress = useMemo(() => activeServiceLogs?.some(log => log.status === 'In Progress' && log.startedByUserId === currentUser?._id) ?? false, [activeServiceLogs, currentUser]);

  const filteredLocations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!assignedLocations) return [];
    if (!query) return assignedLocations;
    return assignedLocations.filter(location => location.fullName.toLowerCase().includes(query));
  }, [assignedLocations, searchQuery]);

  const handleAction: ActionHandler = useCallback(async (id, action) => {
    if (action === 'finish') {
        setModalState({ isOpen: true, serviceLogId: id });
        return;
    }
    setProcessingId(id);
    const toastId = toast.loading("Processing...");
    try {
        const position = await getLocation();
        await startService({ serviceLogId: id, latitude: position.coords.latitude, longitude: position.coords.longitude });
        toast.success("Job started successfully.", { id: toastId });
    } catch (error) {
        toast.error(error instanceof Error ? error.message : "An error occurred.", { id: toastId });
    } finally {
        setProcessingId(null);
    }
  }, [getLocation, startService]);
  
  const handleConfirmFinish = useCallback(async (notes: string) => {
    if (!modalState.serviceLogId) return;
    setProcessingId(modalState.serviceLogId);
    const toastId = toast.loading("Getting an accurate location... Please wait.");
    try {
      const position = await getLocation();
      toast.loading("Finishing job...", { id: toastId });
      await finishService({ serviceLogId: modalState.serviceLogId, latitude: position.coords.latitude, longitude: position.coords.longitude, completionNotes: notes });
      toast.success("Job finished successfully.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred.", { id: toastId, duration: 8000 });
    } finally {
      setProcessingId(null);
      setModalState({ isOpen: false, serviceLogId: null });
    }
  }, [finishService, getLocation, modalState.serviceLogId]);

  const isLoading = settings === undefined || assignedLocations === undefined || activeServiceLogs === undefined || currentUser === undefined || teamInfo === undefined;
  const isPeriodActive = settings?.isServicePeriodActive === true;
  const activeServiceLogsMap = new Map(activeServiceLogs?.map(log => [log.locationId, log]));

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Toaster position="top-center" richColors />
        <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">My Service Logs</h1><p className="mt-1 text-sm text-gray-600">{isPeriodActive ? `Planned service tasks for ${settings.servicePeriodName}.` : 'The service period is not currently active.'}</p></div>

        {teamInfo && teamInfo.members.length > 1 && (
            <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2"><Users className="w-5 h-5 text-gray-500" />My Team</h2>
                <p className="text-sm text-gray-600 mt-1">
                    Team Leader: <span className="font-medium text-gray-900">{teamInfo.leader.name}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                    {teamInfo.members.map(member => (
                    <span key={member._id} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 ring-1 ring-inset ring-gray-200">
                        {member.name}
                        {member._id === currentUser?._id && ' (You)'}
                    </span>
                    ))}
                </div>
            </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50 space-y-4">
              <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><Wrench className="w-6 h-6 text-blue-600" /></div><div><h2 className="text-lg font-bold text-gray-900">Assigned Branches</h2><p className="text-sm text-gray-600">{searchQuery ? `Showing ${filteredLocations.length} of ${assignedLocations?.length ?? 0} locations.` : `You have ${assignedLocations?.length ?? 0} locations.`}</p></div></div>
              </div>
              <div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Search className="h-5 w-5 text-gray-400" aria-hidden="true" /></div><input type="text" name="search" id="search" className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Search assigned locations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} disabled={isLoading || (assignedLocations ?? []).length === 0} /></div>
          </div>
          
          <div>
            {isLoading ? (
                <div className="p-4 sm:p-6">
                    <div className="lg:hidden"><CardSkeleton /></div>
                    <div className="hidden lg:block"><TableSkeleton /></div>
                </div>
            ) : (assignedLocations ?? []).length === 0 ? (
                <div className="text-center py-16 px-6"><CheckCircle className="mx-auto h-12 w-12 text-green-400" /><h3 className="mt-2 text-sm font-semibold text-gray-900">No Service Assignments</h3><p className="mt-1 text-sm text-gray-500">You have not been assigned any service locations.</p></div>
            ) : filteredLocations.length === 0 ? (
                <div className="text-center py-16 px-6"><Search className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-semibold text-gray-900">No Locations Found</h3><p className="mt-1 text-sm text-gray-500">Your search for &quot;{searchQuery}&quot; did not match any assigned locations.</p></div>
            ) : (
                <>
                    <div className="p-4 sm:p-6 bg-gray-50/50 space-y-4 lg:hidden">
                        {filteredLocations.map(location => {
                            const serviceLogForLocation = activeServiceLogsMap.get(location._id) ?? { locationName: location.fullName } as EnrichedServiceLog;
                            return <ServiceLogCard key={location._id} serviceLog={serviceLogForLocation} onAction={handleAction} processingId={processingId} isGettingLocation={isGettingLocation} isAnotherJobActive={isJobInProgress} currentUserId={currentUser?._id} currentUser={currentUser} />;
                        })}
                    </div>
                    <div className="hidden lg:block">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch & Assigned Engineer</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLocations.map(location => {
                                    const serviceLogForLocation = activeServiceLogsMap.get(location._id) ?? { locationName: location.fullName } as EnrichedServiceLog;
                                    return <ServiceLogTableRow key={location._id} serviceLog={serviceLogForLocation} onAction={handleAction} processingId={processingId} isGettingLocation={isGettingLocation} isAnotherJobActive={isJobInProgress} currentUserId={currentUser?._id} currentUser={currentUser} />;
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
          </div>
        </div>
      </div>
      <CompletionNotesModal isOpen={modalState.isOpen} onClose={() => setModalState({ isOpen: false, serviceLogId: null })} onSubmit={handleConfirmFinish} isSubmitting={!!processingId} />
    </>
  );
}