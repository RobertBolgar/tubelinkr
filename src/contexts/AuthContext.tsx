import { createContext, useContext, useEffect, useState } from 'react';
import { db, User } from '../lib/cloudflare';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<{ error: Error | null; magicLink?: string }>;
  verifyMagicLink: (token: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple JWT-based auth using Cloudflare Workers
  const fetchUser = async (userId: string) => {
    try {
      // In a real implementation, this would call a Cloudflare Worker endpoint
      // For now, we'll use localStorage for demo purposes
      const userData = localStorage.getItem('user');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const userData = await fetchUser(token);
      setUser(userData);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const userData = await fetchUser(token);
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      // In a real implementation, this would call a Cloudflare Worker endpoint
      // For demo purposes, we'll simulate user creation
      const mockUser: User = {
        id: 'mock-user-id',
        email,
        username: email.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('auth_token', 'mock-token');
      setUser(mockUser);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // In a real implementation, this would call a Cloudflare Worker endpoint
      // For demo purposes, we'll simulate login
      const mockUser: User = {
        id: 'mock-user-id',
        email,
        username: email.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('auth_token', 'mock-token');
      setUser(mockUser);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      const response = await db.sendMagicLink(email);
      if (response.error) {
        return { error: new Error(response.error) };
      }
      return { error: null, magicLink: response.magicLink };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const verifyMagicLink = async (token: string) => {
    try {
      const response = await db.verifyMagicLink(token);
      if (response.error) {
        return { error: new Error(response.error) };
      }
      
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('auth_token', response.token);
      setUser(response.user);
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, refreshUser, sendMagicLink, verifyMagicLink }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
