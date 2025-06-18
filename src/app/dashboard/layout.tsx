'use client';

import { useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/sidebar'; 
import Header from '@/components/layout/header';   

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  
  // --- CHANGE 1: Add state for the page title ---
  const [pageTitle, setPageTitle] = useState('Dashboard');

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // --- CHANGE 2: Set the page title inside the highlighting logic ---
    if (pathname.startsWith('/dashboard/clients')) {
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

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    // Navigation logic remains the same
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
      case 'admin-view-machines':
        router.push('/dashboard/machines');
        break;
      case 'admin-add-machine':
        router.push('/dashboard/machines/add');
        break;
      default:
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
        {/* --- CHANGE 3: Pass the dynamic pageTitle state to the Header --- */}
        <Header onMenuClick={() => setSidebarOpen(true)} pageTitle={pageTitle} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}