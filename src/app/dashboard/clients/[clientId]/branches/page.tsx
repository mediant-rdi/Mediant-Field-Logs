// app/dashboard/clients/[clientId]/branches/page.tsx
'use client';

import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';
import Link from 'next/link';
import { Toaster, toast } from 'sonner'; // Using toast for better feedback

// Skeleton loader for this page (unchanged)
const BranchesSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-8 w-3/4 bg-gray-200 rounded mb-2"></div>
    <div className="h-5 w-1/2 bg-gray-200 rounded mb-8"></div>
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-gray-200"></div>
      ))}
    </div>
  </div>
);

export default function ClientBranchesPage({
  params,
}: {
  params: Promise<{ clientId: Id<'clients'> }>;
}) {
  const resolvedParams = React.use(params);
  
  // State to track which specific branch is being deleted
  const [deletingId, setDeletingId] = React.useState<Id<'clientLocations'> | null>(null);

  // --- 1. FETCH CURRENT USER (SAME AS BEFORE) ---
  const currentUser = useQuery(api.users.current);

  // --- 2. DETERMINE ADMIN STATUS (APPLYING THE DASHBOARD PATTERN) ---
  // This is the robust check from your dashboard/page.tsx.
  // It safely handles the loading state (currentUser being undefined) by defaulting to false.
  const isAdmin = currentUser?.isAdmin ?? false;

  // Fetch the client and their locations
  const data = useQuery(api.clients.getLocationsForClient, {
    clientId: resolvedParams.clientId,
  });

  const deleteLocation = useMutation(api.clients.deleteLocation);

  const handleDelete = async (locationId: Id<"clientLocations">, locationName: string) => {
    if (window.confirm(`Are you sure you want to delete the branch "${locationName}"? This action cannot be undone.`)) {
      setDeletingId(locationId);
      try {
        await deleteLocation({ locationId });
        toast.success(`Branch "${locationName}" deleted successfully.`);
      } catch (error) {
        console.error("Failed to delete location:", error);
        // Display the specific, user-friendly error from the backend mutation
        toast.error((error as Error).message);
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Loading state (unchanged)
  if (data === undefined || currentUser === undefined) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <BranchesSkeleton />
      </div>
    );
  }

  // Client not found state (unchanged)
  if (data === null) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow text-center">
        <h1 className="text-xl font-semibold text-gray-800">Client Not Found</h1>
        <p className="mt-2 text-gray-500">The client you are looking for does not exist.</p>
        <Link href="/dashboard/clients" className="mt-6 inline-block bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700">
          ← Back to Clients
        </Link>
      </div>
    );
  }

  const { client, locations } = data;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      {/* Add Toaster for notifications */}
      <Toaster richColors position="top-center" />
      
      {/* Page Header (unchanged) */}
      <div className="mb-6">
        <Link href="/dashboard/clients" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
          ← All Clients
        </Link>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
          Branches for {client.name}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          A list of all registered branches for this client.
        </p>
      </div>

      {/* Locations List */}
      <div>
        {locations.length === 0 ? (
          <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">No Branches Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no branches registered for this client yet.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/clients/add"
                className="bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                + Add a Location
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Branch Name</th>
                  <th className="px-4 py-3 font-medium">Full Name</th>
                  <th className="px-4 py-3 font-medium">Date Added</th>
                  {/* --- 3. UI RENDERING LOGIC (UNCHANGED) --- */}
                  {/* This logic correctly uses the `isAdmin` boolean we defined above. */}
                  {isAdmin && <th className="px-4 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {locations.map((loc) => (
                  <tr key={loc._id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{loc.name}</td>
                    <td className="px-4 py-3 text-gray-600">{loc.fullName}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(loc._creationTime).toLocaleDateString()}
                    </td>
                    {/* This conditional rendering also correctly uses the `isAdmin` boolean */}
                    {isAdmin && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(loc._id, loc.name)}
                          disabled={deletingId === loc._id}
                          className="text-sm font-medium text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {deletingId === loc._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}