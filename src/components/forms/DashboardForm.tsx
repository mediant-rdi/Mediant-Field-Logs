// components/forms/DashboardForm.tsx
'use client';

import { api } from '../../../convex/_generated/api';
import { Id, Doc } from '../../../convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { useState, useRef, useEffect } from 'react'; // --- MODIFIED: Added hooks for dropdown
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
  Tag,
  ThumbsUp,
  Briefcase,
  ChevronDown, // --- MODIFIED: Added icon
  Check,       // --- MODIFIED: Added icon
} from 'lucide-react';

export type EnrichedReport = ( | (Doc<'serviceReports'> & { type: 'serviceReport' }) | (Doc<'complaints'> & { type: 'complaint' }) | (Doc<'feedback'> & { type: 'feedback', status: 'pending' | 'can_be_implemented' | 'cannot_be_implemented' | 'waiting' | 'in_progress' | 'resolved' })) & { submitterName: string; locationName: string; machineName: string; mainText: string; status?: 'pending' | 'approved' | 'rejected' | 'can_be_implemented' | 'cannot_be_implemented' | 'waiting' | 'in_progress' | 'resolved'; resolutionStatus?: 'waiting' | 'in_progress' | 'resolved' | null; feedbackSource?: 'customer' | 'engineer'; };

export type ComplaintStatusFilter = 'all' | 'waiting' | 'in_progress' | 'resolved' | 'rejected';
export type FeedbackStatusFilter = 'all' | 'waiting' | 'in_progress' | 'resolved' | 'cannot_be_implemented';

type DashboardFormProps = {
  submissions: EnrichedReport[];
  isAdmin: boolean;
  currentComplaintStatusFilter?: ComplaintStatusFilter;
  onComplaintStatusFilterChange?: (filter: ComplaintStatusFilter) => void;
  currentFeedbackStatusFilter?: FeedbackStatusFilter;
  onFeedbackStatusFilterChange?: (filter: FeedbackStatusFilter) => void;
  isComplaintFilterable?: boolean;
  isFeedbackFilterable?: boolean;
  onViewSubmission: (submission: EnrichedReport) => void;
  activeTab: 'complaints' | 'feedback' | 'serviceReports' | 'needsReview' | null;
};

