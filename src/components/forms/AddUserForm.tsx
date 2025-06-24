// src/components/forms/AddUserForm.tsx
"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, FormEvent } from "react";
import { Copy, Check, Mail, User, Shield, AlertCircle } from "lucide-react";

export function AddUserForm() {
  const createInvitation = useMutation(api.invitations.createUserInvitation);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setInviteUrl("");
    setCopied(false);

    // Validate inputs
    if (!name.trim()) {
      setError("Name is required");
      setIsSubmitting(false);
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      setIsSubmitting(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await createInvitation({ 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        isAdmin 
      });
      
      if (result.inviteUrl) {
        setInviteUrl(result.inviteUrl);
        // Reset form
        setName("");
        setEmail("");
        setIsAdmin(false);
      } else {
        throw new Error("Failed to generate invitation URL");
      }
    } catch (err: unknown) {
      console.error("Error creating invitation:", err);
      
      let errorMessage = "Failed to create invitation.";
      
      if (err instanceof Error) {
        // Handle specific error cases
        if (err.message.includes("already exists")) {
          errorMessage = "A user with this email already exists.";
        } else if (err.message.includes("Admin access required")) {
          errorMessage = "You don't have permission to create invitations.";
        } else if (err.message.includes("Not authenticated")) {
          errorMessage = "Please log in to create invitations.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setIsAdmin(false);
    setError("");
    setInviteUrl("");
    setCopied(false);
  };

  return (
    <div className="space-y-6">
      {/* Success Message with Invitation Link */}
      {inviteUrl && (
        <div className="p-4 bg-green-50 text-green-900 border border-green-200 rounded-lg">
          <div className="flex items-center mb-2">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <p className="font-semibold text-sm">Invitation Link Created Successfully!</p>
          </div>
          <p className="text-sm text-green-700 mb-3">
            Share this link with the new user to complete their registration:
          </p>
          <div className="flex items-center">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 rounded-l-md border-green-300 bg-white px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-0 font-mono"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`flex h-[42px] items-center justify-center rounded-r-md px-3 text-white transition-colors ${
                copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
              title={copied ? "Copied!" : "Copy to clipboard"}
            >
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="mt-3 text-sm text-green-700 hover:text-green-800 underline"
          >
            Create another invitation
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        </div>
      )}
      
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
            <User className="h-4 w-4 inline mr-1" />
            Full Name
          </label>
          <input 
            id="name" 
            type="text"
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            placeholder="Enter user's full name"
            className="block w-full rounded-md border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-slate-400" 
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
            <Mail className="h-4 w-4 inline mr-1" />
            Email Address
          </label>
          <input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="Enter user's email address"
            className="block w-full rounded-md border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder-slate-400" 
          />
        </div>
        
        <div className="flex items-start pt-2">
          <div className="flex items-center h-5">
            <input
              id="isAdmin"
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="isAdmin" className="block text-sm font-medium text-slate-700">
              <Shield className="h-4 w-4 inline mr-1" />
              Administrator Access
            </label>
            <p className="text-xs text-slate-500 mt-1">
              Admins can manage users, create invitations, and access all system features
            </p>
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting || !name.trim() || !email.trim()} 
          className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Invitation...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Create & Send Invitation
            </>
          )}
        </button>
      </form>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• User receives an invitation link</li>
          <li>• They click the link and set up their password</li>
          <li>• Account is automatically activated and they can log in</li>
          <li>• Invitation links expire after 7 days for security</li>
        </ul>
      </div>
    </div>
  );
}