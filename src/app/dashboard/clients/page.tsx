// app/dashboard/clients/page.tsx
'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Doc } from '../../../../convex/_generated/dataModel';
import React, { useState, useEffect } from 'react';

// Debounce hook to prevent rapid-fire queries
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// A responsive loading skeleton component.
const TableSkeleton = () => (
  <div className="animate-pulse">
    <div className="space-y-3 md:hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-gray-200"></div>
      ))}
    </div>
    <div className="hidden md:block">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 rounded bg-gray-200 mb-2"></div>
      ))}
    </div>
  </div>
);

// OPTIMIZATION: Created a memoized component for the mobile card view.
const ClientCard = React.memo(function ClientCard({ client }: { client: Doc<'clients'> }) {
  return (
    <div className="bg-gray-50 p-4 border rounded-lg shadow-sm flex flex-col justify-between">
      <div>
        <div className="font-semibold text-gray-900">{client.name}</div>
        <div className="mt-2 text-sm text-gray-600">
          <span className="font-medium">Agreement:</span> {client.agreementType}
        </div>
        <div className="mt-1 text-sm text-gray-500">
          <span className="font-medium">Added:</span> {new Date(client._creationTime).toLocaleDateString()}
        </div>
      </div>
      <div className="mt-4 text-right">
        <Link
          href={`/dashboard/clients/${client._id}/branches`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          View Branches →
        </Link>
      </div>
    </div>
  );
});

// OPTIMIZATION: Created a memoized component for the desktop table row.
const ClientRow = React.memo(function ClientRow({ client }: { client: Doc<'clients'> }) {
  return (
    <tr>
      <td className="px-4 py-3 font-medium text-gray-900">{client.name}</td>
      <td className="px-4 py-3 text-gray-600">{client.agreementType}</td>
      <td className="px-4 py-3 text-gray-600">
        {new Date(client._creationTime).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/dashboard/clients/${client._id}/branches`}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          View Branches
        </Link>
      </td>
    </tr>
  );
});

/**
 * A responsive component to display the client data.
 * It shows a list of cards on mobile and a table on desktop.
 */
function ClientsDataTable({
  clients,
  isAdmin,
  searchText,
}: {
  clients: Doc<'clients'>[] | undefined;
  isAdmin: boolean;
  searchText: string;
}) {
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

  if (clients.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <h3 className="text-lg font-medium text-gray-900">
          {searchText ? "No Clients Found" : "No Clients Available"}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchText
            ? `No clients match your search for "${searchText}".`
            : "Get started by adding a new client."}
        </p>
        {isAdmin && !searchText && (
          <div className="mt-6">
            <Link href="/dashboard/clients/add" className="bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
              + Add New Client
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 md:hidden">
        {clients.map((client) => <ClientCard key={client._id} client={client} />)}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Client Name</th>
              <th className="px-4 py-3 font-medium">Agreement Type</th>
              <th className="px-4 py-3 font-medium">Date Added</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((client) => <ClientRow key={client._id} client={client} />)}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function ViewClientsPage() {
  const currentUser = useQuery(api.users.current);
  const [searchText, setSearchText] = useState('');
  const debouncedSearchText = useDebounce(searchText, 300);

  const clients = useQuery(
    api.clients.searchClients,
    { searchText: debouncedSearchText }
  );

  if (currentUser === undefined) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <div>
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div>
          </div>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  const isAdmin = currentUser?.isAdmin === true;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Client Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            A list of all clients in the system.
          </p>
        </div>
        {isAdmin && (
          <div className="self-start sm:self-auto">
            <Link href="/dashboard/clients/add" className="bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
              + Add Client / Location
            </Link>
          </div>
        )}
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by client name..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full sm:w-72 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <ClientsDataTable clients={clients} isAdmin={isAdmin} searchText={searchText} />
      </div>
    </div>
  );
}