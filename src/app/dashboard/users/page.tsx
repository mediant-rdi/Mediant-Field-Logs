// app/dashboard/users/page.tsx
"use client";

import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useState } from "react";
import Link from "next/link";
import { EditUserForm } from "@/components/forms/EditUserForm"; // Adjust path if needed

// --- COPIED FROM MACHINES PAGE ---
// A simple loading skeleton component
const TableSkeleton = () => (
  <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }}>
    {[...Array(5)].map((_, i) => (
      <div key={i} style={{ height: '3rem', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
    ))}
  </div>
);

// A simple modal component
const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', minWidth: '400px', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);
// --- END OF COPIED COMPONENTS ---

export default function UsersPage() {
  const {
    results: users,
    status,
    loadMore,
  } = usePaginatedQuery(api.users.getUsers, {}, { initialNumItems: 15 });
  
  const deleteUser = useMutation(api.users.deleteUser);
  const [editingUser, setEditingUser] = useState<Doc<"users"> | null>(null);
  
  // --- UPGRADED DELETE LOGIC ---
  const [deletingId, setDeletingId] = useState<Id<"users"> | null>(null);

  const handleDelete = async (userId: Id<"users">) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setDeletingId(userId);
      try {
        await deleteUser({ userId });
      } catch (error) {
        console.error("Failed to delete user:", error);
        alert("An error occurred while deleting the user.");
      } finally {
        setDeletingId(null);
      }
    }
  };
  
  // --- NEW LOADING STATE UI ---
  if (status === "LoadingFirstPage") {
    return (
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '600' }}>User Management</h1>
          <div style={{ backgroundColor: '#ccc', width: '120px', height: '36px', borderRadius: '6px' }}></div>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    // --- UPDATED STYLING FOR MAIN CONTAINER ---
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600' }}>User Management</h1>
        <Link
          href="/dashboard/users/add"
          style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }}
        >
          + Add User
        </Link>
      </div>

      {/* --- UPDATED TABLE STYLING --- */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ padding: '12px 8px' }}>Name</th>
            <th style={{ padding: '12px 8px' }}>Email</th>
            <th style={{ padding: '12px 8px' }}>Admin Status</th>
            <th style={{ padding: '12px 8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr key={user._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '12px 8px' }}>{user.name || 'N/A'}</td>
              <td style={{ padding: '12px 8px' }}>{user.email || 'N/A'}</td>
              <td style={{ padding: '12px 8px' }}>
                {user.isAdmin ? (
                  <span style={{ display: 'inline-flex', padding: '2px 8px', fontSize: '12px', fontWeight: '500', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#166534' }}>
                    Admin
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', padding: '2px 8px', fontSize: '12px', fontWeight: '500', borderRadius: '9999px', backgroundColor: '#f3f4f6', color: '#374151' }}>
                    Member
                  </span>
                )}
              </td>
              <td style={{ padding: '12px 8px', display: 'flex', gap: '16px' }}>
                <button
                  onClick={() => setEditingUser(user)}
                  style={{ fontSize: '14px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user._id)}
                  style={{ fontSize: '14px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', opacity: deletingId === user._id ? 0.5 : 1 }}
                  disabled={deletingId === user._id}
                >
                  {deletingId === user._id ? "Deleting..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users && users.length === 0 && <p style={{ textAlign: 'center', padding: '20px' }}>No users found. Click "Add User" to get started.</p>}
      
      {/* Load More Button - kept for pagination functionality */}
      {status === "CanLoadMore" && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => loadMore(15)}
            style={{ backgroundColor: '#e5e7eb', color: '#1f2937', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            Load More
          </button>
        </div>
      )}

      {/* --- EDIT FORM IS NOW IN A MODAL --- */}
      {editingUser && (
        <Modal onClose={() => setEditingUser(null)}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Edit User</h2>
          <EditUserForm 
            user={editingUser}
            onComplete={() => setEditingUser(null)} 
          />
        </Modal>
      )}
    </div>
  );
}