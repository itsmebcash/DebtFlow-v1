import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, Database } from '@/lib/supabase';
import { storage } from '@/lib/storage';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => {
    const stored = localStorage.getItem('isGuest');
    if (stored === null) return true; // Default to guest for first time visitors
    return stored === 'true';
  });

  const fetchProfile = async (userId: string, email?: string) => {
    if (isGuest && userId === 'guest') {
      const localData = storage.getLocalData();
      const guestProfile = localData.profiles.find(p => p.id === 'guest');
      if (guestProfile) {
        setProfile(guestProfile as Profile);
      }
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data);
    } else if (email) {
      // Create profile automatically if it doesn't exist
      const { data: newProfile } = await supabase
        .from('profiles')
        .upsert({ id: userId, email })
        .select()
        .single();
      if (newProfile) setProfile(newProfile);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    } else if (isGuest) {
      await fetchProfile('guest');
    }
  };

  const continueAsGuest = () => {
    localStorage.setItem('isGuest', 'true');
    setIsGuest(true);
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (!mounted) return;

        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        // Mark loading as finished once we have the core auth state
        setLoading(false);

        if (currentUser) {
          setIsGuest(false);
          localStorage.setItem('isGuest', 'false');
          // Start background tasks without awaiting them to prevent blocking UI
          storage.syncGuestData(currentUser.id).catch(err => console.error('Sync error:', err));
          fetchProfile(currentUser.id, currentUser.email).catch(err => console.error('Fetch profile error:', err));
        } else if (localStorage.getItem('isGuest') !== 'false') {
          setIsGuest(true);
          fetchProfile('guest').catch(err => console.error('Fetch guest profile error:', err));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const currentUser = session?.user ?? null;
      setSession(session);
      setUser(currentUser);
      
      if (currentUser) {
        setIsGuest(false);
        localStorage.setItem('isGuest', 'false');
        
        if (event === 'SIGNED_IN') {
          storage.syncGuestData(currentUser.id).catch(err => console.error('Sync error:', err));
        }
        fetchProfile(currentUser.id, currentUser.email).catch(err => console.error('Fetch profile error:', err));
      } else {
        setProfile(null);
        if (localStorage.getItem('isGuest') !== 'false') {
          setIsGuest(true);
          fetchProfile('guest').catch(err => console.error('Fetch guest profile error:', err));
        } else {
          setIsGuest(false);
        }
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.setItem('isGuest', 'false');
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, isGuest, signOut, refreshProfile, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
