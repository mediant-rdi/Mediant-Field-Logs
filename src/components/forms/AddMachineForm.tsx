// components/forms/AddMachineForm.tsx
"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, FormEvent } from "react";

// Define categories to be used in the dropdown
const machineCategories = [
  "note counting machines",
  "coin counting machines",
  "strapping machines",
  "printers",
  "power/electrical equipments",
  "teller safes",
  "other financial devices",
  "solar&EcoFlow devices",
  "shredders"
] as const;

type MachineCategory = typeof machineCategories[number];

interface AddMachineFormProps {
  onComplete: () => void;
}

export function AddMachineForm({ onComplete }: AddMachineFormProps) {
  // Use the mutation you created in convex/machines.ts
  const createMachine = useMutation(api.machines.create); 

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<MachineCategory>(machineCategories[0]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await createMachine({ name, description, category });
      onComplete(); // Call the callback on success
    } catch (err: any) {
      setError(err.message || "Failed to create machine.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      
      <div>
        <label htmlFor="machine-category" className="block text-sm font-medium text-gray-700">Category</label>
        <select
          id="machine-category"
          value={category}
          onChange={(e) => setCategory(e.target.value as MachineCategory)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 capitalize"
        >
          {machineCategories.map((cat) => (
            <option key={cat} value={cat} className="capitalize">
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="machine-name" className="block text-sm font-medium text-gray-700">Machine Name</label>
        <input 
          id="machine-name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="machine-description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
        <textarea 
          id="machine-description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          rows={4}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300">
        {isSubmitting ? "Creating..." : "Create Machine"}
      </button>
    </form>
  );
}