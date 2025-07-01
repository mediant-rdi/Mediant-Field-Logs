// src/app/dashboard/reports/add/page.tsx
"use client";

import { AddReportForm } from "@/components/forms/AddReportForm";

export default function AddReportPage() {
  return (
    // Responsive container with padding and max-width, matching the reference style
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-xl mx-auto my-8">
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
        Add a New Report
      </h1>
      
      <AddReportForm />
    </div>
  );
}