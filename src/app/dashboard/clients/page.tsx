// app/dashboard/clients/page.tsx
'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

// A responsive loading skeleton component.
const TableSkeleton = () => (
  <div className="animate-pulse">
    {/* Mobile Skeleton (Card view) */}
    <div className="space-y-3 md:hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-gray-200"></div>
      ))}
    </div>
    {/* Desktop Skeleton (Table view) */}
    <div className="hidden md:block">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 rounded bg-gray-200 mb-2"></div>
      ))}
    </div>
  </div>
);

/**
 * A responsive component to display the client data.
 * It shows a list of cards on mobile and a table on desktop.
 */
function ClientsDataTable({ isAdmin }: { isAdmin: boolean }) {
  const clients = useQuery(api.clients.listClients);

  // Loading state
  if (clients === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <p className="text-gray-500">Loading Clients...</p>
        <div className="w-full mt-4">
          <TableSkeleton />
        </div>
      </div>
    );
  }

  // Empty state
  if (clients.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <h3 className="text-lg font-medium text-gray-900">No Clients Found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {isAdmin ? "Get started by adding a new client." : "No clients have been added yet."}
        </p>
        {isAdmin && (
          <div className="mt-6">
            <Link
              href="/dashboard/clients/add"
              className="bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + Add New Client
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Responsive Data Display
  return (
    <>
      {/* Mobile View: Card List (hidden on screens md and up) */}
      <div className="space-y-4 md:hidden">
        {clients.map((client) => (
          <div key={client._id} className="bg-gray-50 p-4 border rounded-lg shadow-sm">
            <div className="font-semibold text-gray-900">{client.name}</div>
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Agreement:</span> {client.agreementType}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              <span className="font-medium">Added:</span> {new Date(client._creationTime).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table (hidden on screens smaller than md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Client Name</th>
              <th className="px-4 py-3 font-medium">Agreement Type</th>
              <th className="px-4 py-3 font-medium">Date Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((client) => (
              <tr key={client._id}>
                <td className="px-4 py-3 font-medium text-gray-900">{client.name}</td>
                <td className="px-4 py-3 text-gray-600">{client.agreementType}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(client._creationTime).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function ViewClientsPage() {
  const currentUser = useQuery(api.users.current);

  // Full-page skeleton while user data is loading
  if (currentUser === undefined) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <div className="h-7 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mt-2"></div>
          </div>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const isAdmin = currentUser?.isAdmin === true;

  return (
    // Main container with responsive padding
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      {/* Header section with responsive layout */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Client Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            A list of all clients in the system.
          </p>
        </div>
        {isAdmin && (
          <div className="self-start sm:self-auto">
            <Link
              href="/dashboard/clients/add"
              className="bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + Add Client / Location
            </Link>
          </div>
        )}
      </div>

      <div>
        <ClientsDataTable isAdmin={isAdmin} />
      </div>
    </div>
  );
}