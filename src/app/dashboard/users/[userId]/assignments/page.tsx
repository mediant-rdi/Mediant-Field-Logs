// src/app/dashboard/users/[userId]/assignments/page.tsx
'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';
import { useParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react'; // <-- Imported useEffect
import { Loader2, X, PlusCircle, Search, ArrowLeft } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import Link from 'next/link';

// A simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    // --- THIS IS THE FIX ---
    // Changed useState to useEffect, which correctly accepts two arguments.
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup function to clear the timeout if the value changes
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]); // Only re-call effect if value or delay changes
    return debouncedValue;
}

export default function ManageAssignmentsPage() {
    const params = useParams();
    const userId = params.userId as Id<'users'>;

    const user = useQuery(api.users.getUserById, { userId });
    const assignedLocations = useQuery(api.users.getAssignedLocationsForUser, { userId });
    
    const addLocation = useMutation(api.users.addServiceLocationToUser);
    const removeLocation = useMutation(api.users.removeServiceLocationFromUser);

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const searchResults = useQuery(
        api.clients.searchLocations,
        debouncedSearchQuery.length > 1 ? { searchText: debouncedSearchQuery, userIdForContext: userId } : 'skip'
    );
    
    const isSearching = searchQuery.length > 1 && searchResults === undefined;

    const handleAddLocation = async (location: { _id: Id<'clientLocations'>, displayText: string }) => {
        const toastId = toast.loading(`Assigning ${location.displayText}...`);
        try {
            await addLocation({ userId, locationId: location._id });
            toast.success(`Assigned ${location.displayText}.`, { id: toastId });
            setSearchQuery(''); // Clear search after adding
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to assign location.", { id: toastId });
        }
    };

    const handleRemoveLocation = async (location: { _id: Id<'clientLocations'>, fullName: string }) => {
        if (!window.confirm(`Are you sure you want to unassign ${location.fullName}?`)) return;

        const toastId = toast.loading(`Unassigning ${location.fullName}...`);
        try {
            await removeLocation({ userId, locationId: location._id });
            toast.success(`Unassigned ${location.fullName}.`, { id: toastId });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to unassign location.", { id: toastId });
        }
    };
    
    // Sort assigned locations alphabetically
    const sortedAssignedLocations = useMemo(() => {
        return assignedLocations?.slice().sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [assignedLocations]);


    if (user === undefined || assignedLocations === undefined) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
        );
    }
    
    if (user === null) {
        return <div className="text-center p-8">User not found.</div>;
    }

    return (
        <>
            <Toaster position="top-center" richColors />
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6">
                    <Link href="/dashboard/users" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mb-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to User Management
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Manage Branch Assignments</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Editing assignments for <span className="font-semibold">{user.name}</span> ({user.email})
                    </p>
                </div>

                {/* --- Add Location Section --- */}
                <div className="relative mb-6">
                    <label htmlFor="location-search" className="block text-sm font-medium text-gray-700">Add a Branch</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            id="location-search"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for an unassigned branch to add..."
                            className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {isSearching && <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-gray-400" />}
                    {searchResults && searchQuery.length > 0 && (
                        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                            {searchResults.map((loc) => (
                                <li key={loc._id} 
                                    onClick={() => handleAddLocation(loc)}
                                    className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                                >
                                    <span className="font-normal block truncate">{loc.displayText}</span>
                                </li>
                            ))}
                            {searchResults.length === 0 && !isSearching && <li className="text-gray-500 select-none relative py-2 px-4">No unassigned locations found.</li>}
                        </ul>
                    )}
                </div>

                {/* --- Assigned Locations List --- */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="p-4 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Assigned Branches ({assignedLocations.length})</h3>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto">
                        {sortedAssignedLocations && sortedAssignedLocations.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {sortedAssignedLocations.map(loc => (
                                    <li key={loc._id} className="pl-4 pr-2 py-3 sm:pl-6 flex items-center justify-between text-sm hover:bg-gray-50/50">
                                        <span className="font-medium text-gray-800">{loc.fullName}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLocation(loc)}
                                            className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                                            title={`Unassign ${loc.fullName}`}
                                        >
                                            <X className="h-4 w-4"/>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-12 px-6">
                                <PlusCircle className="mx-auto h-12 w-12 text-gray-400"/>
                                <p className="mt-2 text-sm font-semibold text-gray-600">No branches assigned</p>
                                <p className="mt-1 text-sm text-gray-500">Use the search bar above to find and assign branches.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}