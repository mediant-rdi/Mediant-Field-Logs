// src/app/dashboard/users/[userId]/assignments/page.tsx
'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';
import { useParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Loader2, X, PlusCircle, Search, ArrowLeft, User, Users } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import Link from 'next/link';

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

export default function ManageAssignmentsPage() {
    const params = useParams();
    const userId = params.userId as Id<'users'>;

    const user = useQuery(api.users.getUserById, { userId });
    
    // --- LOCATION MANAGEMENT ---
    const assignedLocations = useQuery(api.users.getAssignedLocationsForUser, { userId });
    const addLocation = useMutation(api.users.addServiceLocationToUser);
    const removeLocation = useMutation(api.users.removeServiceLocationFromUser);
    const [locationSearchQuery, setLocationSearchQuery] = useState('');
    const debouncedLocationSearchQuery = useDebounce(locationSearchQuery, 300);
    const locationSearchResults = useQuery(
        api.clients.searchLocations,
        debouncedLocationSearchQuery.length > 1 ? { searchText: debouncedLocationSearchQuery, userIdForContext: userId } : 'skip'
    );
    const isSearchingLocations = locationSearchQuery.length > 1 && locationSearchResults === undefined;

    const handleAddLocation = async (location: { _id: Id<'clientLocations'>, displayText: string }) => {
        const toastId = toast.loading(`Assigning ${location.displayText}...`);
        try {
            await addLocation({ userId, locationId: location._id });
            toast.success(`Assigned ${location.displayText}.`, { id: toastId });
            setLocationSearchQuery('');
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
    
    const sortedAssignedLocations = useMemo(() => {
        return assignedLocations?.slice().sort((a, b) => a.fullName.localeCompare(b.fullName));
    }, [assignedLocations]);

    // --- TEAM MEMBER MANAGEMENT ---
    const taggedTeamMembers = useQuery(api.users.getTaggedTeamMembersForUser, { userId });
    const addTeamMember = useMutation(api.users.addTeamMemberToUser);
    const removeTeamMember = useMutation(api.users.removeTeamMemberFromUser);
    const [engineerSearchQuery, setEngineerSearchQuery] = useState('');
    const debouncedEngineerSearchQuery = useDebounce(engineerSearchQuery, 300);
    const engineerSearchResults = useQuery(
        api.users.searchTaggableEngineers,
        debouncedEngineerSearchQuery.length > 1 ? { searchText: debouncedEngineerSearchQuery, primaryUserId: userId } : 'skip'
    );
    const isSearchingEngineers = engineerSearchQuery.length > 1 && engineerSearchResults === undefined;
    
    // NEW QUERY for read-only team context
    const teamContext = useQuery(api.users.getTeamInfoForUser, { userId });

    const handleAddTeamMember = async (teamMember: { _id: Id<'users'>, name?: string | null }) => {
        const memberName = teamMember.name || 'this engineer';
        const toastId = toast.loading(`Tagging ${memberName}...`);
        try {
            await addTeamMember({ userId, teamMemberId: teamMember._id });
            toast.success(`Tagged ${memberName}.`, { id: toastId });
            setEngineerSearchQuery('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to tag engineer.", { id: toastId });
        }
    };

    const handleRemoveTeamMember = async (teamMember: { _id: Id<'users'>, name?: string | null }) => {
        const memberName = teamMember.name || 'this engineer';
        if (!window.confirm(`Are you sure you want to untag ${memberName}?`)) return;
        const toastId = toast.loading(`Untagging ${memberName}...`);
        try {
            await removeTeamMember({ userId, teamMemberId: teamMember._id });
            toast.success(`Untagged ${memberName}.`, { id: toastId });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to untag engineer.", { id: toastId });
        }
    };

    const sortedTaggedTeamMembers = useMemo(() => {
        return taggedTeamMembers?.slice().sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    }, [taggedTeamMembers]);


    if (user === undefined || assignedLocations === undefined || taggedTeamMembers === undefined || teamContext === undefined) {
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
                    <h1 className="text-2xl font-bold text-gray-900">Manage Assignments</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Editing assignments for <span className="font-semibold">{user.name}</span> ({user.email})
                    </p>
                </div>
                
                {teamContext && (
                    <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-blue-800">
                            <Users className="h-5 w-5" />
                            Team Information
                        </h3>
                        {teamContext.isMember ? (
                            <p className="mt-1 text-sm text-blue-700">
                                This user is a member of <span className="font-bold">{teamContext.leader?.name}</span>&apos;s team.
                                {teamContext.teamMates.length > 0 && <span> Their teammates are: {teamContext.teamMates.map(m => m.name).join(', ')}.</span>}
                            </p>
                        ) : teamContext.teamMates.length > 0 ? (
                            <p className="mt-1 text-sm text-blue-700">
                                This user is a team leader. Tagged members: <span className="font-bold">{teamContext.teamMates.map(m => m.name).join(', ')}.</span>
                            </p>
                        ) : (
                             <p className="mt-1 text-sm text-blue-700">This user is not currently part of a team.</p>
                        )}
                    </div>
                )}

                <div className="space-y-12">
                    {/* --- Add Location Section --- */}
                    <div>
                        <div className="relative mb-6">
                            <label htmlFor="location-search" className="block text-sm font-medium text-gray-700">Add a Branch</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input id="location-search" type="text" value={locationSearchQuery} onChange={(e) => setLocationSearchQuery(e.target.value)} placeholder="Search for an unassigned branch to add..." className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
                            </div>
                            {isSearchingLocations && <Loader2 className="absolute right-3 top-9 h-5 w-5 animate-spin text-gray-400" />}
                            {locationSearchResults && locationSearchQuery.length > 0 && (
                                <ul className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                    {locationSearchResults.map((loc) => (<li key={loc._id} onClick={() => handleAddLocation(loc)} className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"><span className="font-normal block truncate">{loc.displayText}</span></li>))}
                                    {locationSearchResults.length === 0 && !isSearchingLocations && <li className="text-gray-500 select-none relative py-2 px-4">No unassigned locations found.</li>}
                                </ul>
                            )}
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-4 sm:px-6 border-b border-gray-200"><h3 className="text-lg font-medium text-gray-900">Assigned Branches ({assignedLocations.length})</h3></div>
                            <div className="max-h-[60vh] overflow-y-auto">
                                {sortedAssignedLocations && sortedAssignedLocations.length > 0 ? (
                                    <ul className="divide-y divide-gray-200">
                                        {sortedAssignedLocations.map(loc => (<li key={loc._id} className="pl-4 pr-2 py-3 sm:pl-6 flex items-center justify-between text-sm hover:bg-gray-50/50"><span className="font-medium text-gray-800">{loc.fullName}</span><button type="button" onClick={() => handleRemoveLocation(loc)} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500" title={`Unassign ${loc.fullName}`}><X className="h-4 w-4"/></button></li>))}
                                    </ul>
                                ) : (<div className="text-center py-12 px-6"><PlusCircle className="mx-auto h-12 w-12 text-gray-400"/><p className="mt-2 text-sm font-semibold text-gray-600">No branches assigned</p><p className="mt-1 text-sm text-gray-500">Use the search bar above to find and assign branches.</p></div>)}
                            </div>
                        </div>
                    </div>

                    {/* --- Tag Team Members Section --- */}
                    <div>
                        <div className="relative mb-6">
                            <label htmlFor="engineer-search" className="block text-sm font-medium text-gray-700">Tag a Team Member</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input id="engineer-search" type="text" value={engineerSearchQuery} onChange={(e) => setEngineerSearchQuery(e.target.value)} placeholder="Search for an engineer to tag..." className="mt-1 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            {isSearchingEngineers && <Loader2 className="absolute right-3 top-9 h-5 w-5 animate-spin text-gray-400" />}
                            {engineerSearchResults && engineerSearchQuery.length > 0 && (
                                <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                    {engineerSearchResults.map((eng) => (<li key={eng._id} onClick={() => handleAddTeamMember(eng)} className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"><span className="font-normal block truncate">{eng.name}</span></li>))}
                                    {engineerSearchResults.length === 0 && !isSearchingEngineers && <li className="text-gray-500 select-none relative py-2 px-4">No engineers found to tag.</li>}
                                </ul>
                            )}
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-4 sm:px-6 border-b border-gray-200"><h3 className="text-lg font-medium text-gray-900">Tagged Team Members ({taggedTeamMembers.length})</h3></div>
                            <div className="max-h-[60vh] overflow-y-auto">
                                {sortedTaggedTeamMembers && sortedTaggedTeamMembers.length > 0 ? (
                                    <ul className="divide-y divide-gray-200">
                                        {sortedTaggedTeamMembers.map(member => (<li key={member._id} className="pl-4 pr-2 py-3 sm:pl-6 flex items-center justify-between text-sm hover:bg-gray-50/50"><span className="font-medium text-gray-800">{member.name}</span><button type="button" onClick={() => handleRemoveTeamMember(member)} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500" title={`Untag ${member.name}`}><X className="h-4 w-4"/></button></li>))}
                                    </ul>
                                ) : (<div className="text-center py-12 px-6"><User className="mx-auto h-12 w-12 text-gray-400"/><p className="mt-2 text-sm font-semibold text-gray-600">No team members tagged</p><p className="mt-1 text-sm text-gray-500">Use the search bar above to tag engineers to this user.</p></div>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}