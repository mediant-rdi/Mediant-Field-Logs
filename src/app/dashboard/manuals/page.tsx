// app/dashboard/manuals/page.tsx
'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
// MODIFIED: Added useConvex import
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { type FunctionReturnType } from "convex/server";
import { Trash2, Download, AlertTriangle, Search, X, Eye, FileText, Loader2 } from "lucide-react";
import type { InputHTMLAttributes } from 'react';

// --- TYPE DEFINITION: Note that `fileUrl` will no longer be part of this type from the initial fetch. ---
type ManualType = FunctionReturnType<typeof api.manuals.getManuals>[number];

// --- MODERN SEARCH BAR COMPONENT (Unchanged) ---
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


// --- RESPONSIVE LOADING SKELETON (Unchanged) ---
const TableSkeleton = () => (
  <div className="animate-pulse mt-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-12 rounded bg-gray-200 mb-2"></div>
    ))}
  </div>
);

// --- RESPONSIVE MODAL COMPONENT (Unchanged) ---
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

// --- DELETE CONFIRMATION UI (Unchanged) ---
const DeleteConfirmation = ({ 
  manual, 
  onConfirm, 
  onCancel,
  isDeleting
}: { 
  manual: ManualType; 
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
        <h3 className="text-lg font-medium leading-6 text-gray-900">Delete Manual</h3>
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete the manual “<strong>{manual.fileName}</strong>”? This action cannot be undone.
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

// --- DESCRIPTION VIEWER COMPONENT (Unchanged) ---
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

// --- FILE PREVIEWER COMPONENT (Unchanged but should now work correctly) ---
const FilePreviewer = ({ manual, onClose }: { manual: ManualType; onClose: () => void }) => {
  // This uses the correct `useQuery` hook for reactive data fetching.
  const fileUrl = useQuery(api.manuals.getManualUrl, { storageId: manual.fileStorageId });
  
  const isPdf = manual.fileType === 'application/pdf';
  const isDocx = manual.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  let previewUrl = '';
  if (fileUrl) { // Only construct the preview URL if the fileUrl has been fetched
    if (isPdf) {
      previewUrl = fileUrl;
    } else if (isDocx) {
      previewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    }
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
          <h3 className="font-medium text-gray-800 truncate pr-4">{manual.fileName}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="h-6 w-6" />
          </button>
        </div>
        {/* Show a loading indicator while the URL is being fetched */}
        {fileUrl === undefined ? (
           <div className="flex-grow flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="text-gray-600 mt-4">Preparing preview...</p>
          </div>
        ) : previewUrl ? (
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

// --- CORRECTED: DOWNLOAD BUTTON COMPONENT ---
// A button that fetches the URL on click and then opens it.
const DownloadButton = ({ manual, children, className }: { manual: ManualType; children: React.ReactNode; className?: string }) => {
    const convex = useConvex(); // Get the Convex client
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            // Use the Convex client to call the query imperatively
            const url = await convex.query(api.manuals.getManualUrl, { 
              storageId: manual.fileStorageId 
            });
            
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            } else {
                alert("Could not retrieve download link.");
            }
        } catch (error) {
            console.error("Download failed:", error);
            alert("An error occurred while preparing the download.");
        } finally {
            setIsDownloading(false);
        }
    };
    
    return (
        <button onClick={handleDownload} disabled={isDownloading} className={className}>
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
        </button>
    );
};

export default function MachineManualsPage() {
  // --- DATA LOGIC: Unchanged, but now receives lighter data (no file URLs) ---
  const manuals = useQuery(api.manuals.getManuals);
  const user = useQuery(api.users.current);
  const removeManual = useMutation(api.manuals.remove);

  // --- STATE: Unchanged ---
  const [searchQuery, setSearchQuery] = useState("");
  const [manualToDelete, setManualToDelete] = useState<ManualType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [manualToPreview, setManualToPreview] = useState<ManualType | null>(null);
  const [manualToViewDescription, setManualToViewDescription] = useState<ManualType | null>(null);

  // --- FILTERING LOGIC: Unchanged ---
  const filteredManuals = useMemo(() => {
    if (!manuals) return [];
    const normalizeText = (str: string) => str.toLowerCase().replace(/[\s-]/g, '');
    const normalizedQuery = normalizeText(searchQuery.trim());
    if (!normalizedQuery) return manuals;

    return manuals.filter(manual => {
        const normalizedFileName = normalizeText(manual.fileName);
        const normalizedMachineName = normalizeText(manual.machineName || "");
        return normalizedFileName.includes(normalizedQuery) || 
               normalizedMachineName.includes(normalizedQuery);
    });
  }, [manuals, searchQuery]);

  // --- DELETE LOGIC: Unchanged ---
  const handleConfirmDelete = async () => {
    if (!manualToDelete) return;
    setIsDeleting(true);
    try {
      await removeManual({ id: manualToDelete._id });
      setManualToDelete(null);
    } catch (error) {
      console.error("Failed to delete manual:", error);
      alert("An error occurred while deleting the manual.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const DESCRIPTION_TRUNCATE_LIMIT = 100;
  const isPreviewable = (fileType: string) =>
    ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(fileType);

  const isLoading = manuals === undefined || user === undefined;
  const isAdmin = user?.isAdmin;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      {/* --- HEADER: Unchanged --- */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Machine Manuals</h1>
        {isAdmin && (
          <Link href="/dashboard/manuals/add" className="self-start sm:self-auto bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            + Add Manual
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
      ) : manuals.length === 0 ? (
        <p className="text-center py-5 text-gray-500">No manuals found. {isAdmin ? 'Click "Add Manual" to get started.' : ''}</p>
      ) : filteredManuals.length === 0 ? (
         <p className="text-center py-5 text-gray-500">No manuals match your search criteria.</p>
      ) : (
        <>
          {/* --- MOBILE VIEW: Updated to use DownloadButton --- */}
          <div className="space-y-4 md:hidden">
            {filteredManuals.map((manual) => {
              const isDescriptionLong = (manual.description?.length ?? 0) > DESCRIPTION_TRUNCATE_LIMIT;
              return (
              <div key={manual._id} className="bg-gray-50 p-4 border rounded-lg shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <p className="font-semibold text-gray-900 truncate min-w-0" title={manual.fileName}>{manual.fileName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{manual.machineName}</p>
                  <p className="text-sm text-gray-500">Uploaded by {manual.uploaderName}</p>
                  <div className="text-sm text-gray-600 mt-1">
                    <p className="line-clamp-3">{manual.description || 'N/A'}</p>
                    {isDescriptionLong && (
                      <button onClick={() => setManualToViewDescription(manual)} className="text-blue-600 hover:underline text-sm font-semibold">
                        View More
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 border-t border-gray-200">
                  {isPreviewable(manual.fileType) && (
                    <button onClick={() => setManualToPreview(manual)} className="text-sm font-medium text-green-600 hover:text-green-800 flex items-center gap-1"><Eye className="h-4 w-4" /> View</button>
                  )}
                  <DownloadButton manual={manual} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <Download className="h-4 w-4" /> Download
                  </DownloadButton>
                  {isAdmin && (<button className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1" onClick={() => setManualToDelete(manual)}><Trash2 className="h-4 w-4" /> Delete</button>)}
                </div>
              </div>
            )})}
          </div>

          {/* --- DESKTOP VIEW: Updated to use DownloadButton --- */}
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
                {filteredManuals.map((manual) => {
                  const isDescriptionLong = (manual.description?.length ?? 0) > DESCRIPTION_TRUNCATE_LIMIT;
                  return (
                  <tr key={manual._id}>
                    <td className="px-3 py-4 font-medium text-gray-800 align-top">{manual.machineName}</td>
                    <td className="px-3 py-4 text-gray-700 truncate max-w-xs align-top" title={manual.fileName}>{manual.fileName}</td>
                    <td className="px-3 py-4 text-gray-600 max-w-md align-top break-words">
                      {isDescriptionLong ? (
                        <span>
                          {manual.description.substring(0, DESCRIPTION_TRUNCATE_LIMIT)}...
                          <button onClick={() => setManualToViewDescription(manual)} className="text-blue-600 hover:underline ml-1 font-semibold">
                            View More
                          </button>
                        </span>
                      ) : (
                        manual.description || 'N/A'
                      )}
                    </td>
                    <td className="px-3 py-4 text-gray-600 truncate align-top" title={manual.uploaderName}>{manual.uploaderName}</td>
                    <td className="px-3 py-4 text-right align-top">
                      <div className="flex items-center justify-end gap-x-4">
                        {isPreviewable(manual.fileType) && (
                           <button onClick={() => setManualToPreview(manual)} className="text-sm text-green-600 hover:underline">View</button>
                        )}
                        <DownloadButton manual={manual} className="text-sm text-blue-600 hover:underline">Download</DownloadButton>
                        {isAdmin && (
                          <button className="text-sm text-red-600 hover:underline" onClick={() => setManualToDelete(manual)}>Delete</button>
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
      
      {/* --- MODALS: Unchanged, but now work with the new components --- */}
      {manualToDelete && (
        <Modal onClose={() => setManualToDelete(null)}>
          <DeleteConfirmation 
            manual={manualToDelete}
            onConfirm={handleConfirmDelete}
            onCancel={() => setManualToDelete(null)}
            isDeleting={isDeleting}
          />
        </Modal>
      )}

      {manualToViewDescription && (
        <Modal onClose={() => setManualToViewDescription(null)}>
          <DescriptionViewer 
            title={manualToViewDescription.fileName}
            description={manualToViewDescription.description}
            onClose={() => setManualToViewDescription(null)}
          />
        </Modal>
      )}

      {manualToPreview && (
        <FilePreviewer
          manual={manualToPreview}
          onClose={() => setManualToPreview(null)}
        />
      )}
    </div>
  );
}