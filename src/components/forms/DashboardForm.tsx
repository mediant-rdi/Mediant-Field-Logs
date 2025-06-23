// components/forms/DashboardForm.tsx
'use client';

import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { useState } from 'react';

// --- Types ---
type BaseReport = {
  // _id is now defined in the specific report types below for better type safety.
  _creationTime: number;
  modelTypes: string;
  branchLocation: string;
  submitterName: string;
  mainText: string;
};
type ServiceReportWithSubmitter = BaseReport & {
  _id: Id<"serviceReports">;
  type: 'serviceReport';
  status: "pending" | "approved" | "rejected";
  complaintText: string;
  solution: string;
  problemType: 'electrical' | 'mechanical' | 'software' | 'service-delay' | 'other';
  backofficeAccess: boolean;
  spareDelay: boolean;
  delayedReporting: boolean;
  communicationBarrier: boolean;
  otherText?: string;
};
type ComplaintWithSubmitter = BaseReport & {
  _id: Id<"complaints">;
  type: 'complaint';
  status: "pending" | "approved" | "rejected";
  complaintText: string;
  solution: string;
  problemType: 'equipment-fault' | 'poor-experience' | 'other';
  fault_oldAge: boolean;
  fault_frequentBreakdowns: boolean;
  fault_undoneRepairs: boolean;
  experience_paperJamming: boolean;
  experience_noise: boolean;
  experience_freezing: boolean;
  experience_dust: boolean;
  experience_buttonsSticking: boolean;
  otherProblemDetails: string;
};
type FeedbackWithSubmitter = BaseReport & {
  _id: Id<"feedback">;
  type: 'feedback';
  status?: undefined;
  feedbackDetails: string;
};
export type EnrichedReport = ServiceReportWithSubmitter | ComplaintWithSubmitter | FeedbackWithSubmitter;
export type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type DashboardFormProps = {
  submissions: EnrichedReport[];
  isAdmin: boolean;
  currentStatusFilter?: StatusFilter;
  onStatusFilterChange?: (filter: StatusFilter) => void;
  isFilterable?: boolean;
  onViewSubmission: (submission: EnrichedReport) => void;
};

// --- StatusBadge with Tailwind CSS ---
export const StatusBadge = ({ status }: { status: "pending" | "approved" | "rejected" }) => {
    const badgeClasses = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
};

export const DashboardForm = ({
  submissions,
  isAdmin,
  currentStatusFilter,
  onStatusFilterChange,
  isFilterable,
  onViewSubmission,
}: DashboardFormProps) => {
  const updateServiceReport = useMutation(api.serviceReports.updateServiceReportStatus);
  const updateComplaint = useMutation(api.complaints.updateComplaintStatus);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (id: Id<"serviceReports"> | Id<"complaints">, status: 'approved' | 'rejected', type: 'serviceReport' | 'complaint') => {
    setUpdatingId(id);
    try {
      if (type === 'serviceReport') {
        await updateServiceReport({ serviceReportId: id as Id<"serviceReports">, status });
      } else if (type === 'complaint') {
        await updateComplaint({ complaintId: id as Id<"complaints">, status });
      }
    } catch (error) {
      console.error(`Failed to update ${type} status:`, error);
      alert(`Failed to update status. Please check the console for details.`);
    } finally {
      setUpdatingId(null);
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-gray-900">No Reports Found</h3>
        <p className="mt-1 text-sm text-gray-500">There are no reports to display for this category.</p>
      </div>
    );
  }

  return (
    <div>
      {/* --- MOBILE CARD VIEW (Visible on small screens, hidden on medium and up) --- */}
      <div className="space-y-4 md:hidden">
        {isFilterable && isAdmin && (
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter-mobile" className="text-sm font-medium text-gray-700">Status:</label>
            <select
              id="status-filter-mobile"
              value={currentStatusFilter}
              onChange={(e) => onStatusFilterChange?.(e.target.value as StatusFilter)}
              className="text-sm p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
        {submissions.map((report) => (
          <div key={report._id} className="bg-gray-50 p-4 border rounded-lg shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-900 line-clamp-3">{report.mainText}</p>
                <p className="text-sm text-gray-500 mt-1">{report.modelTypes} @ {report.branchLocation}</p>
              </div>
              <button onClick={() => onViewSubmission(report)} className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-800 flex-shrink-0">View</button>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200">
              <div className="text-gray-600">
                <p>{report.submitterName}</p>
                <p>{new Date(report._creationTime).toLocaleDateString()}</p>
              </div>
              <div>
                {report.status ? <StatusBadge status={report.status} /> : <span className="text-gray-500">-</span>}
              </div>
            </div>
            {isAdmin && report.status === 'pending' && (
              <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
                { (report.type === 'serviceReport' || report.type === 'complaint') && (
                  <>
                    <button onClick={() => handleStatusUpdate(report._id, 'approved', report.type)} disabled={updatingId === report._id} className="text-sm font-medium text-green-600 hover:text-green-800 disabled:opacity-50">Approve</button>
                    <button onClick={() => handleStatusUpdate(report._id, 'rejected', report.type)} disabled={updatingId === report._id} className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50">Reject</button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- DESKTOP TABLE VIEW (Hidden on small screens, visible on medium and up) --- */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                {isAdmin && isFilterable ? (
                  <div className="flex items-center gap-2">
                    <span>Status</span>
                    <select value={currentStatusFilter} onChange={(e) => onStatusFilterChange?.(e.target.value as StatusFilter)} className="text-xs p-1 rounded-md border-gray-300" >
                      <option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
                    </select>
                  </div>
                ) : ('Status')}
              </th>
              {isAdmin && <th className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
              <th className="relative px-3 py-3"><span className="sr-only">View</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {submissions.map((report) => (
              <tr key={report._id}>
                <td className="px-3 py-4 max-w-xs">
                  <p className="font-medium text-gray-900 truncate">{report.mainText}</p>
                  <p className="text-gray-500 mt-1 truncate">{report.modelTypes} @ {report.branchLocation}</p>
                </td>
                <td className="px-3 py-4 text-gray-600">{report.submitterName}</td>
                <td className="px-3 py-4 text-gray-600">{new Date(report._creationTime).toLocaleDateString()}</td>
                <td className="px-3 py-4">{report.status ? <StatusBadge status={report.status} /> : <span className="text-gray-500">-</span>}</td>
                {isAdmin && (
                  <td className="px-3 py-4">
                    {report.status === 'pending' ? (
                      (report.type === 'serviceReport' || report.type === 'complaint') ? (
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleStatusUpdate(report._id, 'approved', report.type)}
                            disabled={updatingId === report._id}
                            className="font-medium text-green-600 hover:underline disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(report._id, 'rejected', report.type)}
                            disabled={updatingId === report._id}
                            className="font-medium text-red-600 hover:underline disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : null
                    ) : ( <span className="text-gray-500 italic">{report.status ? 'Resolved' : 'N/A'}</span> )}
                  </td>
                )}
                <td className="px-3 py-4 text-right">
                  <button onClick={() => onViewSubmission(report)} className="font-medium text-blue-600 hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};