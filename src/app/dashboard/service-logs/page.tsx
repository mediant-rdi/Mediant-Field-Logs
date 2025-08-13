// src/app/dashboard/service-logs/page.tsx
'use client';

import Link from 'next/link';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import React, { useState, useMemo } from 'react';
import { Doc, Id } from '../../../../convex/_generated/dataModel';
// --- MODIFICATION: Added Search icon ---
import { Loader2, CheckCircle, Wrench, Play, Flag, UserCheck, Eye, MessageSquare, Search } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useAccurateLocation } from '../../../hooks/useAccurateLocation';
import { CompletionNotesModal } from '../../../components/modals/CompletionNotesModal';

// Define the shape of the enriched data coming from the query
type EnrichedServiceLog = Doc<"serviceLogs"> & {
  locationName: string;
  assignedEngineerName: string;
  completedByName?: string;
};

// --- Helper Components ---

const getStatusBadge = (status: string) => {
  const styles: { [key: string]: string } = {
    'Pending': 'bg-amber-100 text-amber-800 ring-amber-200',
    'In Progress': 'bg-blue-100 text-blue-800 ring-blue-200',
    'Finished': 'bg-green-100 text-green-800 ring-green-200',
    'Inactive': 'bg-gray-100 text-gray-800 ring-gray-200',
  };
  return styles[status] || 'bg-gray-100 text-gray-800 ring-gray-200';
};

// --- NEW: Card-based skeleton for a better mobile-first loading experience ---
const CardSkeleton = () => (
    <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="flex justify-between items-start">
                    <div className="h-6 w-1/2 bg-gray-300 rounded"></div>
                    <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
                </div>
                <div className="mt-8 flex justify-end">
                   <div className="h-9 w-24 bg-gray-300 rounded-md"></div>
                </div>
            </div>
        ))}
    </div>
);


