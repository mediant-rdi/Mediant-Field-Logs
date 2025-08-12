// src/app/dashboard/layout.tsx
'use client';

import { useState, useEffect, ReactNode, Fragment } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useConvexAuth } from "convex/react";
import Sidebar from '@/components/layout/sidebar'; 
import Header from '@/components/layout/header';   

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Logic for setting active item and page title
  useEffect(() => {
    // Check for the admin page first
    if (pathname.startsWith('/dashboard/service-logs/admin')) {
        setActiveItem('admin-activate-service');
        setPageTitle('Activate Service Period');
    // --- MODIFIED: Simplified rule for the main service logs page ---
    } else if (pathname.startsWith('/dashboard/service-logs')) {
        setActiveItem('service-logs'); // Matches the parent ID now
        setPageTitle('My Service Logs');
    } else if (pathname.startsWith('/dashboard/reports/add')) {
        setActiveItem('admin-add-report');
        setPageTitle('Add Report');
    } else if (pathname.startsWith('/dashboard/clients/add')) {
        setActiveItem('admin-add-client');
        setPageTitle('Add Client / Location');
    } else if (pathname.startsWith('/dashboard/clients')) {
        setActiveItem('clients-view');
        setPageTitle('View Clients');
    } else if (pathname.startsWith('/dashboard/reports/machine-dev')) {
        setActiveItem('reports-machine-dev');
        setPageTitle('Machine Development Reports');
    } else if (pathname.startsWith('/dashboard/complaint/customer')) {
      setActiveItem('complaint-customer');
      setPageTitle('Customer Complaint');
    } else if (pathname.startsWith('/dashboard/complaint/engineer')) {
      setActiveItem('complaint-engineer');
      setPageTitle('Engineer Complaint');
    } else if (pathname.startsWith('/dashboard/call-logs')) {
      setActiveItem('call-logs');
      setPageTitle('Call Logs');
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
    } else if (pathname.startsWith('/dashboard/manuals/add')) {
        setActiveItem('admin-add-manual');
        setPageTitle('Add Machine Manual');
    } else if (pathname.startsWith('/dashboard/machines')) {
        setActiveItem('machines');
        setPageTitle('Product Management');
    } else if (pathname.startsWith('/dashboard/manuals')) { 
        setActiveItem('manuals-view');
        setPageTitle('Machine Manuals');
    } else if (pathname === '/dashboard') {
        setActiveItem('dashboard');
        setPageTitle('Dashboard');
    }
  }, [pathname]);

  const handleItemClick = (itemId: string) => {
    setActiveItem(itemId);
    switch (itemId) {
      case 'dashboard': router.push('/dashboard'); break;
      case 'clients-view': router.push('/dashboard/clients'); break;
      case 'machines': router.push('/dashboard/machines'); break;
      case 'manuals-view': router.push('/dashboard/manuals'); break;
      case 'reports-machine-dev': router.push('/dashboard/reports/machine-dev'); break;
      case 'feedback-form': router.push('/dashboard/feedback'); break;
      case 'complaint-customer': router.push('/dashboard/complaint/customer'); break;
      case 'complaint-engineer': router.push('/dashboard/complaint/engineer'); break;
      case 'call-logs': router.push('/dashboard/call-logs'); break;
      // --- MODIFIED: Simplified navigation case ---
      case 'service-logs': router.push('/dashboard/service-logs'); break;
      case 'admin-activate-service': router.push('/dashboard/service-logs/admin'); break;
      case 'admin-view-users': router.push('/dashboard/users'); break;
      case 'admin-add-user': router.push('/dashboard/users/add'); break;
      case 'admin-add-client': router.push('/dashboard/clients/add'); break;
      case 'admin-add-machine': router.push('/dashboard/machines/add'); break;
      case 'admin-add-manual': router.push('/dashboard/manuals/add'); break; 
      case 'admin-add-report': router.push('/dashboard/reports/add'); break;
      default: console.warn(`Navigation for "${itemId}" is not defined.`); break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Fragment>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onItemClick={handleItemClick}
          activeItem={activeItem}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuClick={() => setSidebarOpen(true)} pageTitle={pageTitle} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
      <div id="dialog-portal"></div>
    </Fragment>
  );
}