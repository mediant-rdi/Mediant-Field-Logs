"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { useState, FormEvent, useEffect } from "react";

interface EditUserFormProps {
  user: Doc<"users">;
  onComplete: () => void;
}

export function EditUserForm({ user, onComplete }: EditUserFormProps) {
  const updateUser = useMutation(api.users.updateUser);
  const [name, setName] = useState(user.name || "");
  // Changed from `role` to `isAdmin` state. `?? false` handles undefined.
  const [isAdmin, setIsAdmin] = useState(user.isAdmin ?? false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    setName(user.name || "");
    // Update isAdmin state if the user prop changes
    setIsAdmin(user.isAdmin ?? false);
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Pass the `isAdmin` boolean to the mutation
      await updateUser({
        userId: user._id,
        name,
        isAdmin,
      });
      onComplete();
    } catch (err: unknown) {
      // Type-safe error handling
      if (err instanceof Error) {
        // Convex errors can have a `data` property with a more specific message.
        const errorMessage = (err as { data?: string }).data || err.message;
        setError(errorMessage || "Failed to update user.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      {/* Email and Name fields are mostly unchanged */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Email (cannot be changed)</label>
        <input type="email" value={user.email || ""} disabled className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"/>
      </div>
      <div>
        <label htmlFor="name-edit" className="block text-sm font-medium text-gray-700">Name</label>
        <input id="name-edit" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
      </div>

      {/* Replaced role dropdown with a checkbox */}
      <div className="flex items-center">
        <input
          id="isAdmin-edit"
          type="checkbox"
          checked={isAdmin}
          onChange={(e) => setIsAdmin(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isAdmin-edit" className="ml-2 block text-sm text-gray-900">
          User is an Admin
        </label>
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