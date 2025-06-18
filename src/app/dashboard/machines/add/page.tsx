// app/dashboard/machines/add/page.tsx
'use client';

import { useRouter } from "next/navigation";
import { AddMachineForm } from "@/components/forms/AddMachineForm"; // Adjust path if needed

export default function AddMachinePage() {
  const router = useRouter();

  // This function will be called by the form upon successful creation
  const handleFormComplete = () => {
    // Redirects the user back to the list of all machines
    router.push("/dashboard/machines");
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '24px' }}>Add a New Machine</h1>
      
      {/* 
        The AddMachineForm is rendered here. 
        We pass the onComplete function so it knows what to do after submission.
      */}
      <AddMachineForm onComplete={handleFormComplete} />
    </div>
  );
}