// --- NEW: Card component to replace the table row for a mobile-friendly layout ---
const ServiceLogCard = React.memo(({
    serviceLog,
    onAction,
    processingId,
    isGettingLocation,
    isAnotherJobActive,
}: {
    serviceLog: EnrichedServiceLog | undefined;
    onAction: (id: Id<"serviceLogs">, action: 'start' | 'finish') => void;
    processingId: Id<"serviceLogs"> | null;
    isGettingLocation: boolean;
    isAnotherJobActive: boolean;
}) => {
    const isProcessing = serviceLog && processingId === serviceLog._id;
    const status = serviceLog?.status ?? 'Inactive';

    return (
        <div className={`rounded-lg border shadow-sm transition-all ${serviceLog?.status === 'Finished' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}>
            <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{serviceLog?.locationName ?? 'N/A'}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ring-1 ring-inset whitespace-nowrap ${getStatusBadge(status)}`}>
                        {status}
                    </span>
                </div>

                {/* Completion Details are only shown for finished logs */}
                {serviceLog?.status === 'Finished' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 text-sm text-gray-600">
                        {serviceLog?.completionMethod === 'Call Log' ? (
                            <div className="flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-sky-600 flex-shrink-0"/>
                                <span>Via Call Log by {serviceLog.completedByName || 'engineer'}</span>
                            </div>
                        ) : (
                            <span>{serviceLog?.completionMethod || 'N/A'}</span>
                        )}
                        {serviceLog?.completionNotes && (
                            <div className="flex items-start gap-2.5 text-gray-500">
                                <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <p className="text-xs italic">&quot;{serviceLog.completionNotes}&quot;</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions Footer */}
            <div className="bg-gray-50/75 px-4 py-3 rounded-b-lg flex justify-end">
                {serviceLog?.status === 'Pending' && (
                    <button 
                        onClick={() => onAction(serviceLog._id, 'start')} 
                        disabled={isProcessing || isGettingLocation || isAnotherJobActive} 
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50"
                        title={isAnotherJobActive ? 'Finish your current job before starting a new one' : 'Start this job'}
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4" />} Start
                    </button>
                )}
                {serviceLog?.status === 'In Progress' && (
                    <button 
                        onClick={() => onAction(serviceLog._id, 'finish')} 
                        disabled={isProcessing || isGettingLocation} 
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50"
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Flag className="w-4 h-4" />} Finish
                    </button>
                )}
                 {serviceLog?.status === 'Finished' && (
                    <Link href={`/dashboard/service-logs/${serviceLog._id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1.5 px-4 py-2">
                      <Eye className="w-4 h-4" /> View Details
                    </Link>
                 )}
            </div>
        </div>
    );
});
ServiceLogCard.displayName = 'ServiceLogCard';


export default function ServiceLogsPage() {
  const settings = useQuery(api.systemSettings.getServicePeriodStatus);
  const assignedLocations = useQuery(api.users.getMyAssignedLocations);
  const activeServiceLogs = useQuery(api.serviceLogs.getMyServiceLogs);
  
  const startService = useMutation(api.serviceLogs.startPlannedService);
  const finishService = useMutation(api.serviceLogs.finishPlannedService);
  
  const [processingId, setProcessingId] = useState<Id<"serviceLogs"> | null>(null);
  
  // --- MODIFICATION: State for the search query ---
  const [searchQuery, setSearchQuery] = useState('');
  
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    serviceLogId: Id<"serviceLogs"> | null;
  }>({ isOpen: false, serviceLogId: null });

  const { getLocation, isGettingLocation } = useAccurateLocation();
  
  const isJobInProgress = useMemo(() => {
    return activeServiceLogs?.some(log => log.status === 'In Progress') ?? false;
  }, [activeServiceLogs]);

  // --- MODIFICATION: Memoized filtered locations based on search query ---
  const filteredLocations = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!assignedLocations) return [];
    if (!query) return assignedLocations;
    return assignedLocations.filter(location =>
      location.fullName.toLowerCase().includes(query)
    );
  }, [assignedLocations, searchQuery]);


  const handleAction = async (id: Id<"serviceLogs">, action: 'start' | 'finish') => {
    if (action === 'finish') {
        setModalState({ isOpen: true, serviceLogId: id });
        return;
    }
    
    setProcessingId(id);
    const toastId = toast.loading("Processing...");
    try {
        await startServiceWithLocation(id);
        toast.success("Job started successfully.", { id: toastId });
    } catch (error) {
        toast.error(error instanceof Error ? error.message : "An error occurred.", { id: toastId });
    } finally {
        setProcessingId(null);
    }
  };
  
  const startServiceWithLocation = async (id: Id<"serviceLogs">) => {
    const position = await getLocation();
    await startService({ 
        serviceLogId: id, 
        latitude: position.coords.latitude, 
        longitude: position.coords.longitude 
    });
  };

  const handleConfirmFinish = async (notes: string) => {
    if (!modalState.serviceLogId) return;

    setProcessingId(modalState.serviceLogId);
    const toastId = toast.loading("Getting an accurate location... Please wait.");

    try {
      const position = await getLocation();
      toast.loading("Finishing job...", { id: toastId });

      await finishService({
        serviceLogId: modalState.serviceLogId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        completionNotes: notes,
      });

      toast.success("Job finished successfully.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred.", { id: toastId, duration: 8000 });
    } finally {
      setProcessingId(null);
      setModalState({ isOpen: false, serviceLogId: null });
    }
  };

  const isLoading = settings === undefined || assignedLocations === undefined || activeServiceLogs === undefined;
  const isPeriodActive = settings?.isServicePeriodActive === true;

  const activeServiceLogsMap = new Map(activeServiceLogs?.map(log => [log.locationId, log]));

  return (
    <>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Toaster position="top-center" richColors />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Service Logs</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isPeriodActive ? `Planned service tasks for ${settings.servicePeriodName}.` : 'The service period is not currently active.'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50 space-y-4">
              <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg"><Wrench className="w-6 h-6 text-blue-600" /></div>
                      <div>
                          <h2 className="text-lg font-bold text-gray-900">Assigned Branches</h2>
                          <p className="text-sm text-gray-600">
                            {/* --- MODIFICATION: Updated count text --- */}
                            {searchQuery ? `Showing ${filteredLocations.length} of ${assignedLocations?.length ?? 0} locations.` : `Showing ${assignedLocations?.length ?? 0} locations.`}
                          </p>
                      </div>
                  </div>
              </div>
              {/* --- MODIFICATION: Added search input field --- */}
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    name="search"
                    id="search"
                    className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    placeholder="Search assigned locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isLoading || (assignedLocations ?? []).length === 0}
                />
              </div>
          </div>

          {isLoading ? (
              <div className="p-6"><CardSkeleton /></div>
          ) : (assignedLocations ?? []).length === 0 ? (
            <div className="text-center py-16 px-6">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No Service Assignments</h3>
              <p className="mt-1 text-sm text-gray-500">You have not been assigned any service locations.</p>
            </div>
          // --- MODIFICATION: Handle no search results ---
          ) : filteredLocations.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No Locations Found</h3>
              <p className="mt-1 text-sm text-gray-500">Your search for &quot;{searchQuery}&quot; did not match any assigned locations.</p>
            </div>
          ) : (
            // --- MODIFICATION: Map over filtered locations ---
            <div className="p-4 sm:p-6 bg-gray-50/50 space-y-4">
              {filteredLocations.map(location => {
                  const serviceLogForLocation = activeServiceLogsMap.get(location._id) ?? { locationName: location.fullName } as EnrichedServiceLog;
                  return (
                    <ServiceLogCard 
                        key={location._id}
                        serviceLog={serviceLogForLocation}
                        onAction={handleAction}
                        processingId={processingId}
                        isGettingLocation={isGettingLocation}
                        isAnotherJobActive={isJobInProgress}
                    />
                  );
              })}
            </div>
          )}
        </div>
      </div>
      <CompletionNotesModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, serviceLogId: null })}
        onSubmit={handleConfirmFinish}
        isSubmitting={!!processingId}
      />
    </>
  );
}