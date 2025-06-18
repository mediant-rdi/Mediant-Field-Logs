// app/dashboard/page.tsx
'use client';

import { useAuth } from '@/lib/auth'; 

export default function DashboardPage() {
  // This hook is now just for getting the user info for this specific page
  const { user, isOffline } = useAuth();

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', padding: '32px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
        Welcome to your Dashboard{user ? `, ${user.email}` : ''}
      </h1>
      <p style={{ color: '#666', marginBottom: '16px' }}>
        This is your main dashboard area. Select an item from the sidebar to begin.
      </p>
      {user && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '4px', marginTop: '20px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#333' }}>User Information</h3>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}><strong>Email:</strong> {user.email}</p>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}><strong>Role:</strong> {user.role}</p>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}><strong>User ID:</strong> {user.userid}</p>
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#666' }}><strong>Connection:</strong> {isOffline ? '🔴 Offline' : '🟢 Online'}</p>
        </div>
      )}
    </div>
  );
}