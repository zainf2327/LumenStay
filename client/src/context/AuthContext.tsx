import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Property, User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  currentRole: UserRole;
  currentProperty: Property | null;
  properties: Property[];
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  setCurrentProperty: (property: Property) => void;
  setCurrentPropertyId: (propertyId: string) => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; message?: string }>;
  loginAsRole: (role: UserRole, propertyId?: string) => void;
  register: (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: UserRole;
    propertyId?: string | null;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentProperty, setCurrentProperty] = useState<Property | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('guest');
  const [accessToken, setAccessToken] = useState<string | null>(null); // In-memory 15m JWT
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Load properties on startup
  useEffect(() => {
    async function loadProperties() {
      try {
        const res = await fetch('/api/v1/properties').then(r => r.json());
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setProperties(res.data);
          const savedPropId = localStorage.getItem('lumenstay_property_id');
          const matched = res.data.find((p: Property) => p.id === savedPropId) || res.data[0];
          setCurrentProperty(matched);
        }
      } catch (err) {
        console.error('Failed to load initial properties:', err);
      }
    }
    loadProperties();
  }, []);

  // Silent session restore via 7-day httpOnly refresh cookie
  useEffect(() => {
    async function trySilentRefresh() {
      try {
        const res = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }).then(r => r.json());

        if (res.success && res.data?.accessToken) {
          setAccessToken(res.data.accessToken);
          setCurrentUser(res.data.user);
          setCurrentRole(res.data.user.role);
          if (res.data.user.propertyId && properties.length > 0) {
            const assigned = properties.find(p => p.id === res.data.user.propertyId);
            if (assigned) {
              setCurrentProperty(assigned);
              localStorage.setItem('lumenstay_property_id', assigned.id);
            }
          }
        }
      } catch {
        // No active session cookie
      }
    }
    trySilentRefresh();
  }, [properties]);

  // Enforce staff property lock whenever currentUser or properties change
  useEffect(() => {
    if (currentUser?.propertyId && properties.length > 0) {
      const assigned = properties.find((p) => p.id === currentUser.propertyId);
      if (assigned && currentProperty?.id !== assigned.id) {
        setCurrentProperty(assigned);
        localStorage.setItem('lumenstay_property_id', assigned.id);
      }
    }
  }, [currentUser, properties, currentProperty?.id]);

  const handleSetCurrentProperty = (property: Property) => {
    setCurrentProperty(property);
    localStorage.setItem('lumenstay_property_id', property.id);
  };

  const handleSetCurrentPropertyId = (propertyId: string) => {
    const matched = properties.find((p) => p.id === propertyId);
    if (matched) {
      handleSetCurrentProperty(matched);
    }
  };

  const loginAsRole = (role: UserRole, propertyId?: string) => {
    const roleNames: Record<UserRole, string> = {
      owner: 'Marcus Weil (Owner)',
      gm: 'Sarah Jenkins (General Manager)',
      front_desk: 'Alex Rivera (Front Desk Agent)',
      housekeeping_supervisor: 'Sofia Chen (HK Supervisor)',
      housekeeping: 'Maria Gomez (Housekeeping Lead)',
      maintenance: 'Dave Kowalski (Maintenance Lead)',
      revenue_manager: 'Rachel Adams (Revenue Director)',
      guest: 'Elena Rostova (Lumen Elite Guest)',
    };

    const targetPropId = propertyId || currentProperty?.id || 'prop_birchwood';
    const mockUser: User = {
      id: `user_${role}`,
      name: roleNames[role] || 'LumenStay User',
      email: `${role}@lumenstay.com`,
      role,
      propertyId: role === 'owner' || role === 'guest' ? null : targetPropId,
      preferredLanguage: role === 'housekeeping' ? 'es' : 'en',
      createdAt: new Date().toISOString(),
    };

    setCurrentUser(mockUser);
    setCurrentRole(role);
    if (targetPropId && properties.length > 0) {
      const assigned = properties.find((p) => p.id === targetPropId);
      if (assigned) {
        setCurrentProperty(assigned);
        localStorage.setItem('lumenstay_property_id', assigned.id);
      }
    }
    setIsLoginModalOpen(false);
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      }).then(r => r.json());

      if (res.success && res.data?.accessToken) {
        setAccessToken(res.data.accessToken);
        setCurrentUser(res.data.user);
        setCurrentRole(res.data.user.role);
        if (res.data.user.propertyId && properties.length > 0) {
          const assigned = properties.find(p => p.id === res.data.user.propertyId);
          if (assigned) setCurrentProperty(assigned);
        }
        setIsLoginModalOpen(false);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.message || 'Invalid email or password' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during login' };
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: UserRole;
    propertyId?: string | null;
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      }).then(r => r.json());

      if (res.success && res.data?.accessToken) {
        setAccessToken(res.data.accessToken);
        setCurrentUser(res.data.user);
        setCurrentRole(res.data.user.role);
        setIsLoginModalOpen(false);
        return { success: true };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during registration' };
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).then(r => r.json());

      if (res.success && res.data?.accessToken) {
        setAccessToken(res.data.accessToken);
        setCurrentUser(res.data.user);
        setCurrentRole(res.data.user.role);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setAccessToken(null);
    setCurrentUser(null);
    setCurrentRole('guest');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        currentProperty,
        properties,
        accessToken,
        isAuthenticated: Boolean(currentUser),
        isLoginModalOpen,
        setCurrentProperty: handleSetCurrentProperty,
        setCurrentPropertyId: handleSetCurrentPropertyId,
        openLoginModal: () => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        },
        closeLoginModal: () => setIsLoginModalOpen(false),
        login,
        loginAsRole,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
