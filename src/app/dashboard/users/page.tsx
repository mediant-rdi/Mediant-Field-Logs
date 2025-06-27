// src/app/dashboard/users/page.tsx
"use client";

import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import Link from "next/link";

// --- MODALS & NOTIFICATIONS ---
import { ResetPasswordModal } from "@/components/modals/ResetPasswordModal";
import { Toaster, toast } from 'sonner';
import { EditUserForm } from "@/components/forms/EditUserForm";

// --- RESPONSIVE & UTILITY COMPONENTS ---
const TableSkeleton = () => (
  <div className="animate-pulse">
    {/* Mobile Card Skeleton */}
    <div className="space-y-4 md:hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-32 rounded-lg bg-gray-200"></div>
      ))}
    </div>
    {/* Desktop Table Skeleton */}
    <div className="hidden md:block">
      <div className="border-b border-gray-200 mb-2">
        <div className="h-8 rounded bg-gray-200"></div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 rounded bg-gray-200 mb-2"></div>
      ))}
    </div>
  </div>
);

const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div 
    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div 
      className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" 
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);
// --- END OF COMPONENTS ---

export default function UsersPage() {
  // --- DATA FETCHING ---
  const {
    results: users,
    status,
    loadMore,
  } = usePaginatedQuery(api.users.getUsers, {}, { initialNumItems: 15 });

  // --- AUTHENTICATION & PERMISSIONS ---
  const currentUser = useQuery(api.users.current);
  const isAdmin = currentUser?.isAdmin === true;

  // --- MUTATIONS ---
  const deleteUser = useMutation(api.users.deleteUser);
  const generateLink = useMutation(api.passwordResets.admin_generatePasswordResetLink);

  // --- STATE MANAGEMENT ---
  const [editingUser, setEditingUser] = useState<Doc<"users"> | null>(null);
  const [deletingId, setDeletingId] = useState<Id<"users"> | null>(null);
  
  // State for password reset functionality
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [isResetting, setIsResetting] = useState<Id<"users"> | null>(null);

  // --- HANDLERS ---
  const handleDelete = async (userId: Id<"users">) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      setDeletingId(userId);
      try {
        await deleteUser({ userId });
        toast.success("User successfully deleted.");
      } catch (error: unknown) {
        console.error("Failed to delete user:", error);
        const errorMessage = error instanceof Error && 'data' in error && 
          typeof error.data === 'object' && error.data !== null && 
          'message' in error.data && typeof error.data.message === 'string'
          ? error.data.message
          : "An error occurred while deleting the user.";
        toast.error(errorMessage);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleResetPassword = async (userId: Id<"users">) => {
    setIsResetting(userId);
    try {
      const result = await generateLink({ userId });
      if (result.resetUrl) {
        setResetUrl(result.resetUrl);
        setIsResetModalOpen(true);
        toast.info("Password reset link generated. The user can use this link to set a new password.");
      }
    } catch (error: unknown) {
      console.error("Failed to generate reset link:", error);
      const errorMessage = error instanceof Error && 'data' in error && 
        typeof error.data === 'object' && error.data !== null && 
        'message' in error.data && typeof error.data.message === 'string'
        ? error.data.message
        : "An unexpected error occurred.";
      toast.error(errorMessage);
    } finally {
      setIsResetting(null);
    }
  };
  
  // --- RENDER LOGIC ---
  if (status === "LoadingFirstPage") {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold">User Management</h1>
          <div className="h-9 w-28 bg-gray-300 rounded-md self-start sm:self-auto"></div>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <ResetPasswordModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} resetUrl={resetUrl} />
      
      {editingUser && (
        <Modal onClose={() => setEditingUser(null)}>
          <h2 className="text-xl font-semibold mb-4">Edit User</h2>
          <EditUserForm 
            user={editingUser}
            onComplete={() => {
              setEditingUser(null);
              toast.success("User updated successfully!");
            }} 
          />
        </Modal>
      )}

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold">User Management</h1>
          {isAdmin && (
            <Link
              href="/dashboard/users/add"
              className="self-start sm:self-auto bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + Add User
            </Link>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="space-y-4 md:hidden">
          {users?.map((user) => (
            <div key={user._id} className="bg-gray-50 p-4 border rounded-lg shadow-sm space-y-3">
              <div>
                <div className="font-semibold text-gray-900">{user.name || 'N/A'}</div>
                <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
              </div>
              <div>
                <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${user.isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                  {user.isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
              {isAdmin && (
                <div className="flex gap-x-4 pt-2 border-t border-gray-200 flex-wrap">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-800" onClick={() => setEditingUser(user)}>Edit</button>
                  <button className="text-sm font-medium text-yellow-600 hover:text-yellow-800 disabled:opacity-50" onClick={() => handleResetPassword(user._id)} disabled={isResetting === user._id}>
                    {isResetting === user._id ? "Generating..." : "Reset Password"}
                  </button>
                  <button className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50" onClick={() => handleDelete(user._id)} disabled={deletingId === user._id}>
                    {deletingId === user._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Role</th>
                {isAdmin && <th className="px-3 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users?.map((user) => (
                <tr key={user._id}>
                  <td className="px-3 py-4 font-medium text-gray-900">{user.name || 'N/A'}</td>
                  <td className="px-3 py-4 text-gray-600">{user.email || 'N/A'}</td>
                  <td className="px-3 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${user.isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                      {user.isAdmin ? 'Admin' : 'Member'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-4">
                        <button className="text-sm text-blue-600 hover:underline" onClick={() => setEditingUser(user)}>Edit</button>
                        <button className="text-sm text-yellow-600 hover:underline disabled:opacity-50 disabled:no-underline" onClick={() => handleResetPassword(user._id)} disabled={isResetting === user._id}>
                          {isResetting === user._id ? "Generating..." : "Reset Password"}
                        </button>
                        <button className="text-sm text-red-600 hover:underline disabled:opacity-50 disabled:no-underline" onClick={() => handleDelete(user._id)} disabled={deletingId === user._id}>
                          {deletingId === user._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users && users.length === 0 && <p className="text-center py-5 text-gray-500">No users found. {isAdmin ? 'Click "Add User" to get started.' : ''}</p>}
        
        {(status === "CanLoadMore" || status === "LoadingMore") && (
          <div className="text-center mt-6">
            <button
              onClick={() => loadMore(15)}
              disabled={status === "LoadingMore"}
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              {status === "LoadingMore" ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}