// --- Unchanged Components: StatusBadge, FeedbackStatusDisplay, ApprovedStatusDisplay, TypeIcon, ProblemTypeBadge, SourceTag ---
export const StatusBadge = ({ status }: { status: EnrichedReport['status'] }) => { if (!status) return null; const config: { [key: string]: { icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string; iconColor: string; } } = { pending: { icon: Clock, bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', text: 'text-amber-700', border: 'border-amber-200', iconColor: 'text-amber-500' }, approved: { icon: CheckCircle, bg: 'bg-gradient-to-r from-emerald-50 to-green-50', text: 'text-emerald-700', border: 'border-emerald-200', iconColor: 'text-emerald-500' }, rejected: { icon: XCircle, bg: 'bg-gradient-to-r from-red-50 to-rose-50', text: 'text-red-700', border: 'border-red-200', iconColor: 'text-red-500' }, cannot_be_implemented: { icon: XCircle, bg: 'bg-gradient-to-r from-slate-50 to-gray-50', text: 'text-slate-700', border: 'border-slate-200', iconColor: 'text-slate-500' }, waiting: { icon: Clock, bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', text: 'text-amber-700', border: 'border-amber-200', iconColor: 'text-amber-500' }, in_progress: { icon: Settings, bg: 'bg-gradient-to-r from-violet-50 to-purple-50', text: 'text-violet-700', border: 'border-violet-200', iconColor: 'text-violet-500' }, resolved: { icon: CheckCircle, bg: 'bg-gradient-to-r from-emerald-50 to-green-50', text: 'text-emerald-700', border: 'border-emerald-200', iconColor: 'text-emerald-500' }, }; const currentConfig = config[status] || config.pending; const { icon: Icon, bg, text, border, iconColor } = currentConfig; const label = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); return ( <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}><Icon className={`w-3 h-3 ${iconColor}`} />{label}</span> ); };
const FeedbackStatusDisplay = ({ status }: { status: EnrichedReport['status'] }) => { const isImplementable = ['waiting', 'in_progress', 'resolved'].includes(status || ''); if (isImplementable) { return ( <div className="flex flex-col items-end gap-2"><span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-700 border-sky-200"><ThumbsUp className="w-3 h-3 text-sky-500" />Can be Implemented</span><StatusBadge status={status} /></div> ); } return <StatusBadge status={status} />; };
const ApprovedStatusDisplay = ({ resolutionStatus }: { resolutionStatus?: 'waiting' | 'in_progress' | 'resolved' | null }) => { return ( <div className="flex flex-col items-end gap-2"><StatusBadge status="approved" />{resolutionStatus && <StatusBadge status={resolutionStatus} />}</div> ); };
const TypeIcon = ({ type }: { type: string }) => { const icons = { serviceReport: { icon: Settings, color: 'text-blue-500', bg: 'bg-blue-50' }, complaint: { icon: MessageSquare, color: 'text-red-500', bg: 'bg-red-50' }, feedback: { icon: FileText, color: 'text-green-500', bg: 'bg-green-50' } }; const config = icons[type as keyof typeof icons] || icons.serviceReport; const { icon: Icon, color, bg } = config; return ( <div className={`p-2 rounded-lg ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div> ); };
const ProblemTypeBadge = ({ type }: { type: string }) => { const typeLabels = { electrical: 'Electrical', mechanical: 'Mechanical', software: 'Software', 'service-delay': 'Service Delay', 'equipment-fault': 'Equipment Fault', 'poor-experience': 'Poor Experience', other: 'Other' }; return ( <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"><Tag className="w-3 h-3" />{typeLabels[type as keyof typeof typeLabels] || type}</span> ); };
const SourceTag = ({ source }: { source: 'customer' | 'engineer' }) => { const config = { customer: { label: 'Customer Feedback', icon: User, bg: 'bg-blue-50', text: 'text-blue-700' }, engineer: { label: 'Engineer Feedback', icon: Briefcase, bg: 'bg-slate-100', text: 'text-slate-700' }, }; const current = config[source]; const { icon: Icon } = current; return ( <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${current.bg} ${current.text}`}><Icon className="w-3 h-3" />{current.label}</span> ); };


// --- MODIFIED: New reusable dropdown component for mobile filters ---
const MobileFilterDropdown = <T extends string>({ options, value, onChange }: { options: { value: T, label: string }[]; value: T; onChange: (value: T) => void; }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full">
        <span>{selectedOption.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-2 w-full origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {options.map(({ value: optionValue, label }) => (
              <button key={optionValue} onClick={() => { onChange(optionValue); setIsOpen(false); }} className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900">
                <span>{label}</span>
                {value === optionValue && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MODIFIED: Component now renders a different UI for mobile vs desktop ---
const ComplaintStatusFilterComponent = ({ value, onChange }: { value: ComplaintStatusFilter; onChange: (filter: ComplaintStatusFilter) => void }) => {
  const options: { value: ComplaintStatusFilter; label: string; }[] = [ { value: 'all', label: 'All' }, { value: 'waiting', label: 'Waiting' }, { value: 'in_progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }, { value: 'rejected', label: 'Rejected' }, ];
  return ( 
    <>
      {/* Desktop View: Segmented Control */}
      <div className="hidden md:flex flex-wrap bg-gray-100 rounded-lg p-1">{options.map(option => ( <button key={option.value} onClick={() => onChange(option.value)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${ value === option.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50' }`}>{option.label.replace(/_/g, ' ')}</button>))}</div>
      {/* Mobile View: Dropdown */}
      <div className="md:hidden w-full">
        <MobileFilterDropdown options={options} value={value} onChange={onChange} />
      </div>
    </>
  );
};

// --- MODIFIED: Component now renders a different UI for mobile vs desktop ---
const FeedbackStatusFilterComponent = ({ value, onChange }: { value: FeedbackStatusFilter; onChange: (filter: FeedbackStatusFilter) => void }) => {
  const options: { value: FeedbackStatusFilter; label: string }[] = [ { value: 'all', label: 'All' }, { value: 'waiting', label: 'Waiting' }, { value: 'in_progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }, { value: 'cannot_be_implemented', label: 'Cannot Implement' }, ];
  return ( 
    <>
      {/* Desktop View: Segmented Control */}
      <div className="hidden md:flex flex-wrap bg-gray-100 rounded-lg p-1">{options.map(option => ( <button key={option.value} onClick={() => onChange(option.value)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${ value === option.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50' }`}>{option.label.replace(/_/g, ' ')}</button>))}</div>
      {/* Mobile View: Dropdown */}
      <div className="md:hidden w-full">
        <MobileFilterDropdown options={options} value={value} onChange={onChange} />
      </div>
    </> 
  );
};

export const DashboardForm = ({ 
  submissions, 
  isAdmin, 
  currentComplaintStatusFilter = 'all', 
  onComplaintStatusFilterChange, 
  currentFeedbackStatusFilter = 'all',
  onFeedbackStatusFilterChange,
  isComplaintFilterable,
  isFeedbackFilterable,
  onViewSubmission,
}: DashboardFormProps) => {
  const updateServiceReport = useMutation(api.serviceReports.updateServiceReportStatus);
  const updateComplaint = useMutation(api.complaints.updateComplaintStatus);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (id: Id<'serviceReports'> | Id<'complaints'>, status: 'approved' | 'rejected', type: 'serviceReport' | 'complaint') => {
    setUpdatingId(id);
    try {
      if (type === 'serviceReport') { await updateServiceReport({ serviceReportId: id as Id<'serviceReports'>, status }); } 
      else if (type === 'complaint') { await updateComplaint({ complaintId: id as Id<'complaints'>, status }); }
    } catch (error) { console.error(`Failed to update ${type} status:`, error); } 
    finally { setUpdatingId(null); }
  };

  return (
    <div className="space-y-6">
      {/* --- MODIFIED: Main container for filters, with responsive layout --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {isComplaintFilterable && onComplaintStatusFilterChange && (
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 w-full md:w-auto">
            <span className="text-sm font-medium text-gray-700 flex-shrink-0">Filter by status:</span>
            <ComplaintStatusFilterComponent value={currentComplaintStatusFilter} onChange={onComplaintStatusFilterChange} />
          </div>
        )}
        {isAdmin && isFeedbackFilterable && onFeedbackStatusFilterChange && (
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 w-full md:w-auto">
            <span className="text-sm font-medium text-gray-700 flex-shrink-0">Filter by status:</span>
            <FeedbackStatusFilterComponent value={currentFeedbackStatusFilter} onChange={onFeedbackStatusFilterChange} />
          </div>
        )}
        <div className="text-sm text-gray-500 text-left md:text-right flex-shrink-0">
          {(isComplaintFilterable || (isFeedbackFilterable && isAdmin)) && (
            <span>{submissions.length} item{submissions.length !== 1 ? 's' : ''} found</span>
          )}
        </div>
      </div>

      {submissions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{submissions.map((report) => (
          <div key={report._id} className="group flex flex-col bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
            <div className="flex-grow">
              <div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><TypeIcon type={report.type} /><div><h3 className="font-semibold text-gray-900 text-sm">{report.type === 'serviceReport' ? 'Engineer Complaint' : report.type === 'complaint' ? 'Customer Complaints' : 'Feedback'}</h3><p className="text-xs text-gray-500">{new Date(report._creationTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div></div>{report.type === 'feedback' ? ( <FeedbackStatusDisplay status={report.status} /> ) : report.status === 'approved' ? ( <ApprovedStatusDisplay resolutionStatus={report.resolutionStatus} /> ) : ( report.status && <StatusBadge status={report.status} /> )}</div>
              <div className="space-y-3 mb-4"><p className="text-gray-900 text-sm leading-relaxed line-clamp-3">{report.mainText}</p><div className="flex flex-wrap items-center gap-2">{(report.type === 'serviceReport' || report.type === 'complaint') && ( <ProblemTypeBadge type={report.problemType} /> )}{report.type === 'feedback' && report.feedbackSource && ( <SourceTag source={report.feedbackSource} /> )}</div><div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500"><div className="flex items-center gap-1.5"><User className="w-3 h-3" />{report.submitterName}</div><div className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{report.locationName}</div><div className="flex items-center gap-1.5"><Settings className="w-3 h-3" />{report.machineName}</div></div></div>
            </div>
            <div className="mt-auto pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center gap-3"><button onClick={() => onViewSubmission(report)} className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="w-4 h-4" />View Details</button>{isAdmin && report.status === 'pending' && (report.type === 'serviceReport' || report.type === 'complaint') && ( <div className="flex items-center gap-2 w-full sm:w-auto"><button onClick={() => handleStatusUpdate(report._id, 'approved', report.type)} disabled={updatingId === report._id} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors disabled:opacity-50"><CheckCircle className="w-3 h-3" />Approve</button><button onClick={() => handleStatusUpdate(report._id, 'rejected', report.type)} disabled={updatingId === report._id} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"><XCircle className="w-3 h-3" />Reject</button></div> )}</div>
          </div> 
        ))}</div>
      ) : (
        <div className="text-center py-12 px-6 sm:py-20"><div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4"><FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" /></div><h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Found</h3><p className="text-gray-500 max-w-md mx-auto">There are no reports to display for this category or filter. Try selecting a different filter option.</p></div>
      )}
    </div>
  );
};