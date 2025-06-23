// src/components/forms/AddUserForm.tsx

"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, FormEvent } from "react";

// The onComplete prop is no longer needed as the form manages its own success state.
export function AddUserForm() {
  const createInvitation = useMutation(api.invitations.createUserInvitation);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // To display the success message and link
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Call the new mutation. It returns an object with the inviteUrl.
      const result = await createInvitation({ name, email, isAdmin });
      
      // Display the link to the admin
      setSuccess(`Invitation link created: ${result.inviteUrl}`);
      navigator.clipboard.writeText(result.inviteUrl); // Optional: copy link to clipboard
      
      // Reset form for the next invitation
      setName("");
      setEmail("");
      setIsAdmin(false);

    } catch (err: unknown) {
      // The error message from our backend function will be displayed
      let errorMessage = "Failed to create invitation.";
      if (err instanceof Error) {
          // Convex errors often include a `data` object with a more specific message.
          // We use a type assertion to safely check for this nested structure.
          const specificMessage = (err as { data?: { message?: string } }).data?.message;
          errorMessage = specificMessage || err.message;
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4"> {/* Added a parent div to contain form and messages */}
      {/* Success Message Display */}
      {success && (
        <div className="p-3 bg-green-100 text-green-800 border border-green-300 rounded-md">
            <p className="font-semibold">Success!</p>
            <p className="text-sm">{success}</p>
            <p className="text-xs mt-1">Link copied to clipboard!</p>
        </div>
      )}

      {/* Error Message Display */}
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
        </div>
        
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
          {isSubmitting ? "Creating Invitation..." : "Send Invitation"}
        </button>
      </form>
    </div>
  );
}