// src/app/dashboard/layout.tsx
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar'; 
import Header from '@/components/layout/header';   

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  
  // RESTORED: State for the dynamic page title
  const [pageTitle, setPageTitle] = useState('Dashboard');

  const router = useRouter();
  const pathname = usePathname();

  // RESTORED: The complete useEffect hook for highlighting items and setting titles
  useEffect(() => {
    // Logic to set the active item and page title based on the current URL
    if (pathname.startsWith('/dashboard/clients/add')) {
        setActiveItem('admin-add-client');
        setPageTitle('Add Client / Location');
    } else if (pathname.startsWith('/dashboard/clients')) {
        setActiveItem('clients-view');
        setPageTitle('View Clients');
    } else if (pathname.startsWith('/dashboard/products')) {
        setActiveItem('products-view');
        setPageTitle('View Products');
    } else if (pathname.startsWith('/dashboard/reports/machine-dev')) {
        setActiveItem('reports-machine-dev');
        setPageTitle('Machine Development Reports');
    } else if (pathname.startsWith('/dashboard/complaint/customer')) {
      setActiveItem('complaint-customer');
      setPageTitle('Customer Complaint');
    } else if (pathname.startsWith('/dashboard/complaint/engineer')) {
      setActiveItem('complaint-engineer');
      setPageTitle('Engineer Complaint');
    } else if (pathname === '/dashboard/feedback') { 
        setActiveItem('feedback-form');
        setPageTitle('Customer Feedback & Recommendation');
    } else if (pathname.startsWith('/dashboard/users/add')) {
        setActiveItem('admin-add-user');
        setPageTitle('Add New User');
    } else if (pathname.startsWith('/dashboard/users')) {
        setActiveItem('admin-view-users');
        setPageTitle('User Management');
    } else if (pathname.startsWith('/dashboard/machines/add')) {
        setActiveItem('admin-add-machine');
        setPageTitle('Add New Machine');
    } else if (pathname.startsWith('/dashboard/machines')) {
        setActiveItem('admin-view-machines');
        setPageTitle('Machine Management');
    } else if (pathname === '/dashboard') {
        setActiveItem('dashboard');
        setPageTitle('Dashboard');
    }
  }, [pathname]);

  // RESTORED: The complete click handler with all navigation cases
  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    switch (itemId) {
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'clients-view':
        router.push('/dashboard/clients');
        break;
      case 'products-view':
        router.push('/dashboard/products');
        break;
      case 'reports-machine-dev':
        router.push('/dashboard/reports/machine-dev');
        break;
      case 'feedback-form':
        router.push('/dashboard/feedback');
        break;
      case 'complaint-customer':
        router.push('/dashboard/complaint/customer');
        break;
      case 'complaint-engineer':
        router.push('/dashboard/complaint/engineer');
        break;
      case 'admin-view-users':
        router.push('/dashboard/users');
        break;
      case 'admin-add-user':
        router.push('/dashboard/users/add');
        break;
      // --- ADDED: The navigation case for the new item ---
      case 'admin-add-client':
        router.push('/dashboard/clients/add');
        break;
      // ----------------------------------------------------
      case 'admin-view-machines':
        router.push('/dashboard/machines');
        break;
      case 'admin-add-machine':
        router.push('/dashboard/machines/add');
        break;
      default:
        // Optional: log if a route is not defined
        console.warn(`Navigation for "${itemId}" is not defined.`);
        break;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onItemClick={handleItemClick}
        activeItem={activeItem}
      />
      <div className="flex-1 flex flex-col">
        {/* UPDATED: Pass the dynamic pageTitle state to the Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} pageTitle={pageTitle} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}