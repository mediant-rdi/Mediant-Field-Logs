// components/forms/AddClientLocationForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { Client } from "./AddClientForm";

interface AddClientLocationFormProps {
  clients: Client[];
  onComplete: () => void;
}

export default function AddClientLocationForm({ clients, onComplete }: AddClientLocationFormProps) {
  const [clientId, setClientId] = useState<string>("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError("Please select a client.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const locationData = { clientId, branchName: name };
      console.log("Simulating location creation:", locationData);
      onComplete();
      setClientId("");
      setName("");
    } catch (err: any) {
      setError("Failed to create location.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Increased spacing for better layout
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enhanced error message styling */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-md">
          {error}
        </div>
      )}

      <div>
        {/* Added margin-bottom to label */}
        <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
          Select Client *
        </label>
        <select
          id="client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          // Standardized select styles
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {/* Styled placeholder option */}
          <option value="" className="text-gray-500">-- Select a Client --</option>
          {clients?.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name}
            </option>
          ))}
        </select>
        {(!clients || clients.length === 0) && (
            <p className="text-sm text-gray-500 mt-2">
                No clients found. Please add a client first.
            </p>
        )}
      </div>

      <div>
        <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-1">
          Branch Name *
        </label>
        <input 
          id="branchName" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          // Standardized input styles
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting || !clients || clients.length === 0}
        // Standardized button styles with transitions
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {isSubmitting ? "Creating..." : "Create Location"}
      </button>
    </form>
  );
}