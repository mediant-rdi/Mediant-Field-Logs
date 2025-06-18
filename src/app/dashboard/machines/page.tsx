// app/dashboard/machines/page.tsx
'use client';

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc } from "../../../../convex/_generated/dataModel";
import { EditMachineForm } from "@/components/forms/EditMachineForm"; // Adjust path if needed

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
  // 1. Fetch all machines from Convex
  const machines = useQuery(api.machines.getAll);
  
  // 2. State to manage which machine is being edited (and if the modal is open)
  const [editingMachine, setEditingMachine] = useState<Doc<"machines"> | null>(null);

  // 3. Render a loading state
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

      {/* 4. Display the table of machines */}
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
              <td style={{ padding: '12px 8px' }}>
                <button 
                  style={{ fontSize: '14px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setEditingMachine(machine)} // 5. Click to open the edit modal
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {machines.length === 0 && <p style={{ textAlign: 'center', padding: '20px' }}>No machines found. Click "Add Machine" to get started.</p>}

      {/* 6. The Edit Modal: Renders only when a machine is selected for editing */}
      {editingMachine && (
        <Modal onClose={() => setEditingMachine(null)}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>Edit Machine</h2>
          <EditMachineForm 
            machine={editingMachine}
            onComplete={() => setEditingMachine(null)} // Close modal on completion
          />
        </Modal>
      )}
    </div>
  );
}