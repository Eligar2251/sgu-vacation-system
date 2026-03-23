import { create } from 'zustand';
import { supabase, db } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (session?.user) {
        const profile = await db.profiles.getById(session.user.id);
        set({ 
          user: session.user, 
          profile, 
          session,
          loading: false 
        });
      } else {
        set({ 
          user: null, 
          profile: null, 
          session: null,
          loading: false 
        });
      }

      // Подписка на изменения авторизации
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await db.profiles.getById(session.user.id);
          set({ user: session.user, profile, session });
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, session: null });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ error: error.message, loading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const profile = await db.profiles.getById(data.user.id);
      
      set({ 
        user: data.user, 
        profile,
        session: data.session,
        loading: false 
      });

      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  signUp: async (email, password, fullName) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;

      set({ loading: false });
      return { success: true, data };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      await supabase.auth.signOut();
      set({ 
        user: null, 
        profile: null, 
        session: null,
        loading: false 
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;

    try {
      const updatedProfile = await db.profiles.update(user.id, updates);
      set({ profile: updatedProfile });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const profile = await db.profiles.getById(user.id);
      set({ profile });
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  }
}));