// components/forms/AddClientForm.tsx
"use client";

import { useState, FormEvent } from "react";

export type AgreementType = 'LEASE' | 'COMPREHENSIVE' | 'CONTRACT';

export interface Client {
  _id: string;
  name: string;
  agreementType: AgreementType;
}

interface AddClientFormProps {
  onClientCreate: (newClient: Client) => void;
}

export default function AddClientForm({ onClientCreate }: AddClientFormProps) {
  const [name, setName] = useState("");
  const [agreementType, setAgreementType] = useState<AgreementType | "">("");
  
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const newClient: Client = {
        _id: `temp_${Date.now()}`,
        name,
        agreementType: agreementType as AgreementType,
      };
      onClientCreate(newClient);
      setName("");
      setAgreementType("");
    } catch (err: any) {
      setError("Failed to create client. Please try again.");
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
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Client / Bank Name *
        </label>
        <input 
          id="name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          // Standardized input styles
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
          // Standardized select styles
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {/* Styled placeholder option */}
          <option value="" disabled className="text-gray-500">SELECT AGREEMENT TYPE</option>
          <option value="LEASE">LEASE</option>
          <option value="COMPREHENSIVE">COMPREHENSIVE</option>
          <option value="CONTRACT">CONTRACT</option>
        </select>
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting} 
        // Standardized button styles with transitions
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-150"
      >
        {isSubmitting ? "Creating..." : "Create Client"}
      </button>
    </form>
  );
}