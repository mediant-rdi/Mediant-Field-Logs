// components/forms/EditMachineForm.tsx
"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { useState, FormEvent, useEffect } from "react";

interface EditMachineFormProps {
  machine: Doc<"machines">;
  onComplete: () => void;
}

export function EditMachineForm({ machine, onComplete }: EditMachineFormProps) {
  // Use the mutation you created in convex/machines.ts
  const updateMachine = useMutation(api.machines.update);
  
  const [name, setName] = useState(machine.name || "");
  const [description, setDescription] = useState(machine.description || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // This ensures the form resets if a different machine is passed in
  useEffect(() => {
    setName(machine.name || "");
    setDescription(machine.description || "");
  }, [machine]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await updateMachine({
        id: machine._id, // Pass the machine's ID
        name,
        description,
      });
      onComplete(); // Call the callback on success
    } catch (err: any) {
      setError(err.message || "Failed to update machine.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      
      <div>
        <label htmlFor="machine-name-edit" className="block text-sm font-medium text-gray-700">Machine Name</label>
        <input 
          id="machine-name-edit" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="machine-description-edit" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
        <textarea 
          id="machine-description-edit" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          rows={4}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex gap-4">
        <button type="button" onClick={onComplete} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded disabled:bg-yellow-300">
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}