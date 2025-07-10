// components/layout/header.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useConvexAuth, useQuery, useMutation } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../../convex/_generated/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onMenuClick: () => void;
  pageTitle: string;
}

export default function Header({ onMenuClick, pageTitle }: HeaderProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null); // NEW: Add a ref for the user dropdown

  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const { signOut } = useAuthActions();
  const isAdmin = user?.isAdmin;
  const router = useRouter(); 
  
  const statsData = useQuery(api.dashboard.getDashboardStats, isAdmin ? {} : "skip");
  const adminPendingCount = statsData?.pendingCount ?? 0;
  
  const userNotifications = useQuery(api.notifications.getUnreadNotifications, !isAdmin && isAuthenticated ? {} : "skip") ?? [];
  const userUnreadCount = userNotifications.length;
  
  const notificationCount = isAdmin ? adminPendingCount : userUnreadCount;
  
  const markAsRead = useMutation(api.notifications.markAllAsRead);

  useEffect(() => {
    return () => {
      if (notificationsOpen && !isAdmin && userUnreadCount > 0) {
        markAsRead();
      }
    };
  }, [notificationsOpen, isAdmin, userUnreadCount, markAsRead]);

  // Click-outside handler for the notifications dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    if (notificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationsOpen]);

  // NEW: Add a click-outside handler for the user dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // If the ref is set and the click was outside the user dropdown element...
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        // ...close the dropdown.
        setUserDropdownOpen(false);
      }
    }
    // Add the event listener only when the dropdown is open
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    // Cleanup function to remove the listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userDropdownOpen]); // This effect depends on the dropdown's open state

  const handleLogout = () => {
    signOut();
    router.push('/'); 
  };
  
  const getUserInitials = (name?: string | null, email?: string | null) => { if (name) { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); } if (email) { return email.slice(0, 2).toUpperCase(); } return ''; };
  const getDisplayName = (name?: string | null, email?: string | null) => { return name || email?.split('@')[0] || ''; };

  const headerStyle: React.CSSProperties = { backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', borderBottom: '1px solid #e5e5e5' };
  const containerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
  const leftSideStyle: React.CSSProperties = { display: 'flex', alignItems: 'center' };
  const menuButtonStyle: React.CSSProperties = { padding: '8px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', color: '#666', cursor: 'pointer', display: 'none' };
  const titleStyle: React.CSSProperties = { fontWeight: '600', color: '#333', margin: 0 };
  const rightSideStyle: React.CSSProperties = { display: 'flex', alignItems: 'center' };
  const iconButtonStyle: React.CSSProperties = { position: 'relative', padding: '8px', border: 'none', backgroundColor: 'transparent', borderRadius: '50%', cursor: 'pointer', color: '#666' };
  const userMenuStyle: React.CSSProperties = { position: 'relative' };
  const userButtonStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: 'none', backgroundColor: 'transparent', borderRadius: '6px', cursor: 'pointer', color: '#333' };
  const avatarStyle: React.CSSProperties = { width: '32px', height: '32px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: '500' };
  const userDropdownStyle: React.CSSProperties = { position: 'absolute', right: 0, top: '100%', marginTop: '8px', width: '192px', backgroundColor: 'white', borderRadius: '6px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', border: '1px solid #e5e5e5', zIndex: 50, display: userDropdownOpen ? 'block' : 'none' };
  const dropdownItemStyle: React.CSSProperties = { display: 'block', width: '100%', padding: '8px 16px', fontSize: '14px', color: '#333', textDecoration: 'none', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer' };
  const notificationBadgeStyle: React.CSSProperties = { position: 'absolute', top: '4px', right: '4px', minWidth: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#dc2626', color: 'white', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid white', pointerEvents: 'none' };
  const notificationCloseButtonStyle: React.CSSProperties = { background: 'transparent', border: 'none', color: '#6b7280', fontSize: '24px', lineHeight: 1, padding: '0', cursor: 'pointer' };

  const mediaQueries = `
    .header-container { padding: 16px 24px; } .header-left-side { gap: 16px; } .header-title { font-size: 20px; } .header-right-side { gap: 16px; } .notification-dropdown { position: absolute; right: 0; top: 100%; margin-top: 8px; width: 320px; max-height: 400px; overflow-y: auto; background-color: white; border-radius: 6px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); border: 1px solid #e5e5e5; z-index: 50; display: ${notificationsOpen ? 'block' : 'none'}; } .notification-item-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } @media (max-width: 1024px) { .menu-button { display: block !important; } .desktop-search { display: none !important; } .user-name { display: none !important; } } 
    
    @media (max-width: 640px) { 
      .header-container { padding: 12px 16px; } 
      .header-left-side { gap: 8px; } 
      .header-title { font-size: 18px; } 
      .header-right-side { gap: 8px; } 
      
      .notification-dropdown { 
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 90vw;
        max-width: 400px;
        right: auto;
        margin-top: 0;
      } 
      
      .notification-item-text { white-space: normal; word-break: break-word; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; } 
    }
  `;

  // CHANGED: Attached the new ref to the user menu's container div
  const renderUserMenu = () => { return ( <div style={userMenuStyle} ref={userDropdownRef}> <button style={userButtonStyle} onClick={() => setUserDropdownOpen(!userDropdownOpen)} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')} > <span style={avatarStyle}> {getUserInitials(user?.name, user?.email)} </span> <span className="user-name">{getDisplayName(user?.name, user?.email)}</span> <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /> </svg> </button> <div style={userDropdownStyle}> <button style={dropdownItemStyle} onClick={handleLogout}>Sign out</button> </div> </div> ); };

  return (
    <>
      <style>{mediaQueries}</style>
      <header style={headerStyle}>
        <div className="header-container" style={containerStyle}>
          <div className="header-left-side" style={leftSideStyle}>
             <button className="menu-button" onClick={onMenuClick} style={menuButtonStyle} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="header-title" style={titleStyle}>{pageTitle}</h1>
          </div>

          <div className="header-right-side" style={rightSideStyle}>
            <div style={{ position: 'relative' }} ref={notificationsRef}>
              <button style={iconButtonStyle} onClick={() => setNotificationsOpen(!notificationsOpen)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {notificationCount > 0 && <div style={notificationBadgeStyle}>{notificationCount}</div>}
              </button>
              
              <div className="notification-dropdown">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Notifications</h4>
                  <button style={notificationCloseButtonStyle} onClick={() => setNotificationsOpen(false)} aria-label="Close notifications">
                    ×
                  </button>
                </div>

                {isAdmin ? (
                  <div style={{ padding: '16px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>{adminPendingCount > 0 ? `You have ${adminPendingCount} submission${adminPendingCount > 1 ? 's' : ''} pending approval.` : 'No new notifications.'}</p>
                    {adminPendingCount > 0 && <Link href="/dashboard" onClick={() => setNotificationsOpen(false)} style={{ display: 'block', marginTop: '12px', fontWeight: 500, color: '#2563eb', textDecoration: 'none' }}>Go to Dashboard</Link>}
                  </div>
                ) : (
                  userNotifications.length > 0 ? (
                    userNotifications.map(notif => (
                      <Link href="/dashboard" key={notif._id} onClick={() => setNotificationsOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', borderBottom: '1px solid #f3f4f6' }}>
                          <p style={{ margin: 0, color: '#1f2937', fontWeight: 500, fontSize: '14px' }}>
                              Your {notif.type} was approved!
                          </p>
                          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '12px' }} className="notification-item-text">
                              “{notif.text}”
                          </p>
                      </Link>
                    ))
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                      You are all caught up!
                    </div>
                  )
                )}
              </div>
            </div>

            {renderUserMenu()}
          </div>
        </div>
      </header>
    </>
  );
}