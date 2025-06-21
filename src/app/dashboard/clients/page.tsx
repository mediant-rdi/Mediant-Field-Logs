// app/dashboard/clients/page.tsx
'use client';

import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

// A simple loading skeleton component, similar to the one on the users page.
const TableSkeleton = () => (
  <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }}>
    {[...Array(5)].map((_, i) => (
      <div key={i} style={{ height: '3rem', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
    ))}
  </div>
);

/**
 * A component to display the client data table, including loading and empty states.
 * Now styled with inline styles to match the users page.
 */
function ClientsDataTable() {
  const clients = useQuery(api.clients.listClients);

  // Loading state
  if (clients === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '160px', flexDirection: 'column' }}>
        <p style={{ color: '#6b7280' }}>Loading Clients...</p>
        <div style={{ width: '100%', marginTop: '16px' }}>
          <TableSkeleton />
        </div>
      </div>
    );
  }

  // Empty state
  if (clients.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827' }}>No Clients Found</h3>
        <p style={{ marginTop: '4px', fontSize: '0.875rem', color: '#6b7280' }}>
          Get started by adding a new client.
        </p>
        <div style={{ marginTop: '24px' }}>
          <Link
            href="/dashboard/clients/add"
            style={{ 
              backgroundColor: '#4f46e5', // indigo-600
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              textDecoration: 'none', 
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            + Add New Client
          </Link>
        </div>
      </div>
    );
  }

  // Data table
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
          <th style={{ padding: '12px 8px' }}>Client Name</th>
          <th style={{ padding: '12px 8px' }}>Agreement Type</th>
          <th style={{ padding: '12px 8px' }}>Date Added</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr key={client._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
            <td style={{ padding: '12px 8px', fontWeight: '500', color: '#111827' }}>{client.name}</td>
            <td style={{ padding: '12px 8px', color: '#374151' }}>{client.agreementType}</td>
            <td style={{ padding: '12px 8px', color: '#374151' }}>
              {new Date(client._creationTime).toLocaleDateString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ViewClientsPage() {
  return (
    // Main container with white background and padding
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px' }}>
      {/* Header section with title and Add button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600' }}>Client Management</h1>
          <p style={{ marginTop: '8px', color: '#6b7280' }}>
            A list of all clients in the system.
          </p>
        </div>
        <div>
          <Link
            href="/dashboard/clients/add"
            style={{ 
              backgroundColor: '#4f46e5', // indigo-600
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              textDecoration: 'none', 
              fontSize: '14px' 
            }}
          >
            + Add Client / Location
          </Link>
        </div>
      </div>

      {/* The data table component is rendered inside a container */}
      <div>
        <ClientsDataTable />
      </div>
    </div>
  );
}