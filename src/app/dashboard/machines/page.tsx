// app/dashboard/machines/page.tsx
'use client';

import Link from "next/link";
import { useState } from "react";
// --- CHANGE 1: Import useMutation ---
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { EditMachineForm } from "@/components/forms/EditMachineForm";

// A simple loading skeleton component
const TableSkeleton = () => (
  <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }}>
    {[...Array(3)].map((_, i) => (
      <div key={i} style={{ height: '3rem', backgroundColor: i === 0 ? '#e0e0e0' : '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
    ))}
  </div>
);

// A simple modal component
const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', minWidth: '400px', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

export default function MachinesPage() {
  const machines = useQuery(api.machines.getAll);
  
  // --- CHANGE 2: Instantiate the remove mutation from Convex ---
  const removeMachine = useMutation(api.machines.remove);

  const [editingMachine, setEditingMachine] = useState<Doc<"machines"> | null>(null);
  
  // --- CHANGE 3: Add state to track which machine is being deleted ---
  const [deletingId, setDeletingId] = useState<Id<"machines"> | null>(null);

  // --- CHANGE 4: Create a handler function for the delete action ---
  const handleDelete = async (machineId: Id<"machines">) => {
    // Always confirm a destructive action!
    const confirmed = window.confirm("Are you sure you want to delete this machine? This action cannot be undone.");
    if (confirmed) {
      setDeletingId(machineId); // Set loading state for this specific row
      try {
        await removeMachine({ id: machineId });
        // The UI will automatically update because useQuery is reactive.
      } catch (error) {
        console.error("Failed to delete machine:", error);
        alert("An error occurred while deleting the machine.");
      } finally {
        setDeletingId(null); // Reset loading state
      }
    }
  };

  if (machines === undefined) {
    return (
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '16px' }}>Machine Management</h1>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600' }}>Machine Management</h1>
        <Link href="/dashboard/machines/add" style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px' }}>
          + Add Machine
        </Link>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ padding: '12px 8px' }}>Name</th>
            <th style={{ padding: '12px 8px' }}>Description</th>
            <th style={{ padding: '12px 8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((machine) => (
            <tr key={machine._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '12px 8px' }}>{machine.name}</td>
              <td style={{ padding: '12px 8px', maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {machine.description || 'N/A'}
              </td>
              <td style={{ padding: '12px 8px', display: 'flex', gap: '16px' }}>
                <button 
                  style={{ fontSize: '14px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setEditingMachine(machine)}
                >
                  Edit
                </button>
                {/* --- CHANGE 5: Add the Delete button and its logic --- */}
                <button
                  style={{ fontSize: '14px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', opacity: deletingId === machine._id ? 0.5 : 1 }}
                  onClick={() => handleDelete(machine._id)}
                  disabled={deletingId === machine._id} // Disable while this specific machine is being deleted
                >
                  {deletingId === machine._id ? "Deleting..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {machines.length === 0 && <p style={{ textAlign: 'center', padding: '20px' }}>No machines found. Click "Add Machine" to get started.</p>}

      {editingMachine && (
        <Modal onClose={() => setEditingMachine(null)}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Edit Machine</h2>
          <EditMachineForm 
            machine={editingMachine}
            onComplete={() => setEditingMachine(null)}
          />
        </Modal>
      )}
    </div>
  );
}