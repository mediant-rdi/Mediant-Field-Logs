// utils/auth.ts (Client-side only - no Node.js dependencies)
'use client';

export interface AuthUser {
  userid: string;
  email: string;
  role: string;
}

export interface DecodedToken extends AuthUser {
  iat: number;
  exp: number;
}

// Online/Offline detection
export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

// Simple JWT decode (client-side only - for reading token data, not verification)
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
};

// Check if token is expired with grace period for offline mode
const isTokenExpired = (decoded: DecodedToken, gracePeriodHours: number = 24): boolean => {
  const now = Date.now();
  const tokenExpiry = decoded.exp * 1000;
  const gracePeriod = gracePeriodHours * 60 * 60 * 1000; // Convert hours to milliseconds
  
  // If online, use normal expiry
  if (isOnline()) {
    return tokenExpiry < now;
  }
  
  // If offline, allow grace period
  return tokenExpiry + gracePeriod < now;
};

// Get user from token (client-side)
export const getUserFromToken = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  const decoded = decodeToken(token);
  if (!decoded) {
    // Token is invalid, remove it
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastAuthCheck');
    return null;
  }
  
  // Check if token is expired (with offline grace period)
  if (isTokenExpired(decoded)) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastAuthCheck');
    return null;
  }
  
  // Store last successful auth check
  localStorage.setItem('lastAuthCheck', Date.now().toString());
  
  return {
    userid: decoded.userid,
    email: decoded.email,
    role: decoded.role,
  };
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getUserFromToken() !== null;
};

// Get auth token
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

// Logout function
export const logout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastAuthCheck');
    // Use window.location for navigation since we're in client component
    window.location.href = '/login';
  }
};

// Login function (stores token and user data)
export const login = (token: string, user: AuthUser) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('lastAuthCheck', Date.now().toString());
  }
};

// Verify token with server when online
export const verifyTokenWithServer = async (): Promise<boolean> => {
  if (!isOnline()) return true; // Skip verification when offline
  
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    const response = await fetch('/api/verify-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.ok) {
      localStorage.setItem('lastAuthCheck', Date.now().toString());
      return true;
    } else {
      logout();
      return false;
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    // Don't logout on network error, just return current token validity
    return !isTokenExpired(decodeToken(token) || {} as DecodedToken);
  }
};

// HOC for protecting routes (Updated for App Router)
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export const withAuth = <P extends {}>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles?: string[]
) => {
  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isOffline, setIsOffline] = useState(!isOnline());

    useEffect(() => {
      const checkAuth = async () => {
        const currentUser = getUserFromToken();
        
        if (!currentUser) {
          router.push('/login');
          return;
        }

        // Check role-based access
        if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
          router.push('/unauthorized');
          return;
        }

        // Verify token with server if online
        if (isOnline()) {
          const isValid = await verifyTokenWithServer();
          if (!isValid) {
            router.push('/login');
            return;
          }
        }

        setUser(currentUser);
        setIsLoading(false);
      };

      const handleOnlineStatus = () => {
        setIsOffline(!navigator.onLine);
        if (navigator.onLine) {
          // Re-verify token when coming back online
          verifyTokenWithServer();
        }
      };

      window.addEventListener('online', handleOnlineStatus);
      window.addEventListener('offline', handleOnlineStatus);

      checkAuth();

      return () => {
        window.removeEventListener('online', handleOnlineStatus);
        window.removeEventListener('offline', handleOnlineStatus);
      };
    }, [router]);

    if (isLoading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontFamily: 'system-ui, sans-serif',
          flexDirection: 'column'
        }}>
          <div>Loading...</div>
          {isOffline && (
            <div style={{ 
              marginTop: '10px', 
              fontSize: '14px', 
              color: '#666',
              textAlign: 'center'
            }}>
              📱 Offline mode - Using cached credentials
            </div>
          )}
        </div>
      );
    }

    if (!user) {
      return null; // Will redirect to login
    }

    return <WrappedComponent {...props} />;
  };
};

// React hook for auth state
export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!isOnline());

  useEffect(() => {
    const currentUser = getUserFromToken();
    setUser(currentUser);
    setIsLoading(false);

    const handleOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
      if (navigator.onLine) {
        // Re-verify token when coming back online
        verifyTokenWithServer().then((isValid) => {
          if (!isValid) {
            setUser(null);
          }
        });
      }
    };

    // Listen for storage changes (logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' && !e.newValue) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  return { 
    user, 
    isLoading, 
    isAuthenticated: !!user, 
    isOffline,
    logout,
    refreshUser: () => {
      const currentUser = getUserFromToken();
      setUser(currentUser);
    }
  };
};

// Enhanced fetch wrapper with auth and offline handling
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, logout user
    if (response.status === 401) {
      logout();
      throw new Error('Authentication failed');
    }

    return response;
  } catch (error) {
    // Check if it's a network error and we're offline
    if (!isOnline() && error instanceof TypeError) {
      throw new Error('You are offline. Please check your internet connection.');
    }
    throw error;
  }
};

// Utility to get offline status info
export const getOfflineInfo = () => {
  const lastAuthCheck = localStorage.getItem('lastAuthCheck');
  const isCurrentlyOffline = !isOnline();
  
  return {
    isOffline: isCurrentlyOffline,
    lastAuthCheck: lastAuthCheck ? new Date(parseInt(lastAuthCheck)) : null,
    usingCachedCredentials: isCurrentlyOffline && !!getAuthToken(),
  };
};