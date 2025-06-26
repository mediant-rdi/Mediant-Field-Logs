// app/dashboard/reports/machine-dev/page.tsx
'use client';

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { Trash2, Download, AlertTriangle } from "lucide-react";
// FIXED: Import FunctionReturnType from "convex/server"
import { type FunctionReturnType } from "convex/server";

// This type definition now works correctly.
type ReportType = FunctionReturnType<typeof api.reports.getReports>[number];

export default function MachineDevelopmentReportsPage() {
  const user = useQuery(api.users.current);
  const reports = useQuery(api.reports.getReports);
  const removeReport = useMutation(api.reports.remove);

  const [reportToDelete, setReportToDelete] = useState<ReportType | null>(null);

  const handleOpenDeleteModal = (report: ReportType) => {
    setReportToDelete(report);
  };

  const handleCloseDeleteModal = () => {
    setReportToDelete(null);
  };

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
      {reportToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
            <div className="flex items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Delete Report
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete the report &quot;<strong>{reportToDelete.fileName}</strong>&quot;? This action will permanently remove the file and its record. This cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
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

      <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
          Machine Development Reports
        </h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">
          Download or manage machine development reports from this page.
        </p>

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              {reports === undefined && (
                 <div className="text-center py-10">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                   <p className="mt-2 text-gray-500">Loading reports...</p>
                 </div>
              )}
              {reports && reports.length === 0 && (
                <div className="mt-6 p-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <p className="text-center text-gray-500">
                    No reports have been added yet. Admins can add reports via the sidebar.
                  </p>
                </div>
              )}
              {reports && reports.length > 0 && (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Machine Name</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">File Name</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Uploaded At</th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {reports.map((report) => (
                      <tr key={report._id}>
                        <td className="whitespace-nowrap py-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">{report.machineName}</td>
                        <td className="whitespace-pre-wrap px-3 py-4 text-sm text-gray-500" style={{ maxWidth: '24rem' }}>{report.description}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{report.fileName}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{new Date(report._creationTime).toLocaleDateString()}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <div className="flex items-center justify-end gap-x-4">
                            <Link href={report.fileUrl!} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600 flex items-center gap-1" title="Download File">
                              <Download className="h-4 w-4" />
                               <span className="hidden sm:inline">Download</span>
                            </Link>
                            {user?.isAdmin && (
                              <button onClick={() => handleOpenDeleteModal(report)} className="text-gray-500 hover:text-red-600 flex items-center gap-1" title="Delete Report">
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}