// components/layout/header.tsx
'use client';

import { useState } from 'react';
import { useConvexAuth, useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../../convex/_generated/api';

interface HeaderProps {
  onMenuClick: () => void;
  pageTitle: string;
}

export default function Header({ onMenuClick, pageTitle }: HeaderProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const { signOut } = useAuthActions();

  // Fetch the pending count for the notification badge
  const pendingCount = useQuery(api.dashboard.getPendingSubmissionsCount) ?? 0;
  
  const handleLogout = async () => { await signOut(); };
  const getUserInitials = (name?: string | null, email?: string | null) => { if (name) { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); } if (email) { return email.slice(0, 2).toUpperCase(); } return ''; };
  const getDisplayName = (name?: string | null, email?: string | null) => { return name || email?.split('@')[0] || ''; };

  // --- Style definitions ---
  const headerStyle: React.CSSProperties = { backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', borderBottom: '1px solid #e5e5e5' };
  const containerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' };
  const leftSideStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '16px' };
  const menuButtonStyle: React.CSSProperties = { padding: '8px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', color: '#666', cursor: 'pointer', display: 'none' };
  const titleStyle: React.CSSProperties = { fontSize: '20px', fontWeight: '600', color: '#333', margin: 0 };
  const rightSideStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '16px' };
  const searchContainerStyle: React.CSSProperties = { position: 'relative', display: 'none' };
  const desktopSearchStyle: React.CSSProperties = { ...searchContainerStyle, display: 'block' };
  const searchInputStyle: React.CSSProperties = { width: '300px', padding: '8px 12px 8px 40px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none' };
  const searchIconStyle: React.CSSProperties = { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666', pointerEvents: 'none' };
  const iconButtonStyle: React.CSSProperties = { position: 'relative', padding: '8px', border: 'none', backgroundColor: 'transparent', borderRadius: '50%', cursor: 'pointer', color: '#666' };
  const userMenuStyle: React.CSSProperties = { position: 'relative' };
  const userButtonStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: 'none', backgroundColor: 'transparent', borderRadius: '6px', cursor: 'pointer', color: '#333' };
  const avatarStyle: React.CSSProperties = { width: '32px', height: '32px', backgroundColor: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: '500' };
  const userDropdownStyle: React.CSSProperties = { position: 'absolute', right: 0, top: '100%', marginTop: '8px', width: '192px', backgroundColor: 'white', borderRadius: '6px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', border: '1px solid #e5e5e5', zIndex: 50, display: userDropdownOpen ? 'block' : 'none' };
  const dropdownItemStyle: React.CSSProperties = { display: 'block', width: '100%', padding: '8px 16px', fontSize: '14px', color: '#333', textDecoration: 'none', border: 'none', backgroundColor: 'transparent', textAlign: 'left', cursor: 'pointer' };
  const notificationBadgeStyle: React.CSSProperties = { position: 'absolute', top: '4px', right: '4px', minWidth: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#dc2626', color: 'white', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid white', pointerEvents: 'none' };
  const notificationDropdownStyle: React.CSSProperties = { position: 'absolute', right: 0, top: '100%', marginTop: '8px', width: '280px', backgroundColor: 'white', borderRadius: '6px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)', border: '1px solid #e5e5e5', zIndex: 50, display: notificationsOpen ? 'block' : 'none', padding: '16px' };
  const mediaQueries = `@media (max-width: 1024px) { .menu-button { display: block !important; } .desktop-search { display: none !important; } .user-name { display: none !important; } }`;

  const renderUserMenu = () => {
    if (isLoading) return null;
    if (!isAuthenticated || !user) return null;

    return (
      <div style={userMenuStyle}>
        <button
          style={userButtonStyle}
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <span style={avatarStyle}>
            {getUserInitials(user.name, user.email)}
          </span>
          <span className="user-name">{getDisplayName(user.name, user.email)}</span>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div style={userDropdownStyle}>
          <button style={dropdownItemStyle} onClick={handleLogout}>Sign out</button>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{mediaQueries}</style>
      <header style={headerStyle}>
        <div style={containerStyle}>
          {/* Left side */}
          <div style={leftSideStyle}>
            <button className="menu-button" onClick={onMenuClick} style={menuButtonStyle} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 style={titleStyle}>{pageTitle}</h1>
          </div>

          {/* Right side */}
          <div style={rightSideStyle}>
            {/* Search bar */}
            <div className="desktop-search" style={desktopSearchStyle}>{/* ... */}</div>

            {/* UPDATED: Notifications button with badge and dropdown */}
            <div style={{ position: 'relative' }}>
              <button style={iconButtonStyle} onClick={() => setNotificationsOpen(!notificationsOpen)} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {pendingCount > 0 && <div style={notificationBadgeStyle}>{pendingCount}</div>}
              </button>
              <div style={notificationDropdownStyle}>
                <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>{pendingCount > 0 ? `You have ${pendingCount} submission${pendingCount > 1 ? 's' : ''} pending approval.` : 'No new notifications.'}</p>
                {pendingCount > 0 && <a href="/dashboard" style={{ display: 'block', marginTop: '12px', fontWeight: 500, color: '#2563eb', textDecoration: 'none' }}>Go to Dashboard</a>}
              </div>
            </div>

            {/* User menu */}
            {renderUserMenu()}
          </div>
        </div>
      </header>
    </>
  );
}