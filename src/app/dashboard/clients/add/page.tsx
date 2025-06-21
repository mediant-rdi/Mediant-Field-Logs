// app/dashboard/clients/add/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
// The 'Client' interface is no longer needed here as state is managed by Convex
import AddClientForm from '@/components/forms/AddClientForm'; 
import AddClientLocationForm from '@/components/forms/AddClientLocationForm';

export default function AddClientPage() {
  const [activeTab, setActiveTab] = useState('client');
  const [successMessage, setSuccessMessage] = useState('');
  
  // The local `clients` state is no longer needed. 
  // AddClientLocationForm fetches its own data reactively.

  // A single, simplified handler for when either form succeeds.
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);

    // If a client was just created, automatically switch to the location tab
    if (message.includes('Client')) {
        setActiveTab('location');
    }

    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Add Client / Location</h1>
        <Link href="/dashboard/clients" className="text-blue-500 hover:underline">
          ← Back to Clients
        </Link>
      </div>

      <div className="p-6 border rounded-lg bg-white shadow-md">
        <p className="mb-6 text-gray-600">
          First add a client, then add their specific locations or sites.
        </p>

        {/* Tab Navigation */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('client')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'client'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Add Client
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'location'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Add Location
          </button>
        </div>

        {/* Success Notification */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-md">
            {successMessage}
          </div>
        )}

        {/* Render the active form component with corrected props */}
        <div>
          {activeTab === 'client' && (
            <AddClientForm 
              onComplete={() => handleSuccess('Client created successfully!')} 
            />
          )}
          {activeTab === 'location' && (
            // No longer needs the `clients` prop
            <AddClientLocationForm 
              onComplete={() => handleSuccess('Location created successfully!')} 
            />
          )}
        </div>
      </div>
    </div>
  );
}