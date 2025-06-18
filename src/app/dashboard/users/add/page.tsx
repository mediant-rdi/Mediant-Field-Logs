"use client";

import { AddUserForm } from "@/components/forms/AddUserForm";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AddUserPage() {
  const router = useRouter();

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Add New User</h1>
        <Link href="/dashboard/users" className="text-blue-500 hover:underline">
            ← Back to Users
        </Link>
      </div>
      <div className="p-6 border rounded-lg bg-white shadow-md">
        {/* 
          This AddUserForm component was updated.
          This page simply renders it and provides the `onComplete` callback.
          It doesn't need to know about the internal change from 'role' to 'isAdmin'.
        */}
        <AddUserForm onComplete={() => router.push("/dashboard/users")} />
      </div>
    </div>
  );
}