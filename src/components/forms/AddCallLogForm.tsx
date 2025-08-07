// src/components/forms/AddCallLogForm.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // UPDATED: Import useRouter
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Doc } from '../../../convex/_generated/dataModel';
import { Loader2, Search, Building, UserPlus, CheckCircle } from 'lucide-react';

// Debounce hook remains the same
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// REMOVED: `onClose` and `onSuccess` props are no longer needed.
export function AddCallLogForm() {
  const router = useRouter(); // ADDED: Router for navigation
  const [issue, setIssue] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client and Engineer search logic remains the same
  const [selectedClient, setSelectedClient] = useState<Doc<"clientLocations"> | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const debouncedClientSearch = useDebounce(clientSearch, 300);
  const clientResults = useQuery(api.clients.searchLocations, 
    debouncedClientSearch.length > 1 ? { searchText: debouncedClientSearch } : 'skip'
  );
  
  const [selectedEngineers, setSelectedEngineers] = useState<Doc<"users">[]>([]);
  const [engineerSearch, setEngineerSearch] = useState('');
  const debouncedEngineerSearch = useDebounce(engineerSearch, 300);
  const engineerResults = useQuery(api.users.searchEngineers,
    debouncedEngineerSearch.length > 0 ? { searchText: debouncedEngineerSearch } : 'skip'
  );
  
  const createCallLog = useMutation(api.callLogs.create);

  const filteredEngineerResults = useMemo(() => {
    const selectedIds = new Set(selectedEngineers.map(e => e._id));
    return engineerResults?.filter(engineer => !selectedIds.has(engineer._id));
  }, [engineerResults, selectedEngineers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !issue || selectedEngineers.length === 0) {
      setError('Client, Issue, and at least one Engineer are required.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      await createCallLog({
        locationId: selectedClient._id,
        issue,
        engineerIds: selectedEngineers.map(e => e._id),
      });
      // UPDATED: On success, redirect to the call logs list page.
      router.push('/dashboard/call-logs');
    } catch (err: unknown) {
      console.error('Failed to create call log:', err);
      let errorMessage = 'An unexpected error occurred.';

      // Prioritize the specific error structure that might come from a Convex mutation
      if (typeof err === 'object' && err !== null && 'data' in err) {
        const data = (err as { data: unknown }).data;
        if (typeof data === 'object' && data !== null && 'message' in data && typeof (data as { message: unknown }).message === 'string') {
          errorMessage = (data as { message: string }).message;
        }
      } else if (err instanceof Error) {
        // Fallback to standard Error message
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    // REMOVED: The outer modal div is gone. This is now just a form.
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* --- Client Autocomplete --- */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name + Branch</label>
        {selectedClient ? (
          <div className="flex items-center justify-between p-2.5 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">{selectedClient.fullName}</span>
            </div>
            <button type="button" onClick={() => setSelectedClient(null)} className="text-sm font-medium text-blue-600 hover:text-blue-800">Change</button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Search for a bank or branch..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
            />
            {clientResults && clientResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md border max-h-48 overflow-y-auto">
                <ul>
                  {clientResults.map(loc => (
                    <li key={loc._id} onClick={() => { setSelectedClient(loc); setClientSearch(''); }}
                        className="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span>{loc.displayText}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Issue Textarea --- */}
      <div>
        <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-1">Issue / Request</label>
        <textarea id="issue" rows={3} value={issue} onChange={(e) => setIssue(e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          placeholder="Describe the issue reported..."
        />
      </div>

      {/* --- Engineer Autocomplete --- */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Engineer(s) Sent</label>
        <div className="relative">
          <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" value={engineerSearch} onChange={(e) => setEngineerSearch(e.target.value)}
            placeholder="Search for an engineer to add..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
          />
          {filteredEngineerResults && filteredEngineerResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border max-h-48 overflow-y-auto">
              <ul>
                {filteredEngineerResults.map(eng => (
                  <li key={eng._id} onClick={() => { setSelectedEngineers(prev => [...prev, eng]); setEngineerSearch(''); }}
                      className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                    {eng.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 min-h-[28px]">
          {selectedEngineers.map(eng => (
            <span key={eng._id} className="inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              {eng.name}
              <button type="button" onClick={() => setSelectedEngineers(prev => prev.filter(e => e._id !== eng._id))}
                      className="flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-500 hover:bg-blue-200">
                <span className="sr-only">Remove {eng.name}</span>X
              </button>
            </span>
          ))}
        </div>
      </div>
      
      {error && <p className="text-sm text-red-600 p-2 bg-red-50 rounded-md">{error}</p>}
      
      <div className="flex items-center justify-end pt-4 border-t">
        {/* UPDATED: Cancel button now uses the router to navigate */}
        <button type="button" onClick={() => router.push('/dashboard/call-logs')} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 mr-3">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Log
        </button>
      </div>
    </form>
  );
}