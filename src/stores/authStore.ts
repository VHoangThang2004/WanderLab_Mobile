import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types/user';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  changePassword: (currentPwd: string, newPwd: string) => Promise<void>;
  updateProfile: (updates: {
    full_name?: string;
    bio?: string | null;
    location?: string | null;
    avatar_url?: string | null;
    cover_image_url?: string | null;
  }) => Promise<void>;
  subscribeToProfileUpdates: () => void;
  unsubscribeFromProfileUpdates: () => void;
}

let profileSubscription: any = null;

function buildUser(
  authUser: { id: string; email?: string | null; created_at: string; user_metadata?: Record<string, unknown> },
  profile?: Record<string, unknown> | null
): User {
  return {
    id: authUser.id,
    email: authUser.email || '',
    full_name: (profile?.full_name as string) || (authUser.user_metadata?.full_name as string) || '',
    avatar_url: (profile?.avatar_url as string) || null,
    cover_image_url: (profile?.cover_image_url as string) || null,
    bio: (profile?.bio as string) || null,
    location: (profile?.location as string) || null,
    role: (profile?.role as User['role']) || 'explorer',
    status: (profile?.status as User['status']) || 'active',
    plan: (profile?.plan as string) || 'free',
    reputation_score: (profile?.reputation_score as number) || 0,
    diaries_count: (profile?.diaries_count as number) || 0,
    followers_count: (profile?.followers_count as number) || 0,
    following_count: (profile?.following_count as number) || 0,
    created_at: authUser.created_at,
    updated_at: (profile?.updated_at as string) || authUser.created_at,
  };
}

async function fetchProfile(authUser: any) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || 'Người dùng mới',
          avatar_url: authUser.user_metadata?.avatar_url || null,
        })
        .select()
        .single();

      if (!insertError) return newProfile;
    }

    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user, isLoading: false }),

      setLoading: (isLoading) => set({ isLoading }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          const profile = await fetchProfile(data.user);
          const user = buildUser(data.user, profile);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (email, password, fullName) => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName },
            },
          });

          if (error) throw error;

          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      refreshSession: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            const profile = await fetchProfile(session.user);
            const user = buildUser(session.user, profile);
            set({ user, isAuthenticated: true, isLoading: false });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) throw new Error('Not authenticated');

        set({ isLoading: true });
        try {
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

          if (error) throw error;
          set({
            user: { ...user, ...updates },
          });
        } finally {
          set({ isLoading: false });
        }
      },

      changePassword: async (currentPwd: string, newPwd: string) => {
        set({ isLoading: true });
        try {
          const { error } = await supabase.auth.updateUser({ password: newPwd });
          if (error) throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      subscribeToProfileUpdates: () => {
        const { user } = get();
        if (!user) return;

        if (profileSubscription) {
          profileSubscription.unsubscribe();
        }

        profileSubscription = supabase
          .channel(`public:profiles:${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            (payload) => {
              const updatedProfile = payload.new;
              set((state) => {
                if (state.user && state.user.id === updatedProfile.id) {
                  return {
                    user: {
                      ...state.user,
                      ...updatedProfile,
                    },
                  };
                }
                return state;
              });
            }
          )
          .subscribe();
      },

      unsubscribeFromProfileUpdates: () => {
        if (profileSubscription) {
          profileSubscription.unsubscribe();
          profileSubscription = null;
        }
      },
    }),
    {
      name: 'wanderlab-auth-mobile',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
