// app/dashboard/reports/machine-dev/page.tsx
'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { type FunctionReturnType } from "convex/server";
import { Trash2, Download, AlertTriangle, Search, X, Eye, FileText } from "lucide-react";
import type { InputHTMLAttributes } from 'react';

type ReportType = FunctionReturnType<typeof api.reports.getReports>[number];

// --- MODERN SEARCH BAR COMPONENT (No changes) ---
interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onClear: () => void;
}
const SearchBar = ({ value, onChange, onClear, className, ...props }: SearchBarProps) => {
  return (
    <div className={`relative w-full max-w-md ${className || ''}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
      </div>
      <input
        type="text" 
        className="block w-full rounded-md border-gray-300 py-2 pl-10 pr-10 text-sm placeholder-gray-500 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        value={value}
        onChange={onChange}
        {...props}
      />
      {value && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <button
            type="button"
            onClick={onClear}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

// --- RESPONSIVE LOADING SKELETON (No changes) ---
const TableSkeleton = () => (
  <div className="animate-pulse mt-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-12 rounded bg-gray-200 mb-2"></div>
    ))}
  </div>
);

// --- RESPONSIVE MODAL COMPONENT (No changes) ---
const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div 
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div 
      className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" 
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

// --- DELETE CONFIRMATION UI (No changes) ---
const DeleteConfirmation = ({ 
  report, 
  onConfirm, 
  onCancel,
  isDeleting
}: { 
  report: ReportType; 
  onConfirm: () => void; 
  onCancel: () => void;
  isDeleting: boolean;
}) => (
  <>
    <div className="sm:flex sm:items-start">
      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
      </div>
      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Report</h3>
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete the report “<strong>{report.fileName}</strong>”? This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
      <button
        type="button"
        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50"
        onClick={onConfirm}
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
      <button
        type="button"
        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
        onClick={onCancel}
        disabled={isDeleting}
      >
        Cancel
      </button>
    </div>
  </>
);

// --- DESCRIPTION VIEWER COMPONENT (No changes) ---
const DescriptionViewer = ({
  title,
  description,
  onClose
}: {
  title: string;
  description: string;
  onClose: () => void;
}) => (
  <>
    <div className="sm:flex sm:items-start">
       <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
        <FileText className="h-6 w-6 text-blue-600" aria-hidden="true" />
      </div>
      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Full Description</h3>
        <p className="text-sm font-semibold text-gray-700 mt-1">{title}</p>
        <div className="mt-2 max-h-60 overflow-y-auto pr-2">
          <p className="text-sm text-gray-500 whitespace-pre-wrap">
            {description}
          </p>
        </div>
      </div>
    </div>
    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
      <button
        type="button"
        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  </>
);

// --- FILE PREVIEWER COMPONENT (No changes) ---
const FilePreviewer = ({ report, onClose }: { report: ReportType; onClose: () => void }) => {
  const isPdf = report.fileType === 'application/pdf';
  const isDocx = report.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  let previewUrl = '';
  if (isPdf && report.fileUrl) {
    previewUrl = report.fileUrl;
  } else if (isDocx && report.fileUrl) {
    // Use Google's viewer for DOCX files
    previewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(report.fileUrl)}&embedded=true`;
  }
  
  return (
    <div
      className="fixed inset-0 bg-black/75 flex flex-col items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white p-2 sm:p-4 rounded-lg shadow-xl w-full h-full max-w-5xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-2 pb-2 border-b flex-shrink-0">
          <h3 className="font-medium text-gray-800 truncate pr-4">{report.fileName}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="h-6 w-6" />
          </button>
        </div>
        {previewUrl ? (
          <iframe src={previewUrl} className="w-full h-full border-0" title="File Preview" />
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-gray-600">Preview is not available for this file type.</p>
          </div>
        )}
      </div>
    </div>
  );
};


export default function MachineDevelopmentReportsPage() {
  const reports = useQuery(api.reports.getReports);
  const user = useQuery(api.users.current);
  const removeReport = useMutation(api.reports.remove);

  const [searchQuery, setSearchQuery] = useState("");
  const [reportToDelete, setReportToDelete] = useState<ReportType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reportToPreview, setReportToPreview] = useState<ReportType | null>(null);
  const [reportToViewDescription, setReportToViewDescription] = useState<ReportType | null>(null);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    const normalizeText = (str: string) => str.toLowerCase().replace(/[\s-]/g, '');
    const normalizedQuery = normalizeText(searchQuery.trim());
    if (!normalizedQuery) return reports;

    return reports.filter(report => {
        const normalizedFileName = normalizeText(report.fileName);
        const normalizedMachineName = normalizeText(report.machineName || "");
        return normalizedFileName.includes(normalizedQuery) || 
               normalizedMachineName.includes(normalizedQuery);
    });
  }, [reports, searchQuery]);

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;
    setIsDeleting(true);
    try {
      await removeReport({ id: reportToDelete._id });
      setReportToDelete(null);
    } catch (error) {
      console.error("Failed to delete report:", error);
      alert("An error occurred while deleting the report.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const DESCRIPTION_TRUNCATE_LIMIT = 100;
  const isPreviewable = (fileType: string) =>
    ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(fileType);

  const isLoading = reports === undefined || user === undefined;
  const isAdmin = user?.isAdmin;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Machine Reports</h1>
        {isAdmin && (
          <Link href="/dashboard/reports/add" className="self-start sm:self-auto bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            + Add Report
          </Link>
        )}
      </div>

      <div className="mb-6">
        <SearchBar
          placeholder="Search by file name or machine model..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
          disabled={isLoading}
        />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : reports.length === 0 ? (
        <p className="text-center py-5 text-gray-500">No reports found. {isAdmin ? 'Click "Add Report" to get started.' : ''}</p>
      ) : filteredReports.length === 0 ? (
         <p className="text-center py-5 text-gray-500">No reports match your search criteria.</p>
      ) : (
        <>
          {/* Mobile View: Cards (No changes) */}
          <div className="space-y-4 md:hidden">
            {filteredReports.map((report) => {
              const isDescriptionLong = (report.description?.length ?? 0) > DESCRIPTION_TRUNCATE_LIMIT;
              return (
              <div key={report._id} className="bg-gray-50 p-4 border rounded-lg shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <p className="font-semibold text-gray-900 truncate min-w-0" title={report.fileName}>{report.fileName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{report.machineName}</p>
                  <p className="text-sm text-gray-500">Uploaded by {report.uploaderName}</p>
                  <div className="text-sm text-gray-600 mt-1">
                    <p className="line-clamp-3">{report.description || 'N/A'}</p>
                    {isDescriptionLong && (
                      <button onClick={() => setReportToViewDescription(report)} className="text-blue-600 hover:underline text-sm font-semibold">
                        View More
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-gray-200">
                  {isPreviewable(report.fileType) && (
                    <button onClick={() => setReportToPreview(report)} className="text-sm font-medium text-green-600 hover:text-green-800 flex items-center gap-1"><Eye className="h-4 w-4" /> View</button>
                  )}
                  <Link href={report.fileUrl!} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"><Download className="h-4 w-4" /> Download</Link>
                  {isAdmin && (<button className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1" onClick={() => setReportToDelete(report)}><Trash2 className="h-4 w-4" /> Delete</button>)}
                </div>
              </div>
            )})}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-3 py-3 font-medium w-[20%]">Machine Name</th>
                  <th className="px-3 py-3 font-medium w-[25%]">File Name</th>
                  <th className="px-3 py-3 font-medium w-[25%]">Description</th>
                  <th className="px-3 py-3 font-medium w-[15%]">Uploaded By</th>
                  <th className="px-3 py-3 font-medium w-[15%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReports.map((report) => {
                  const isDescriptionLong = (report.description?.length ?? 0) > DESCRIPTION_TRUNCATE_LIMIT;
                  return (
                  <tr key={report._id}>
                    <td className="px-3 py-4 font-medium text-gray-800 align-top">{report.machineName}</td>
                    <td className="px-3 py-4 text-gray-700 truncate max-w-xs align-top" title={report.fileName}>{report.fileName}</td>
                    {/* --- FIX: Added `break-words` to the className to prevent overflow --- */}
                    <td className="px-3 py-4 text-gray-600 max-w-md align-top break-words">
                      {isDescriptionLong ? (
                        <span>
                          {report.description.substring(0, DESCRIPTION_TRUNCATE_LIMIT)}...
                          <button onClick={() => setReportToViewDescription(report)} className="text-blue-600 hover:underline ml-1 font-semibold">
                            View More
                          </button>
                        </span>
                      ) : (
                        report.description || 'N/A'
                      )}
                    </td>
                    <td className="px-3 py-4 text-gray-600 truncate align-top" title={report.uploaderName}>{report.uploaderName}</td>
                    <td className="px-3 py-4 text-right align-top">
                      <div className="flex items-center justify-end gap-x-4">
                        {isPreviewable(report.fileType) && (
                           <button onClick={() => setReportToPreview(report)} className="text-sm text-green-600 hover:underline">View</button>
                        )}
                        <Link href={report.fileUrl!} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Download</Link>
                        {isAdmin && (
                          <button className="text-sm text-red-600 hover:underline" onClick={() => setReportToDelete(report)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      {/* Modals (No changes) */}
      {reportToDelete && (
        <Modal onClose={() => setReportToDelete(null)}>
          <DeleteConfirmation 
            report={reportToDelete}
            onConfirm={handleConfirmDelete}
            onCancel={() => setReportToDelete(null)}
            isDeleting={isDeleting}
          />
        </Modal>
      )}

      {reportToViewDescription && (
        <Modal onClose={() => setReportToViewDescription(null)}>
          <DescriptionViewer 
            title={reportToViewDescription.fileName}
            description={reportToViewDescription.description}
            onClose={() => setReportToViewDescription(null)}
          />
        </Modal>
      )}

      {reportToPreview && (
        <FilePreviewer
          report={reportToPreview}
          onClose={() => setReportToPreview(null)}
        />
      )}
    </div>
  );
}