import { createContext, useContext, useEffect, useState } from 'react';
import { useUser as useClerkUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { User } from '../lib/cloudflare';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();
  const { getToken } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserToBackend = async (clerkUserId: string, email: string) => {
    try {
      const token = await getToken();
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ clerk_user_id: clerkUserId, email }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync user');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error syncing user:', error);
      return null;
    }
  };

  const refreshUser = async () => {
    if (!clerkUser) {
      setUser(null);
      return;
    }

    const syncedUser = await syncUserToBackend(clerkUser.id, clerkUser.emailAddresses[0]?.emailAddress || '');
    
    if (syncedUser) {
      setUser({
        id: syncedUser.id.toString(),
        email: syncedUser.email,
        username: syncedUser.username,
        clerk_user_id: syncedUser.clerk_user_id,
        created_at: syncedUser.created_at,
        updated_at: syncedUser.updated_at,
        is_active: syncedUser.is_active,
        username_confirmed_by_user: syncedUser.username_confirmed_by_user,
      });
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (!clerkLoaded) {
        return;
      }

      if (clerkUser) {
        const syncedUser = await syncUserToBackend(clerkUser.id, clerkUser.emailAddresses[0]?.emailAddress || '');
        
        if (syncedUser) {
          setUser({
            id: syncedUser.id.toString(),
            email: syncedUser.email,
            username: syncedUser.username,
            clerk_user_id: syncedUser.clerk_user_id,
            created_at: syncedUser.created_at,
            updated_at: syncedUser.updated_at,
            is_active: syncedUser.is_active,
            username_confirmed_by_user: syncedUser.username_confirmed_by_user,
          });
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    initAuth();
  }, [clerkUser, clerkLoaded]);

  const signOut = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
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
