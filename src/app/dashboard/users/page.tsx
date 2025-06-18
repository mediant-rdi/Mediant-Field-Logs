"use client";

import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import Link from "next/link";
import { EditUserForm } from "@/components/forms/EditUserForm";

export default function UsersPage() {
  const {
    results: users,
    status,
    loadMore,
  } = usePaginatedQuery(api.users.getUsers, {}, { initialNumItems: 10 });
  
  const deleteUser = useMutation(api.users.deleteUser);
  const [editingUser, setEditingUser] = useState<Doc<"users"> | null>(null);

  const handleDelete = (userId: Id<"users">) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUser({ userId });
    }
  };

  return (
    <div className="p-8">
      {/* ... header and Add User button ... */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Link
          href="/dashboard/users/add"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Add User
        </Link>
      </div>

      {editingUser && (
        <div className="mb-8 p-4 border rounded-lg bg-gray-50">
           <h2 className="text-xl font-semibold mb-4">Edit User</h2>
           <EditUserForm 
             user={editingUser} 
             onComplete={() => setEditingUser(null)} 
           />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Email</th>
              {/* Changed from Role to Admin Status */}
              <th className="py-2 px-4 border-b text-left">Admin Status</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {status === "LoadingFirstPage" && <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr>}
            {users?.map((user) => (
              <tr key={user._id} className="hover:bg-gray-100">
                <td className="py-2 px-4 border-b">{user.name}</td>
                <td className="py-2 px-4 border-b">{user.email}</td>
                {/* Updated to display status based on isAdmin boolean */}
                <td className="py-2 px-4 border-b">
                  {user.isAdmin ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Admin
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Member
                    </span>
                  )}
                </td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="bg-yellow-500 text-white py-1 px-3 rounded mr-2 hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* ... load more button ... */}
      </div>
    </div>
  );
}