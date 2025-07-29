// src/app/dashboard/users/add/page.tsx
"use client";

// --- MODIFICATION: Import the protection component ---
import AdminProtection from "@/components/AdminProtection";
import { AddUserForm } from "@/components/forms/AddUserForm";
import Link from "next/link";

export default function AddUserPage() {
  return (
    // --- MODIFICATION: Wrap the entire page content with the protection component ---
    <AdminProtection>
      <div className="p-4 sm:p-8 max-w-lg mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Invite New User</h1>
          <Link 
            href="/dashboard/users" 
            className="text-sm text-blue-500 hover:underline self-start sm:self-center"
          >
              ← Back to Users
          </Link>
        </div>
        <div className="p-4 sm:p-6 border rounded-lg bg-white shadow-md">
          <AddUserForm />
        </div>
      </div>
    </AdminProtection>
  );
}