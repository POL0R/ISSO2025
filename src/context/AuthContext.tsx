import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Role } from '../types';

interface AuthContextValue {
  userId: string | null;
  profile: Profile | null;
  role: Role;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      if (!mounted) return;
      setUserId(sessionUser?.id ?? null);
      if (sessionUser) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();
        if (!mounted) return;
        if (prof) setProfile(prof as unknown as Profile);
      }
      setLoading(false);
    };
    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (!session?.user?.id) {
        setProfile(null);
        return;
      }
      supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
        .then(({ data }) => setProfile((data as unknown as Profile) ?? null));
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    userId,
    profile,
    // Treat ANY signed-in user as admin per requirements
    role: (userId ? 'admin' : 'viewer') as Role,
    loading
  }), [userId, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};


