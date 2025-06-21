// src/app/dashboard/users/add/page.tsx

"use client";

import { AddUserForm } from "@/components/forms/AddUserForm";
import Link from "next/link";
// useRouter is no longer needed here as the form handles its own logic.
// import { useRouter } from "next/navigation";

export default function AddUserPage() {
  // const router = useRouter(); // No longer needed

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Invite New User</h1> {/* Updated Title */}
        <Link href="/dashboard/users" className="text-blue-500 hover:underline">
            ← Back to Users
        </Link>
      </div>
      <div className="p-6 border rounded-lg bg-white shadow-md">
        {/* 
          The AddUserForm no longer needs the onComplete prop. 
          It will display the invitation link directly within the component.
        */}
        <AddUserForm />
      </div>
    </div>
  );
}