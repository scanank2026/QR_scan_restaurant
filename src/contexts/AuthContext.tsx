import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  restaurant: any | null;
  role: 'super_admin' | 'restaurant_owner' | 'staff' | null;
  loading: boolean;
  signOut: () => Promise<void>;
  impersonate: (restaurantId: string | null) => Promise<void>;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [restaurant, setRestaurant] = useState<any | null>(null);
  const [role, setRole] = useState<'super_admin' | 'restaurant_owner' | 'staff' | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      setProfile(profileData);
      setRole(profileData.role);

      // Check for impersonation
      const impersonatedId = localStorage.getItem('impersonated_restaurant_id');
      setIsImpersonating(!!impersonatedId);

      // Fetch restaurant
      let restaurantData = null;
      if (impersonatedId && profileData.role === 'super_admin') {
        const { data } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', impersonatedId)
          .single();
        restaurantData = data;
      } else if (profileData.restaurant_id) {
        const { data } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', profileData.restaurant_id)
          .single();
        restaurantData = data;
      } else if (profileData.role === 'restaurant_owner') {
        const { data } = await supabase
          .from('restaurants')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        restaurantData = data;
      }
      
      setRestaurant(restaurantData);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);
      setRestaurant(null);
      setRole(null);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && profile) {
      // If they have a restaurant, wait for it to load too
      if ((profile.restaurant_id || isImpersonating) && !restaurant) {
        return;
      }
      setLoading(false);
    } else if (!user) {
      setLoading(false);
    }
  }, [user, profile, restaurant, isImpersonating]);

  useEffect(() => {
    if (!restaurant?.id) return;

    // Real-time subscription
    const channel = supabase
      .channel(`restaurant-${restaurant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants',
          filter: `id=eq.${restaurant.id}`
        },
        (payload) => {
          setRestaurant(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant?.id]);

  const signOut = async () => {
    localStorage.removeItem('impersonated_restaurant_id');
    await supabase.auth.signOut();
    setProfile(null);
    setRestaurant(null);
    setRole(null);
  };

  const impersonate = async (restaurantId: string | null) => {
    if (role !== 'super_admin') {
      console.error('Unauthorized impersonation attempt');
      return;
    }
    setLoading(true);
    if (restaurantId) {
      localStorage.setItem('impersonated_restaurant_id', restaurantId);
    } else {
      localStorage.removeItem('impersonated_restaurant_id');
    }
    if (user) {
      await fetchProfile(user.id);
    }
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, restaurant, role, loading, signOut, impersonate, isImpersonating }}>
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
