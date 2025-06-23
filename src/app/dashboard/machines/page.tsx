// app/dashboard/machines/page.tsx
'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { EditMachineForm } from "@/components/forms/EditMachineForm";

// A responsive loading skeleton component
const TableSkeleton = () => (
  <div className="animate-pulse">
    {/* Mobile Card Skeleton */}
    <div className="space-y-4 md:hidden">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="h-6 w-1/3 rounded bg-gray-300"></div>
          <div className="h-28 rounded-lg bg-gray-200"></div>
        </div>
      ))}
    </div>
    {/* Desktop Table Skeleton */}
    <div className="hidden md:block">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-12 rounded bg-gray-200 mb-2"></div>
      ))}
    </div>
  </div>
);

// A responsive modal component
const Modal = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div 
    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
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

export default function MachinesPage() {
  const machines = useQuery(api.machines.getAll);
  const removeMachine = useMutation(api.machines.remove);
  const currentUser = useQuery(api.users.current);

  const [editingMachine, setEditingMachine] = useState<Doc<"machines"> | null>(null);
  const [deletingId, setDeletingId] = useState<Id<"machines"> | null>(null);

  const groupedMachines = useMemo(() => {
    if (!machines) return {};
    return machines.reduce((acc, machine) => {
      const category = machine.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(machine);
      return acc;
    }, {} as Record<string, Doc<"machines">[]>);
  }, [machines]);

  const sortedCategories = useMemo(() => Object.keys(groupedMachines).sort(), [groupedMachines]);

  const handleDelete = async (machineId: Id<"machines">) => {
    const confirmed = window.confirm("Are you sure you want to delete this machine? This action cannot be undone.");
    if (confirmed) {
      setDeletingId(machineId);
      try {
        await removeMachine({ id: machineId });
      } catch (error) {
        console.error("Failed to delete machine:", error);
        alert("An error occurred while deleting the machine.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (machines === undefined || currentUser === undefined) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h1 className="text-xl sm:text-2xl font-semibold mb-4">Machine Management</h1>
        <TableSkeleton />
      </div>
    );
  }

  const isAdmin = currentUser?.isAdmin;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">Machine Management</h1>
        {isAdmin && (
          <Link href="/dashboard/machines/add" className="self-start sm:self-auto bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            + Add Machine
          </Link>
        )}
      </div>

      {machines.length === 0 ? (
        <p className="text-center py-5 text-gray-500">No machines found. {isAdmin ? 'Click "Add Machine" to get started.' : ''}</p>
      ) : (
        <div className="space-y-8">
          {sortedCategories.map(category => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-3 capitalize border-b-2 border-gray-200 pb-2 text-gray-800">
                {category}
              </h2>

              {/* Mobile View: Cards */}
              <div className="space-y-4 md:hidden">
                {groupedMachines[category].map((machine) => (
                  <div key={machine._id} className="bg-gray-50 p-4 border rounded-lg shadow-sm space-y-3">
                    <div className="font-semibold text-gray-900">{machine.name}</div>
                    <p className="text-sm text-gray-600 line-clamp-3">{machine.description || 'N/A'}</p>
                    {isAdmin && (
                      <div className="flex gap-4 pt-2 border-t border-gray-200">
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-800" onClick={() => setEditingMachine(machine)}>Edit</button>
                        <button className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50" onClick={() => handleDelete(machine._id)} disabled={deletingId === machine._id}>
                          {deletingId === machine._id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-200 text-gray-500">
                    <tr>
                      <th className="px-3 py-3 font-medium w-[30%]">Name</th>
                      <th className="px-3 py-3 font-medium w-[50%]">Description</th>
                      {isAdmin && <th className="px-3 py-3 font-medium w-[20%]">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {groupedMachines[category].map((machine) => (
                      <tr key={machine._id}>
                        <td className="px-3 py-3 font-medium text-gray-900">{machine.name}</td>
                        <td className="px-3 py-3 text-gray-600 truncate max-w-sm">{machine.description || 'N/A'}</td>
                        {isAdmin && (
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-4">
                              <button className="text-sm text-blue-600 hover:underline" onClick={() => setEditingMachine(machine)}>Edit</button>
                              <button className="text-sm text-red-600 hover:underline disabled:opacity-50 disabled:no-underline" onClick={() => handleDelete(machine._id)} disabled={deletingId === machine._id}>
                                {deletingId === machine._id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {editingMachine && (
        <Modal onClose={() => setEditingMachine(null)}>
          <h2 className="text-xl font-semibold mb-4">Edit Machine</h2>
          <EditMachineForm 
            machine={editingMachine}
            onComplete={() => setEditingMachine(null)}
          />
        </Modal>
      )}
    </div>
  );
}