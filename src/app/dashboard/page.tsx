// app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { useAuth } from '@/lib/auth'; 
import ComplaintForm from '@/components/forms/ComplaintForm';
import ServiceDelayForm from '@/components/forms/ServiceDelayForm';
import EquipmentFaultForm from '@/components/forms/EquipmentFaultForm';
import PoorExperienceForm from '@/components/forms/PoorExperienceForm';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  
  // This hook is still needed for the main dashboard content and offline status
  const { user, isLoading, isOffline } = useAuth();

  const renderActiveView = () => {
    switch (activeView) {
      case 'complaint':
        return <ComplaintForm />;
      case 'feedback-delay':
        return <ServiceDelayForm />;
      case 'feedback-fault':
        return <EquipmentFaultForm />;
      case 'feedback-experience':
        return <PoorExperienceForm />;
      case 'feedback-other':
        return <div style={{textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '8px'}}>A form for "Other Feedback" will be implemented here.</div>;
      case 'dashboard':
      default:
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
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif', flexDirection: 'column' }}>
        <div>Loading Dashboard...</div>
        {isOffline && ( <div style={{ marginTop: '10px', fontSize: '14px', color: '#666', textAlign: 'center' }}>📱 Offline mode</div> )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onItemClick={setActiveView}
        activeItem={activeView}
        // No longer passing user or isLoading here
      />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {isOffline && (
          <div style={{ backgroundColor: '#fff3cd', borderBottom: '1px solid #ffecb5', padding: '8px 16px', fontSize: '14px', color: '#856404', textAlign: 'center' }}>
            📱 You are offline - Some features may be limited
          </div>
        )}
        
        <main style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {renderActiveView()}
          </div>
        </main>
      </div>
    </div>
  );
}