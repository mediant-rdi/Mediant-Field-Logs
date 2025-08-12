// src/components/layout/sidebar.tsx
'use client';

import { useState, useMemo } from "react";
import Image from "next/image";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import logoImage from "../../images/logo.jpg";

// --- ICONS ---
import {
  LayoutDashboard,
  MessageSquareHeart,
  FileWarning,
  Users,
  Server,
  ClipboardList,
  Shield,
  BookOpen,
  PhoneCall,
  Wrench,
  ChevronDown
} from "lucide-react";


const baseMenuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'feedback-form', name: 'Feedback', icon: <MessageSquareHeart size={20} />, },
  { 
    id: 'complaint', 
    name: 'Complaint Logging', 
    icon: <FileWarning size={20} />,
    subItems: [
      { id: 'complaint-customer', name: 'Customer Complaint' },
      { id: 'complaint-engineer', name: 'Engineer Complaint' }
    ]
  },
  { id: 'call-logs', name: 'Call Logs', icon: <PhoneCall size={20} /> },
  { id: 'service-logs', name: 'Service Logs', icon: <Wrench size={20} /> },
  { id: 'clients-view', name: 'View Clients', icon: <Users size={20} />, },
  { id: 'machines', name: 'View Products', icon: <Server size={20} />, },
  { id: 'manuals-view', name: 'Machine Manuals', icon: <BookOpen size={20} /> },
  { id: 'reports-machine-dev', name: 'Machine Reports', icon: <ClipboardList size={20} />, },
  { 
    id: 'admin', 
    name: 'Admin Panel', 
    icon: <Shield size={20} />,
    subItems: [
      { id: 'admin-view-users', name: 'View Users' },
      { id: 'admin-add-user', name: 'Add User' },
      { id: 'admin-add-client', name: 'Add Client / Location' },
      { id: 'admin-add-machine', 'name': 'Add Machine' },
      { id: 'admin-add-manual', name: 'Add Manual' },
      { id: 'admin-add-report', name: 'Add Report' },
      { id: 'admin-activate-service', name: 'Activate Service Period' },
    ]
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onItemClick: (itemId: string) => void;
  activeItem: string;
}

