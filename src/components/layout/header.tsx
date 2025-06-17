// header.tsx
'use client';

import { useState } from 'react';
import { useConvexAuth, useQuery } from 'convex/react';
import { useAuthActions } from '@convex-dev/auth/react';
import { api } from '../../../convex/_generated/api'; // Adjust this path if needed

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Convex hooks for authentication and data fetching
  const { isLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const { signOut } = useAuthActions();

  const handleLogout = async () => {
    await signOut();
  };

  // Helper functions to display user info
  const getUserInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return '';
  };

  const getDisplayName = (name?: string | null, email?: string | null) => {
    return name || email?.split('@')[0] || '';
  };

  // --- Style definitions (unchanged) ---
  const headerStyle: React.CSSProperties = {
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    borderBottom: '1px solid #e5e5e5'
  };
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px'
  };
  const leftSideStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  };
  const menuButtonStyle: React.CSSProperties = {
    padding: '8px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#666',
    cursor: 'pointer',
    display: 'none'
  };
  const mobileMenuButtonStyle: React.CSSProperties = {
    ...menuButtonStyle,
    display: 'block'
  };
  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
    margin: 0
  };
  const rightSideStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  };
  const searchContainerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'none'
  };
  const desktopSearchStyle: React.CSSProperties = {
    ...searchContainerStyle,
    display: 'block'
  };
  const searchInputStyle: React.CSSProperties = {
    width: '300px',
    padding: '8px 12px 8px 40px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  };
  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#666',
    pointerEvents: 'none'
  };
  const iconButtonStyle: React.CSSProperties = {
    padding: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '50%',
    cursor: 'pointer',
    color: '#666'
  };
  const userMenuStyle: React.CSSProperties = {
    position: 'relative'
  };
  const userButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#333'
  };
  const avatarStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    backgroundColor: '#3b82f6',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500'
  };
  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    top: '100%',
    marginTop: '8px',
    width: '192px',
    backgroundColor: 'white',
    borderRadius: '6px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    border: '1px solid #e5e5e5',
    zIndex: 50,
    display: dropdownOpen ? 'block' : 'none'
  };
  const dropdownItemStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '8px 16px',
    fontSize: '14px',
    color: '#333',
    textDecoration: 'none',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer'
  };
  const mediaQueries = `
    @media (max-width: 1024px) {
      .menu-button { display: block !important; }
      .desktop-search { display: none !important; }
      .user-name { display: none !important; }
    }
  `;

  const renderUserMenu = () => {
    // Show a skeleton loader while auth or user data is loading
    if (isLoading || (isAuthenticated && user === undefined)) {
      return (
        <div style={userButtonStyle}>
          <div style={{...avatarStyle, backgroundColor: '#e5e5e5'}}></div>
          <div className="user-name" style={{
            height: '14px',
            width: '80px',
            backgroundColor: '#e5e5e5',
            borderRadius: '4px'
          }}></div>
        </div>
      );
    }
    
    // If not authenticated or no user found, render nothing
    if (!user) {
      return null;
    }

    // Render the full user menu when data is available
    return (
      <div style={userMenuStyle}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={userButtonStyle}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={avatarStyle}>{getUserInitials(user.name, user.email)}</div>
          <span className="user-name" style={{ fontSize: '14px', fontWeight: '500' }}>
            {getDisplayName(user.name, user.email)}
          </span>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        <div style={dropdownStyle}>
          <a
            href="#"
            style={dropdownItemStyle}
            onClick={(e) => { e.preventDefault(); setDropdownOpen(false); }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Your Profile
          </a>
          <a
            href="#"
            style={dropdownItemStyle}
            onClick={(e) => { e.preventDefault(); setDropdownOpen(false); }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Settings
          </a>
          <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0' }}></div>
          <button
            onClick={() => {
              setDropdownOpen(false);
              handleLogout();
            }}
            style={dropdownItemStyle}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Sign out
          </button>
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
            <button
              className="menu-button"
              onClick={onMenuClick}
              style={mobileMenuButtonStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 style={titleStyle}>Dashboard</h1>
          </div>

          {/* Right side */}
          <div style={rightSideStyle}>
            {/* Search bar */}
            <div className="desktop-search" style={desktopSearchStyle}>
              <div style={searchIconStyle}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search..."
                style={searchInputStyle}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Notifications */}
            <button
              style={iconButtonStyle}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {/* A generic notification icon */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* User menu */}
            {renderUserMenu()}

          </div>
        </div>
      </header>
    </>
  );
}