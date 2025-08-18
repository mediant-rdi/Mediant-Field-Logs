// src/components/dashboard/EngineerAssignmentsDashboard.tsx
'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Doc, Id } from '../../../convex/_generated/dataModel';
import { format } from 'date-fns';
import {
  Check,
  Loader2,
  CheckCircle,
  Clock,
  ListChecks,
  Settings,
  Flag,
  AlertTriangle,
} from 'lucide-react';
import { useAccurateLocation } from '@/hooks/useAccurateLocation';
// --- MODIFICATION: Import toast for notifications ---
import { toast } from 'sonner';


// --- Helper functions for styling (unchanged) ---
const getStatusBadge = (status: string) => {
  const badgeStyles: { [key: string]: string } = {
    'Pending': 'bg-amber-100 text-amber-800 ring-amber-200',
    'In Progress': 'bg-blue-100 text-blue-800 ring-blue-200',
    'Resolved': 'bg-green-100 text-green-800 ring-green-200',
    'Escalated': 'bg-red-100 text-red-800 ring-red-200',
  };
  return badgeStyles[status] || 'bg-gray-100 text-gray-800 ring-gray-200';
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'Pending': return <Clock className="w-3 h-3 text-amber-600" />;
        case 'In Progress': return <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />;
        case 'Resolved': return <CheckCircle className="w-3 h-3 text-green-600" />;
        case 'Escalated': return <AlertTriangle className="w-3 h-3 text-red-600" />;
        default: return <Settings className="w-3 h-3 text-gray-600" />;
    }
}
// --- End of helpers ---

type EnrichedCallLog = Doc<"callLogs"> & {
  clientName: string;
  engineers: string[];
};

export function EngineerAssignmentsDashboard() {
  const currentUser = useQuery(api.users.current);
  const allAssignedJobs = useQuery(
    api.callLogs.getMyAssignedJobs,
    currentUser ? {} : 'skip'
  );

  const [visibleJobsCount, setVisibleJobsCount] = useState(3);
  const assignedJobs = useMemo(
    () => allAssignedJobs?.slice(0, visibleJobsCount), 
    [allAssignedJobs, visibleJobsCount]
  );
  
  const acceptJob = useMutation(api.callLogs.acceptJob);
  const finishJob = useMutation(api.callLogs.finishJob);
  const requestEscalation = useMutation(api.callLogs.requestEscalation);
  const { getLocation, isGettingLocation } = useAccurateLocation();
  const [processingId, setProcessingId] = useState<Id<"callLogs"> | null>(null);

  const handleAccept = async (logId: Id<"callLogs">) => {
    setProcessingId(logId);
    try {
      const position = await getLocation();
      await acceptJob({
        callLogId: logId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      toast.success("Job accepted successfully!");
    } catch (error) {
      // --- MODIFICATION: Use toast for errors ---
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred while accepting the job.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFinish = async (logId: Id<"callLogs">) => {
    setProcessingId(logId);
    try {
      const position = await getLocation();
      await finishJob({
        callLogId: logId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      toast.success("Job marked as finished!");
    } catch (error) {
      // --- MODIFICATION: Use toast for errors ---
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred while finishing the job.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestEscalation = async (logId: Id<"callLogs">) => {
    setProcessingId(logId);
    try {
      if (window.confirm("Are you sure you want to escalate this job? This action cannot be undone and requires an admin to assign a new engineer.")) {
        await requestEscalation({ callLogId: logId });
        toast.success("Job has been escalated. An admin will review it.");
      }
    } catch (error) {
        // --- MODIFICATION: Use toast for errors ---
        toast.error(error instanceof Error ? error.message : 'An unknown error occurred during escalation.');
    } finally {
        setProcessingId(null);
    }
  };


  const isLoading = currentUser === undefined || allAssignedJobs === undefined;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse mb-8">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // --- MODIFICATION: If user has no jobs, render nothing ---
  if (allAssignedJobs.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ListChecks className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Job Assignments</h2>
              <p className="text-sm text-gray-600">Showing the {Math.min(visibleJobsCount, allAssignedJobs?.length ?? 0)} most recent jobs assigned to you.</p>
            </div>
          </div>
        </div>
        
        <div>
          {assignedJobs && assignedJobs.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {assignedJobs.map((job: EnrichedCallLog) => {
                const isCurrentJobLoading = processingId === job._id;
                const isUserAccepted = !!currentUser?._id && !!job.acceptedBy?.includes(currentUser._id);

                return (
                  <div key={job._id} className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="md:col-span-3 space-y-2">
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg text-gray-900">{job.clientName}</span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ring-1 ring-inset ${getStatusBadge(job.status)}`}>
                              {getStatusIcon(job.status)}
                              {job.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 pt-1"><span className="font-medium">Issue:</span> {job.issue}</p>
                          <p className="text-xs text-gray-500"><span className="font-medium">Assigned:</span> {format(new Date(job._creationTime), 'dd MMM yyyy')} | <span className="font-medium">Engineers:</span> {job.engineers.join(', ')}</p>
                        </div>
                        <div className="md:col-span-1 flex justify-start md:justify-end">
                          {(job.status === 'Pending' || (job.status === 'Escalated' && !isUserAccepted)) && (
                            <button
                              onClick={() => handleAccept(job._id)}
                              disabled={isCurrentJobLoading}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isCurrentJobLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              {isCurrentJobLoading && isGettingLocation ? 'Getting Location...' : 'Accept Job'}
                            </button>
                          )}
                          {job.status === 'In Progress' && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleFinish(job._id)}
                                    disabled={isCurrentJobLoading}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCurrentJobLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                                    Finish Job
                                </button>
                                {!job.isEscalated && (
                                    <button
                                        onClick={() => handleRequestEscalation(job._id)}
                                        disabled={isCurrentJobLoading}
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        Escalate
                                    </button>
                                )}
                            </div>
                          )}
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 px-6">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No Assignments Found</h3>
              <p className="mt-1 text-sm text-gray-500">You have not been assigned to any jobs yet.</p>
            </div>
          )}
        </div>
        
        {allAssignedJobs && allAssignedJobs.length > 3 && visibleJobsCount === 3 && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-center">
            <button
              onClick={() => setVisibleJobsCount(6)}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View More...
            </button>
          </div>
        )}
      </div>
    </div>
  );
}