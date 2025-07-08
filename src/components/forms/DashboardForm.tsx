// components/forms/DashboardForm.tsx
'use client';

import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  FileText, 
  MessageSquare, 
  Settings,
  User,
  MapPin,
  Tag
} from 'lucide-react';

// --- Types ---
type BaseReport = {
  _creationTime: number;
  modelTypes: string;
  branchLocation: string;
  submitterName: string;
  mainText: string;
};

type ServiceReportWithSubmitter = BaseReport & {
  _id: Id<'serviceReports'>;
  type: 'serviceReport';
  status: 'pending' | 'approved' | 'rejected';
  complaintText: string;
  solution: string;
  problemType: 'electrical' | 'mechanical' | 'software' | 'service-delay' | 'other';
  backofficeAccess: boolean;
  spareDelay: boolean;
  delayedReporting: boolean;
  communicationBarrier: boolean;
  otherText?: string;
  imageId?: Id<'_storage'>;
};

type ComplaintWithSubmitter = BaseReport & {
  _id: Id<'complaints'>;
  type: 'complaint';
  status: 'pending' | 'approved' | 'rejected';
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
  imageId?: Id<'_storage'>;
};

type FeedbackWithSubmitter = BaseReport & {
  _id: Id<'feedback'>;
  type: 'feedback';
  status?: undefined;
  feedbackDetails: string;
  imageId?: Id<'_storage'>;
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

// --- Modern StatusBadge ---
export const StatusBadge = ({ status }: { status: 'pending' | 'approved' | 'rejected' }) => {
  const config = {
    pending: { 
      icon: Clock, 
      bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', 
      text: 'text-amber-700',
      border: 'border-amber-200',
      iconColor: 'text-amber-500'
    },
    approved: { 
      icon: CheckCircle, 
      bg: 'bg-gradient-to-r from-emerald-50 to-green-50', 
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      iconColor: 'text-emerald-500'
    },
    rejected: { 
      icon: XCircle, 
      bg: 'bg-gradient-to-r from-red-50 to-rose-50', 
      text: 'text-red-700',
      border: 'border-red-200',
      iconColor: 'text-red-500'
    }
  };

  const { icon: Icon, bg, text, border, iconColor } = config[status];
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
      <Icon className={`w-3 h-3 ${iconColor}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// --- Type Icon Component ---
const TypeIcon = ({ type }: { type: string }) => {
  const icons = {
    serviceReport: { icon: Settings, color: 'text-blue-500', bg: 'bg-blue-50' },
    complaint: { icon: MessageSquare, color: 'text-red-500', bg: 'bg-red-50' },
    feedback: { icon: FileText, color: 'text-green-500', bg: 'bg-green-50' }
  };
  
  const config = icons[type as keyof typeof icons] || icons.serviceReport;
  const { icon: Icon, color, bg } = config;
  
  return (
    <div className={`p-2 rounded-lg ${bg}`}>
      <Icon className={`w-4 h-4 ${color}`} />
    </div>
  );
};

// --- Problem Type Badge ---
const ProblemTypeBadge = ({ type }: { type: string }) => {
  const typeLabels = {
    electrical: 'Electrical',
    mechanical: 'Mechanical',
    software: 'Software',
    'service-delay': 'Service Delay',
    'equipment-fault': 'Equipment Fault',
    'poor-experience': 'Poor Experience',
    other: 'Other'
  };
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
      <Tag className="w-3 h-3" />
      {typeLabels[type as keyof typeof typeLabels] || type}
    </span>
  );
};

// --- Modern Filter Component ---
const StatusFilter = ({ value, onChange }: { value: StatusFilter; onChange: (filter: StatusFilter) => void }) => {
  const options: { value: StatusFilter; label: string; count?: number }[] = [
    { value: 'all', label: 'All Reports' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap bg-gray-100 rounded-lg p-1">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              value === option.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const DashboardForm = ({ 
  submissions, 
  isAdmin, 
  currentStatusFilter = 'all', 
  onStatusFilterChange, 
  isFilterable, 
  onViewSubmission 
}: DashboardFormProps) => {
  const updateServiceReport = useMutation(api.serviceReports.updateServiceReportStatus);
  const updateComplaint = useMutation(api.complaints.updateComplaintStatus);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (
    id: Id<'serviceReports'> | Id<'complaints'>, 
    status: 'approved' | 'rejected', 
    type: 'serviceReport' | 'complaint'
  ) => {
    setUpdatingId(id);
    try {
      if (type === 'serviceReport') {
        await updateServiceReport({ serviceReportId: id as Id<'serviceReports'>, status });
      } else if (type === 'complaint') {
        await updateComplaint({ complaintId: id as Id<'complaints'>, status });
      }
    } catch (error) {
      console.error(`Failed to update ${type} status:`, error);
    } finally {
      setUpdatingId(null);
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 px-6 sm:py-20">
        <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          There are no reports to display for this category. Reports will appear here once they are submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      {isFilterable && isAdmin && onStatusFilterChange && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            <StatusFilter value={currentStatusFilter} onChange={onStatusFilterChange} />
          </div>
          <div className="text-sm text-gray-500">
            {submissions.length} report{submissions.length !== 1 ? 's' : ''} found
          </div>
        </div>
      )}

      {/* Modern Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((report) => (
          <div key={report._id} className="group flex flex-col bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
            <div className="flex-grow">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <TypeIcon type={report.type} />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {report.type === 'serviceReport' ? 'Service Report' : 
                         report.type === 'complaint' ? 'Complaint' : 'Feedback'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(report._creationTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  {report.status && <StatusBadge status={report.status} />}
                </div>

                {/* Content */}
                <div className="space-y-3 mb-4">
                  <p className="text-gray-900 text-sm leading-relaxed line-clamp-3">
                    {report.mainText}
                  </p>
                  
                  {/* Problem Type */}
                  {(report.type === 'serviceReport' || report.type === 'complaint') && (
                    <ProblemTypeBadge type={report.problemType} />
                  )}
                  
                  {/* Metadata */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      {report.submitterName}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {report.branchLocation}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-3 h-3" />
                      {report.modelTypes}
                    </div>
                  </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => onViewSubmission(report)}
                className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
              
              {isAdmin && report.status === 'pending' && (report.type === 'serviceReport' || report.type === 'complaint') && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleStatusUpdate(report._id, 'approved', report.type)}
                    disabled={updatingId === report._id}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(report._id, 'rejected', report.type)}
                    disabled={updatingId === report._id}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3 h-3" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};