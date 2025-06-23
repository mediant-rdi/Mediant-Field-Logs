// src/app/dashboard/users/add/page.tsx
"use client";

import { AddUserForm } from "@/components/forms/AddUserForm";
import Link from "next/link";

export default function AddUserPage() {
  return (
    // Responsive container with better padding and margins
    <div className="p-4 sm:p-8 max-w-lg mx-auto">
      {/* Responsive header with stacking on mobile */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Invite New User</h1>
        <Link 
          href="/dashboard/users" 
          className="text-sm text-blue-500 hover:underline self-start sm:self-center"
        >
            ← Back to Users
        </Link>
      </div>
      {/* Responsive card with better padding */}
      <div className="p-4 sm:p-6 border rounded-lg bg-white shadow-md">
        <AddUserForm />
      </div>
    </div>
  );
}