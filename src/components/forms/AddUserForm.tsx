"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, FormEvent } from "react";

interface AddUserFormProps {
  onComplete: () => void;
}

export function AddUserForm({ onComplete }: AddUserFormProps) {
  const createUser = useMutation(api.users.adminCreateUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Changed from `role` state to `isAdmin` state
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Pass `isAdmin` boolean to the mutation
      await createUser({ name, email, isAdmin });
      onComplete();
    } catch (err: any) {
      setError(err.message || "Failed to create user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      {/* Name and Email fields are unchanged */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
        <input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
      </div>
      
      {/* Replaced role dropdown with a checkbox for isAdmin */}
      <div className="flex items-center">
        <input
          id="isAdmin"
          type="checkbox"
          checked={isAdmin}
          onChange={(e) => setIsAdmin(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-900">
          Make this user an Admin
        </label>
      </div>
      
      <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300">
        {isSubmitting ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}