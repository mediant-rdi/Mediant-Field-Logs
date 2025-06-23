// components/forms/AddClientForm.tsx
"use client";

import { useState, FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api"; // Adjust the path if needed

export type AgreementType = 'LEASE' | 'COMPREHENSIVE' | 'CONTRACT';

// Props updated: onClientCreate is now onComplete for better reusability
interface AddClientFormProps {
  onComplete: () => void;
}

export default function AddClientForm({ onComplete }: AddClientFormProps) {
  const [name, setName] = useState("");
  const [agreementType, setAgreementType] = useState<AgreementType | "">("");
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the mutation function from Convex
  const createClient = useMutation(api.clients.createClient);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!name || !agreementType) {
        setError("Both name and agreement type are required.");
        return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      // Call the Convex mutation with the form data
      await createClient({
        name,
        agreementType: agreementType as AgreementType,
      });

      // On success, reset the form and call the onComplete callback
      setName("");
      setAgreementType("");
      onComplete();

    } catch (err: unknown) {
      // Display a user-friendly error message
      let errorMessage = "An unknown error occurred. Please try again.";
      if (err instanceof Error) {
        // Convex errors can have a `data` property with a more specific message.
        // We use a type assertion to check for it, falling back to the standard message.
        errorMessage = (err as { data?: string }).data || err.message;
      }
      setError(`Failed to create client. ${errorMessage}`);
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
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Client Name *
        </label>
        <input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="agreementType" className="block text-sm font-medium text-gray-700 mb-1">
          Select Agreement *
        </label>
        <select
          id="agreementType"
          value={agreementType}
          onChange={(e) => setAgreementType(e.target.value as AgreementType)}
          required
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="" disabled className="text-gray-500">SELECT AGREEMENT TYPE</option>
          <option value="LEASE">LEASE</option>
          <option value="COMPREHENSIVE">COMPREHENSIVE</option>
          <option value="CONTRACT">CONTRACT</option>
        </select>
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting} 
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {isSubmitting ? "Creating..." : "Create Client"}
      </button>
    </form>
  );
}