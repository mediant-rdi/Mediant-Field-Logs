// app/dashboard/machines/add/page.tsx
'use client';

// --- MODIFICATION: Import the protection component ---
import AdminProtection from "@/components/AdminProtection";

import { useRouter } from "next/navigation";
import { AddMachineForm } from "@/components/forms/AddMachineForm";

export default function AddMachinePage() {
  const router = useRouter();

  const handleFormComplete = () => {
    router.push("/dashboard/machines");
  };

  return (
    // --- MODIFICATION: Wrap the entire page content with the protection component ---
    <AdminProtection>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-xl mx-auto my-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
          Add a New Machine
        </h1>
        
        <AddMachineForm onComplete={handleFormComplete} />
      </div>
    </AdminProtection>
  );
}