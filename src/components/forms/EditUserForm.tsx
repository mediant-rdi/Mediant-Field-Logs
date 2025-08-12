// src/components/forms/EditUserForm.tsx
"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { useState, FormEvent, useEffect } from "react";
import { Loader2, Wrench } from "lucide-react";
import Link from "next/link";

interface EditUserFormProps {
  user: Doc<"users">;
  onComplete: () => void;
}

export function EditUserForm({ user, onComplete }: EditUserFormProps) {
  const updateUser = useMutation(api.users.updateUserDetails); // Using a more specific mutation now

  const [name, setName] = useState(user.name || "");
  const [isAdmin, setIsAdmin] = useState(user.isAdmin ?? false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to reset state if the user prop changes
  useEffect(() => {
    setName(user.name || "");
    setIsAdmin(user.isAdmin ?? false);
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await updateUser({
        userId: user._id,
        name,
        isAdmin,
      });
      onComplete(); // Closes the modal or navigates away
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
      
      {/* User Details Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email (cannot be changed)</label>
          <input type="email" value={user.email || ""} disabled className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"/>
        </div>
        <div>
          <label htmlFor="name-edit" className="block text-sm font-medium text-gray-700">Name</label>
          <input id="name-edit" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div className="flex items-center">
          <input id="isAdmin-edit" type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
          <label htmlFor="isAdmin-edit" className="ml-2 block text-sm text-gray-900">User is an Admin</label>
        </div>
      </div>
      
      {/* Service Site Assignments Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Service Site Assignments</h3>
        <p className="mt-1 text-sm text-gray-500">
          This user is assigned to <strong>{user.serviceLocationIds?.length ?? 0}</strong> branches.
        </p>
        <div className="mt-4">
          <Link 
            href={`/dashboard/users/${user._id}/assignments`}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Wrench className="h-4 w-4"/>
            Manage Branch Assignments
          </Link>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button type="button" onClick={onComplete} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md disabled:bg-yellow-300 flex items-center justify-center gap-2 transition-colors">
          {isSubmitting && <Loader2 className="h-5 w-5 animate-spin"/>}
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}