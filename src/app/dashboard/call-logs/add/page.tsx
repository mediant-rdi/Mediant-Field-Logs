// app/dashboard/call-logs/add/page.tsx
'use client';

import { AddCallLogForm } from '@/components/forms/AddCallLogForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function AddCallLogPage() {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <div className="mb-6">
        <Link 
          href="/dashboard/call-logs"
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Call Logs
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-2">
          Add New Call Log
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Record a new support call and assign engineers.
        </p>
      </div>
      
      {/* The form component is now rendered directly on the page */}
      <AddCallLogForm />
    </div>
  );
}