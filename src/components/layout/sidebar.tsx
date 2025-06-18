// src/components/layout/sidebar.tsx
'use client';

import { useState } from "react";
import Image from "next/image";
// 1. Re-add the necessary Convex imports
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import logoImage from "../../images/logo.jpg"; 

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onItemClick: (itemId: string) => void;
  activeItem: string;
  // 2. Remove user and isLoading from the props, as the sidebar will fetch its own
}

export default function Sidebar({ isOpen, onClose, onItemClick, activeItem }: SidebarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // 3. Re-add the data fetching hooks directly inside the sidebar
  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");

  // The rest of the file is correct and doesn't need changes...
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: ( <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" /></svg> ) },
    { 
      id: 'feedback', 
      name: 'Customer Feedback & Recommendation', 
      icon: ( <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg> ),
      subItems: [
        { id: 'feedback-delay', name: 'Service Delay' },
        { id: 'feedback-fault', name: 'Equipment Fault' },
        { id: 'feedback-experience', name: 'Poor Experience' },
        { id: 'feedback-other', name: 'Other' }
      ]
    },
    { id: 'complaint', name: 'Complaint Logging', icon: ( <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> ) },
    { 
      id: 'admin', 
      name: 'Admin Panel', 
      icon: ( <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> ),
      subItems: [
        { id: 'admin-view-users', name: 'View Users' },
        { id: 'admin-add-user', name: 'Add User' },
        { id: 'admin-view-machines', name: 'View Machines' },
        { id: 'admin-add-machine', name: 'Add Machine' },
        { id: 'admin-add-report', name: 'Add Report' }
      ]
    },
    { id: 'settings', name: 'Settings', icon: ( <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> ) }
  ];

  const handleItemClick = (itemId: string) => {
    onItemClick(itemId);
    onClose();
  };

  const handleDropdownToggle = (itemId: string) => {
    setOpenDropdown(prev => (prev === itemId ? null : itemId));
  };
  
  const getUserInitials = (name?: string | null, email?: string | null) => { if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); if (email) return email.slice(0, 2).toUpperCase(); return 'U'; };
  const getDisplayName = (name?: string | null, email?: string | null) => name || email?.split('@')[0] || 'User';

  const renderUserProfile = () => {
    // This function now uses the `isLoading` and `user` variables defined inside this component
    if (isLoading) { return ( <div style={userProfileStyle}> <div style={{ ...userAvatarStyle, backgroundColor: '#e5e5e5' }}> <div style={{ width: '20px', height: '20px', backgroundColor: '#ccc', borderRadius: '50%' }}></div> </div> <div style={userInfoStyle}> <div style={{ height: '14px', backgroundColor: '#e5e5e5', borderRadius: '4px', marginBottom: '4px' }}></div> <div style={{ height: '12px', backgroundColor: '#e5e5e5', borderRadius: '4px', width: '80%' }}></div> </div> </div> ); }
    if (!user) return null;
    return ( <div style={userProfileStyle}> <div style={userAvatarStyle}><span>{getUserInitials(user?.name, user?.email)}</span></div> <div style={userInfoStyle}> <p style={userNameStyle}>{getDisplayName(user?.name, user?.email)}</p> <p style={userEmailStyle}>{user?.email || 'No email provided'}</p> </div> </div> );
  };
  
  const overlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 40, display: isOpen ? 'block' : 'none' };
  const sidebarStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, bottom: 0, width: '256px', backgroundColor: 'white', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease-in-out', zIndex: 50 };
  const headerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', padding: '0 24px', borderBottom: '1px solid #e5e5e5' };
  const logoStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px' };
  const closeButtonStyle: React.CSSProperties = { padding: '8px', border: 'none', backgroundColor: 'transparent', borderRadius: '4px', cursor: 'pointer', color: '#666', display: 'block' };
  const navStyle: React.CSSProperties = { marginTop: '24px', padding: '0 12px' };
  const menuItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', width: '100%', padding: '12px', marginBottom: '4px', fontSize: '14px', fontWeight: '500', border: 'none', backgroundColor: 'transparent', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease' };
  const getMenuItemStyle = (itemId: string): React.CSSProperties => ({...menuItemStyle, backgroundColor: activeItem.startsWith(itemId) ? '#eff6ff' : 'transparent', color: activeItem.startsWith(itemId) ? '#1d4ed8' : '#666' });
  const menuIconStyle: React.CSSProperties = { marginRight: '12px', flexShrink: 0 };
  const bottomSectionStyle: React.CSSProperties = { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', borderTop: '1px solid #e5e5e5' };
  const userProfileStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' };
  const userAvatarStyle: React.CSSProperties = { width: '40px', height: '40px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: '500' };
  const userInfoStyle: React.CSSProperties = { flex: 1, minWidth: 0 };
  const userNameStyle: React.CSSProperties = { fontSize: '14px', fontWeight: '500', color: '#333', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  const userEmailStyle: React.CSSProperties = { fontSize: '12px', color: '#666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
  const mediaQueries = `@media (min-width: 1024px) { .sidebar-overlay { display: none !important; } .sidebar { position: static !important; transform: translateX(0) !important; height: 100vh; } .close-button { display: none !important; } }`;
  const dropdownChevronStyle: React.CSSProperties = { marginLeft: 'auto', transition: 'transform 0.2s' };
  const subMenuContainerStyle: React.CSSProperties = { paddingLeft: '28px', overflow: 'hidden', transition: 'max-height 0.3s ease-in-out' };
  const getSubMenuItemStyle = (subItemId: string): React.CSSProperties => ({ ...menuItemStyle, padding: '8px 12px', fontSize: '13px', backgroundColor: activeItem === subItemId ? '#e0e7ff' : 'transparent', color: activeItem === subItemId ? '#1e40af' : '#666' });

  return (
    <>
      <style>{mediaQueries}</style>
      <div className="sidebar-overlay" style={overlayStyle} onClick={onClose}/>
      <div className="sidebar" style={sidebarStyle}>
        <div style={headerStyle}>
          <div style={logoStyle}><Image src={logoImage} alt="Mediant Logo" width={180} height={30} style={{ objectFit: 'contain' }}/></div>
          <button className="close-button" onClick={onClose} style={closeButtonStyle} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav style={navStyle}>
          <div>
            {menuItems.map((item) => (
              <div key={item.id}>
                <button onClick={() => item.subItems ? handleDropdownToggle(item.id) : handleItemClick(item.id)} style={getMenuItemStyle(item.id)} onMouseEnter={(e) => { if (!activeItem.startsWith(item.id)) e.currentTarget.style.backgroundColor = '#f9fafb'; }} onMouseLeave={(e) => { if (!activeItem.startsWith(item.id)) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <span style={menuIconStyle}>{item.icon}</span>
                  <span style={{flexGrow: 1}}>{item.name}</span>
                  {item.subItems && ( <span style={{...dropdownChevronStyle, transform: openDropdown === item.id ? 'rotate(180deg)' : 'rotate(0deg)'}}> <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg> </span> )}
                </button>
                {item.subItems && (
                  <div style={{ ...subMenuContainerStyle, maxHeight: openDropdown === item.id ? `${item.subItems.length * 50}px` : '0px' }}>
                    {item.subItems.map((subItem) => (
                      <button key={subItem.id} onClick={() => handleItemClick(subItem.id)} style={getSubMenuItemStyle(subItem.id)} onMouseEnter={(e) => { if (activeItem !== subItem.id) e.currentTarget.style.backgroundColor = '#f3f4f6'; }} onMouseLeave={(e) => { if (activeItem !== subItem.id) e.currentTarget.style.backgroundColor = 'transparent'; }} >
                        {subItem.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>
        <div style={bottomSectionStyle}>{renderUserProfile()}</div>
      </div>
    </>
  );
}