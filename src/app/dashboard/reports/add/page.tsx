// src/app/dashboard/reports/add/page.tsx
"use client";

import { AddReportForm } from "@/components/forms/AddReportForm";
import Link from "next/link";

export default function AddReportPage() {
  return (
    // Container with responsive padding, centered with a max-width
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      {/* Header with title and back link, responsive stacking */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            Add New Report
        </h1>
        <Link 
          href="/dashboard/reports/machine-dev" 
          className="text-sm text-blue-500 hover:underline self-start sm:self-center"
        >
            ← Back to Reports
        </Link>
      </div>
      {/* Card container for the form */}
      <div className="p-4 sm:p-6 border rounded-lg bg-white shadow-md">
        <AddReportForm />
      </div>
    </div>
  );
}