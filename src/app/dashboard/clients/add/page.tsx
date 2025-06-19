// app/dashboard/clients/add/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link'; // Added for the "Back" link
import AddClientForm, { Client } from '@/components/forms/AddClientForm';
import AddClientLocationForm from '@/components/forms/AddClientLocationForm';

export default function AddClientPage() {
  const [activeTab, setActiveTab] = useState('client');
  const [successMessage, setSuccessMessage] = useState('');
  const [clients, setClients] = useState<Client[]>([]);

  const handleClientCreate = (newClient: Client) => {
    setClients(prevClients => [...prevClients, newClient]);
    setSuccessMessage('Client created successfully!');
    setActiveTab('location');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleLocationCreate = () => {
    setSuccessMessage('Location created successfully!');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    // 1. Main page container for consistent padding and centering
    <div className="p-8 max-w-lg mx-auto">
      {/* 2. Standardized page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Add Client / Location</h1>
        <Link href="/dashboard/clients" className="text-blue-500 hover:underline">
          ← Back to Clients
        </Link>
      </div>

      {/* 3. Content card for a clean, contained look */}
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

        {/* Render the active form component (removed redundant margin) */}
        <div>
          {activeTab === 'client' && (
            <AddClientForm onClientCreate={handleClientCreate} />
          )}
          {activeTab === 'location' && (
            <AddClientLocationForm clients={clients} onComplete={handleLocationCreate} />
          )}
        </div>
      </div>
    </div>
  );
}