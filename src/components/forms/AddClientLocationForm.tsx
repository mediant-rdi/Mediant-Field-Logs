// components/forms/AddClientLocationForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface AddClientLocationFormProps {
  onComplete: () => void;
  initialClientId?: Id<"clients"> | string | null; // Accept string from URL params
}

export default function AddClientLocationForm({ onComplete, initialClientId }: AddClientLocationFormProps) {
  // Pre-select the client if an initial ID is provided
  const [clientId, setClientId] = useState<Id<"clients"> | "">(
    (initialClientId as Id<"clients">) || ""
  );
  const [name, setName] = useState(""); // This is the "Branch Name"
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clients = useQuery(api.clients.listClients);
  const createLocation = useMutation(api.clients.createLocation);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError("Please select a client.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      await createLocation({ 
        clientId: clientId as Id<"clients">, 
        name,
      });

      onComplete();
      // Only reset the client ID if it wasn't pre-selected
      if (!initialClientId) {
          setClientId("");
      }
      setName("");
    } catch (err: unknown) {
      let errorMessage = "An unknown error occurred. Please try again.";
      if (err instanceof Error) {
        errorMessage = (err as { data?: string }).data || err.message;
      }
      setError("Failed to create location. " + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
          Select Client *
        </label>
        <select
          id="client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value as Id<"clients">)}
          required
          disabled={clients === undefined || !!initialClientId} // Also disable if pre-selected
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="" className="text-gray-500">
            {clients === undefined ? "Loading clients..." : "-- Select a Client --"}
          </option>
          {clients?.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name}
            </option>
          ))}
        </select>
        {clients && clients.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
                No clients found. Please add a client first.
            </p>
        )}
      </div>

      <div>
        <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-1">
          Location / Branch Name *
        </label>
        <input 
          id="branchName" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting || !clients || clients.length === 0}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {isSubmitting ? "Creating..." : "Create Location"}
      </button>
    </form>
  );
}