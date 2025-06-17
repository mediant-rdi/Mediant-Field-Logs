// pages/offline.tsx or app/offline/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getOfflineInfo } from '@/lib/auth';

export default function OfflinePage() {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const router = useRouter();
  const offlineInfo = getOfflineInfo();

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    // Wait a moment then check if we're back online
    setTimeout(() => {
      if (navigator.onLine) {
        // If authenticated, go to dashboard, otherwise login
        if (isAuthenticated()) {
          router.push('/dashboard');
        } else {
          router.push('/login');
        }
      } else {
        setIsRetrying(false);
      }
    }, 1000);
  };

  const handleGoOffline = () => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      // Automatically redirect when back online
      if (isAuthenticated()) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f5f5f5',
      padding: '20px',
      textAlign: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>
          📱
        </div>
        
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '16px'
        }}>
          You're Offline
        </h1>
        
        <p style={{
          color: '#666',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          It looks like you've lost your internet connection. Don't worry - you can still access some features using cached data.
        </p>

        {/* Show cached credentials info */}
        {offlineInfo.usingCachedCredentials && (
          <div style={{
            backgroundColor: '#e7f3ff',
            border: '1px solid #b3d4fc',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#004085' }}>
              📋 Cached Session Available
            </h3>
            <p style={{ fontSize: '14px', color: '#004085', margin: '4px 0' }}>
              You can continue using the app with limited functionality.
            </p>
            {offlineInfo.lastAuthCheck && (
              <p style={{ fontSize: '12px', color: '#6c757d', margin: '4px 0' }}>
                Last verified: {offlineInfo.lastAuthCheck.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Retry section */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            style={{
              padding: '12px 24px',
              backgroundColor: isRetrying ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: isRetrying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isRetrying ? (
              <>
                <span>🔄</span>
                Checking Connection...
              </>
            ) : (
              <>
                <span>🔄</span>
                Try Again ({retryCount > 0 ? `Attempt ${retryCount + 1}` : 'Retry'})
              </>
            )}
          </button>

          {offlineInfo.usingCachedCredentials && (
            <button
              onClick={handleGoOffline}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>📱</span>
              Continue Offline
            </button>
          )}
        </div>

        {/* Tips section */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '4px',
          textAlign: 'left'
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '8px'
          }}>
            💡 Tips while offline:
          </h4>
          <ul style={{
            fontSize: '14px',
            color: '#666',
            margin: 0,
            paddingLeft: '20px'
          }}>
            <li>Check your Wi-Fi or mobile data connection</li>
            <li>Some features may be limited without internet</li>
            <li>Your work will sync when you reconnect</li>
            <li>Try moving to an area with better signal</li>
          </ul>
        </div>

        {/* Connection status */}
        <div style={{
          marginTop: '20px',
          padding: '8px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          Status: 🔴 No Internet Connection
        </div>
      </div>
    </div>
  );
}