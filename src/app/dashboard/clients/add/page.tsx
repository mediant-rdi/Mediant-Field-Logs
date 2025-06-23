// app/dashboard/clients/add/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import AddClientForm from '@/components/forms/AddClientForm'; 
import AddClientLocationForm from '@/components/forms/AddClientLocationForm';

export default function AddClientPage() {
  const [activeTab, setActiveTab] = useState('client');
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    if (message.includes('Client')) {
      setActiveTab('location');
    }
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    // Use responsive padding: p-4 on small screens, p-8 on medium screens and up.
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header stacks on very small screens, row on others */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Add Client / Location</h1>
        <Link 
          href="/dashboard/clients" 
          className="text-sm text-blue-600 hover:underline self-start sm:self-center"
        >
          ← Back to Clients
        </Link>
      </div>

      {/* Form container card with responsive padding */}
      <div className="p-4 sm:p-6 border rounded-lg bg-white shadow-md">
        <p className="mb-6 text-sm text-gray-600">
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
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        {/* Render the active form component */}
        <div>
          {activeTab === 'client' && (
            <AddClientForm 
              onComplete={() => handleSuccess('Client created successfully!')} 
            />
          )}
          {activeTab === 'location' && (
            <AddClientLocationForm 
              onComplete={() => handleSuccess('Location created successfully!')} 
            />
          )}
        </div>
      </div>
    </div>
  );
}