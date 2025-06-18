// app/dashboard/reports/machine-dev/page.tsx
'use client';

export default function MachineDevelopmentReportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">
        Machine Development Reports
      </h1>
      <p className="mt-2 text-gray-600">
        Users can view, download, or manage machine development reports from this page.
      </p>

      <div className="mt-8 p-6 border border-dashed border-gray-300 rounded-lg bg-white">
        <p className="text-center text-gray-500">
          {/* Reports table with filtering and download options will go here */}
          Reports table component will be rendered here.
        </p>
      </div>
    </div>
  );
}