export default function Sidebar({ isOpen, onClose, onItemClick, activeItem }: SidebarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");

  // --- MODIFICATION: Updated menu logic to handle call log permissions ---
  const menuItems = useMemo(() => {
    const activeParent = baseMenuItems.find(item => item.subItems?.some(sub => sub.id === activeItem));
    if (activeParent && openDropdown !== activeParent.id) {
        setOpenDropdown(activeParent.id);
    }
    
    // While loading, hide items that depend on any user permissions to prevent flashing.
    if (isLoading || !user) {
      return baseMenuItems.filter(item => item.id !== 'admin' && item.id !== 'call-logs');
    }

    // Start with all items and filter down based on permissions.
    let filteredItems = [...baseMenuItems];

    // 1. Filter Admin Panel if the user is not an admin.
    if (!user.isAdmin) {
      filteredItems = filteredItems.filter(item => item.id !== 'admin');
    }
    
    // 2. Filter Call Logs if the user does not have specific permission.
    if (!user.canAccessCallLogs) {
      filteredItems = filteredItems.filter(item => item.id !== 'call-logs');
    }

    return filteredItems;
    
  }, [user, isLoading, activeItem, openDropdown]); 


  const handleItemClick = (itemId: string) => { onItemClick(itemId); onClose(); };
  const handleDropdownToggle = (itemId: string) => { setOpenDropdown(prev => (prev === itemId ? null : itemId)); };
  const getUserInitials = (name?: string | null, email?: string | null) => { if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); if (email) return email.slice(0, 2).toUpperCase(); return 'U'; };
  const getDisplayName = (name?: string | null, email?: string | null) => name || email?.split('@')[0] || 'User';
  const renderUserProfile = () => { if (isLoading) { return ( <div style={userProfileStyle}> <div style={{ ...userAvatarStyle, backgroundColor: '#e5e5e5' }}> <div style={{ width: '20px', height: '20px', backgroundColor: '#ccc', borderRadius: '50%' }}></div> </div> <div style={userInfoStyle}> <div style={{ height: '14px', backgroundColor: '#e5e5e5', borderRadius: '4px', marginBottom: '4px' }}></div> <div style={{ height: '12px', backgroundColor: '#e5e5e5', borderRadius: '4px', width: '80%' }}></div> </div> </div> ); } if (!user) return null; return ( <div style={userProfileStyle}> <div style={userAvatarStyle}><span>{getUserInitials(user?.name, user?.email)}</span></div> <div style={userInfoStyle}> <p style={userNameStyle}>{getDisplayName(user?.name, user?.email)}</p> <p style={userEmailStyle}>{user?.email || 'No email provided'}</p> </div> </div> ); };
  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 40, display: isOpen ? 'block' : 'none' };
  const sidebarStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, bottom: 0, width: '256px', backgroundColor: 'white', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease-in-out', zIndex: 50, display: 'flex', flexDirection: 'column' };
  const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', padding: '0 24px', borderBottom: '1px solid #e5e5e5' };
  const logoStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' };
  const closeButtonStyle: React.CSSProperties = { padding: '8px', border: 'none', backgroundColor: 'transparent', borderRadius: '4px', cursor: 'pointer', color: '#666', display: 'block' };
  const navStyle: React.CSSProperties = { marginTop: '24px', padding: '0 12px', flex: 1, overflowY: 'auto' };
  const menuItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', width: '100%', padding: '12px', marginBottom: '4px', fontSize: '14px', fontWeight: '500', border: 'none', backgroundColor: 'transparent', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease' };
  const getMenuItemStyle = (itemId: string): React.CSSProperties => ({...menuItemStyle, backgroundColor: activeItem.startsWith(itemId) ? '#eff6ff' : 'transparent', color: activeItem.startsWith(itemId) ? '#1d4ed8' : '#666' });
  const menuIconStyle: React.CSSProperties = { marginRight: '12px', flexShrink: 0 };
  const bottomSectionStyle: React.CSSProperties = { padding: '16px', borderTop: '1px solid #e5e5e5' };
  const userProfileStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' };
  const userAvatarStyle: React.CSSProperties = { width: '40px', height: '40px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: '500' };
  const userInfoStyle: React.CSSProperties = { flex: 1, minWidth: 0 };
  const userNameStyle: React.CSSProperties = { fontSize: '14px', fontWeight: '500', color: '#333', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  const userEmailStyle: React.CSSProperties = { fontSize: '12px', color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  const mediaQueries = `@media (min-width: 1024px) { .sidebar-overlay { display: none !important; } .sidebar { position: static !important; transform: translateX(0) !important; height: 100vh; } .close-button { display: none !important; } }`;
  const dropdownChevronStyle: React.CSSProperties = { marginLeft: 'auto', transition: 'transform 0.2s' };
  const subMenuContainerStyle: React.CSSProperties = { paddingLeft: '28px', overflow: 'hidden', transition: 'max-height 0.3s ease-in-out' };
  const getSubMenuItemStyle = (subItemId: string): React.CSSProperties => ({ ...menuItemStyle, padding: '8px 12px', fontSize: '13px', backgroundColor: activeItem === subItemId ? '#e0e7ff' : 'transparent', color: activeItem === subItemId ? '#1e40af' : '#666' });

  return ( <> <style>{mediaQueries}</style> <div className="sidebar-overlay" style={overlayStyle} onClick={onClose}/> <div className="sidebar" style={sidebarStyle}> <div style={headerStyle}> <div style={logoStyle}><Image src={logoImage} alt="Mediant Logo" width={180} height={30} style={{ objectFit: 'contain' }}/></div> <button className="close-button" onClick={onClose} style={closeButtonStyle} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}> <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> </button> </div> <nav style={navStyle}> <div> {menuItems.map((item) => ( <div key={item.id}> <button onClick={() => item.subItems ? handleDropdownToggle(item.id) : handleItemClick(item.id)} style={getMenuItemStyle(item.id)} onMouseEnter={(e) => { if (!activeItem.startsWith(item.id)) e.currentTarget.style.backgroundColor = '#f9fafb'; }} onMouseLeave={(e) => { if (!activeItem.startsWith(item.id)) e.currentTarget.style.backgroundColor = 'transparent'; }}> <span style={menuIconStyle}>{item.icon}</span> <span style={{flexGrow: 1}}>{item.name}</span> {item.subItems && ( <span style={{...dropdownChevronStyle, transform: openDropdown === item.id ? 'rotate(180deg)' : 'rotate(0deg)'}}> <ChevronDown size={16} /> </span> )} </button> {item.subItems && ( <div style={{ ...subMenuContainerStyle, maxHeight: openDropdown === item.id ? `${item.subItems.length * 50}px` : '0px' }}> {item.subItems.map((subItem) => ( <button key={subItem.id} onClick={() => handleItemClick(subItem.id)} style={getSubMenuItemStyle(subItem.id)} onMouseEnter={(e) => { if (activeItem !== subItem.id) e.currentTarget.style.backgroundColor = '#f3f4f6'; }} onMouseLeave={(e) => { if (activeItem !== subItem.id) e.currentTarget.style.backgroundColor = 'transparent'; }} > {subItem.name} </button> ))} </div> )} </div> ))} </div> </nav> <div style={bottomSectionStyle}>{renderUserProfile()}</div> </div> </> );
}