// app/dashboard/clients/page.tsx
'use client';

import Link from 'next/link';
// The import for 'Plus' from 'lucide-react' would be here, and should be removed.

export default function ViewClientsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            Client Management
          </h1>
          <p className="mt-2 text-gray-600">
            A searchable and sortable list of all clients and their locations.
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/clients/add"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            
            Add Client / Location
          </Link>
        </div>
      </div>

      <div className="p-6 border border-dashed border-gray-300 rounded-lg bg-white">
        <p className="text-center text-gray-500">
          Client data table will be rendered here.
        </p>
      </div>
    </div>
  );
}