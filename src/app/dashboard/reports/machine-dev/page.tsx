// app/dashboard/reports/machine-dev/page.tsx
'use client';

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { Trash2, Download, AlertTriangle, FileText, Cog, Calendar } from "lucide-react";
// I have kept this import path as you specified.
import { type FunctionReturnType } from "convex/server";

type ReportType = FunctionReturnType<typeof api.reports.getReports>[number];

export default function MachineDevelopmentReportsPage() {
  const user = useQuery(api.users.current);
  const reports = useQuery(api.reports.getReports);
  const removeReport = useMutation(api.reports.remove);

  const [reportToDelete, setReportToDelete] = useState<ReportType | null>(null);

  const handleOpenDeleteModal = (report: ReportType) => setReportToDelete(report);
  const handleCloseDeleteModal = () => setReportToDelete(null);

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;
    try {
      await removeReport({ id: reportToDelete._id });
      handleCloseDeleteModal();
    } catch (error) {
      console.error("Failed to delete report:", error);
      alert("Error: You might not have permission to delete this report.");
    }
  };

  return (
    <>
      {/* --- FIX: Re-inserted the full modal content, which uses the variables --- */}
      {reportToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
            <div className="flex items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                {/* 'AlertTriangle' is now used here */}
                <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Delete Report
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete the report “<strong>{reportToDelete.fileName}</strong>”? This action will permanently remove the file and its record. This cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                // 'handleConfirmDelete' is now used here
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                onClick={handleCloseDeleteModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Container */}
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Machine Reports
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Download or manage machine development reports from this page.
        </p>

        <div className="mt-8">
          {reports === undefined && (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading reports...</p>
            </div>
          )}
          {reports && reports.length === 0 && (
            <div className="mt-6 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <p className="text-center text-gray-500">
                No reports have been added yet. Admins can add reports via the sidebar.
              </p>
            </div>
          )}

          {reports && reports.length > 0 && (
            <>
              {/* --- CARD VIEW FOR MOBILE (default) --- */}
              <div className="space-y-4 lg:hidden">
                {reports.map((report) => (
                  <div key={report._id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                         <div className="flex items-center gap-2 text-sm">
                           <Cog className="h-4 w-4 text-gray-500" />
                           <span className="font-semibold text-gray-800">{report.machineName}</span>
                         </div>
                         <div className="flex items-center gap-2 text-sm">
                           <FileText className="h-4 w-4 text-gray-500" />
                           <span className="text-gray-600">{report.fileName}</span>
                         </div>
                         <div className="flex items-center gap-2 text-xs text-gray-500">
                           <Calendar className="h-4 w-4" />
                           <span>{new Date(report._creationTime).toLocaleDateString()}</span>
                         </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-md border">{report.description}</p>
                    <div className="mt-4 pt-3 border-t flex items-center justify-end gap-x-4">
                      <Link href={report.fileUrl!} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium" title="Download File">
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </Link>
                      {user?.isAdmin && (
                        <button onClick={() => handleOpenDeleteModal(report)} className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm font-medium" title="Delete Report">
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* --- TABLE VIEW FOR LARGER SCREENS --- */}
              <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded At</th>
                      <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reports.map((report) => (
                      <tr key={report._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{report.machineName}</td>
                        <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-500" style={{ maxWidth: '24rem' }}>{report.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.fileName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(report._creationTime).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-x-4">
                            <Link href={report.fileUrl!} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600" title="Download File"><Download className="h-5 w-5" /></Link>
                            {user?.isAdmin && (<button onClick={() => handleOpenDeleteModal(report)} className="text-gray-500 hover:text-red-600" title="Delete Report"><Trash2 className="h-5 w-5" /></button>)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}