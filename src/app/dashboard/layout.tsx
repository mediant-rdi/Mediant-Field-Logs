// app/dashboard/layout.tsx
'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // <-- Import Next.js router
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import { useAuth } from '@/lib/auth'; // Keep for loading/offline state

export default function DashboardLayout({
  children, // This prop will be your actual page content (e.g., user list, add form)
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  // This hook is used here for the global loading and offline status
  const { isLoading, isOffline } = useAuth();

  // This function now uses the router to change pages
  const handleItemClick = (itemId: string) => {
    switch (itemId) {
      case 'dashboard':
        router.push('/dashboard');
        break;
      // --- Admin Panel Links ---
      case 'admin-view-users':
        router.push('/dashboard/users'); // Navigates to the user list page
        break;
      case 'admin-add-user':
        router.push('/dashboard/users/add'); // Navigates to the add user page
        break;
      // --- NEW: Machine Links ---
      case 'admin-view-machines':
        router.push('/dashboard/machines'); // Navigates to the machine list page
        break;
      case 'admin-add-machine':
        router.push('/dashboard/machines/add'); // Navigates to the add machine page
        break;
      // --- Other Links ---
      case 'complaint':
        // Assuming you will create a page at /dashboard/complaint
        router.push('/dashboard/complaint'); 
        break;
      case 'feedback-delay':
        // Assuming you will create a page at /dashboard/feedback/delay
        router.push('/dashboard/feedback/delay');
        break;
      case 'feedback-fault':
         // Assuming you will create a page at /dashboard/feedback/fault
        router.push('/dashboard/feedback/fault');
        break;
      case 'feedback-experience':
         // Assuming you will create a page at /dashboard/feedback/experience
        router.push('/dashboard/feedback/experience');
        break;
      // Add other cases as you build out pages
      default:
        console.log(`Route not defined for ID: ${itemId}`);
    }
  };

  // This function determines which sidebar item should be highlighted
  // based on the current URL path.
  const getActiveItem = (): string => {
    // Order is important: check for more specific paths first
    if (pathname === '/dashboard/users/add') return 'admin-add-user';
    if (pathname.startsWith('/dashboard/users')) return 'admin-view-users';
    
    // --- NEW: Machine Highlighting ---
    if (pathname === '/dashboard/machines/add') return 'admin-add-machine';
    if (pathname.startsWith('/dashboard/machines')) return 'admin-view-machines';

    if (pathname === '/dashboard/complaint') return 'complaint';
    if (pathname === '/dashboard/feedback/delay') return 'feedback-delay';
    if (pathname === '/dashboard/feedback/fault') return 'feedback-fault';
    if (pathname === '/dashboard/feedback/experience') return 'feedback-experience';
    if (pathname === '/dashboard') return 'dashboard';
    return 'dashboard'; // Default to dashboard
  };

  // This function gets the title for the header based on the active item ID
  const getPageTitle = (viewId: string): string => {
    const titleMap: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'admin-view-users': 'User Management',
      'admin-add-user': 'Add New User',
      
      // --- NEW: Machine Titles ---
      'admin-view-machines': 'Machine Management',
      'admin-add-machine': 'Add New Machine',

      'feedback-delay': 'Service Delay',
      'feedback-fault': 'Equipment Fault',
      'feedback-experience': 'Poor Experience',
      'feedback-other': 'Other',
      'complaint': 'Complaint Logging',
      'settings': 'Settings',
    };
    return titleMap[viewId] || 'Dashboard';
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui, sans-serif', flexDirection: 'column' }}>
        <div>Loading Dashboard...</div>
        {isOffline && ( <div style={{ marginTop: '10px', fontSize: '14px', color: '#666', textAlign: 'center' }}>📱 Offline mode</div> )}
      </div>
    );
  }

  const activeItem = getActiveItem();

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onItemClick={handleItemClick} // <-- Use the new navigation handler
        activeItem={activeItem}        // <-- Set active item based on URL
      />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header onMenuClick={() => setSidebarOpen(true)} pageTitle={getPageTitle(activeItem)} />
        
        {isOffline && (
          <div style={{ backgroundColor: '#fff3cd', borderBottom: '1px solid #ffecb5', padding: '8px 16px', fontSize: '14px', color: '#856404', textAlign: 'center' }}>
            📱 You are offline - Some features may be limited
          </div>
        )}
        
        <main style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto', backgroundColor: '#f5f5f5', padding: '24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {children} {/* <-- Your page content renders here */}
          </div>
        </main>
      </div>
    </div>
  );
}