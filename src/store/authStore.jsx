import { create } from 'zustand';
import { supabase, db } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,
  initialized: false,

  initialize: async () => {
    // Предотвращаем повторную инициализацию
    if (get().initialized) return;
    
    try {
      set({ loading: true, error: null });
      
      console.log('🔄 Инициализация авторизации...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Ошибка сессии:', sessionError);
        throw sessionError;
      }
      
      console.log('📋 Сессия:', session ? 'есть' : 'нет');
      
      if (session?.user) {
        console.log('👤 User ID:', session.user.id);
        console.log('📧 Email:', session.user.email);
        
        try {
          // Пробуем загрузить профиль
          const profile = await db.profiles.getById(session.user.id);
          console.log('✅ Профиль загружен:', profile);
          
          set({ 
            user: session.user, 
            profile, 
            session,
            loading: false,
            initialized: true
          });
        } catch (profileError) {
          console.error('❌ Ошибка загрузки профиля:', profileError);
          
          // Пробуем напрямую через Supabase
          console.log('🔄 Пробуем загрузить напрямую...');
          const { data: directProfile, error: directError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (directError) {
            console.error('❌ Прямая загрузка тоже не удалась:', directError);
          } else {
            console.log('✅ Профиль через прямой запрос:', directProfile);
          }
          
          set({ 
            user: session.user, 
            profile: directProfile || null, 
            session,
            loading: false,
            initialized: true
          });
        }
      } else {
        console.log('ℹ️ Пользователь не авторизован');
        set({ 
          user: null, 
          profile: null, 
          session: null,
          loading: false,
          initialized: true
        });
      }

      // Подписка на изменения авторизации
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔔 Auth event:', event);
          
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const profile = await db.profiles.getById(session.user.id);
              console.log('✅ Профиль после входа:', profile);
              set({ user: session.user, profile, session, loading: false });
            } catch (error) {
              console.error('❌ Ошибка профиля после входа:', error);
              
              // Пробуем напрямую
              const { data: directProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              set({ user: session.user, profile: directProfile || null, session, loading: false });
            }
          } else if (event === 'SIGNED_OUT') {
            set({ 
              user: null, 
              profile: null, 
              session: null, 
              loading: false 
            });
          } else if (event === 'TOKEN_REFRESHED' && session) {
            set({ session });
          }
        }
      );

      set({ _subscription: subscription });
      
    } catch (error) {
      console.error('❌ Критическая ошибка инициализации:', error);
      set({ 
        error: error.message, 
        loading: false, 
        initialized: true,
        user: null,
        profile: null,
        session: null
      });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      
      console.log('🔐 Попытка входа:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        console.error('❌ Ошибка входа:', error);
        throw error;
      }

      console.log('✅ Вход успешен, user:', data.user.id);

      let profile = null;
      try {
        profile = await db.profiles.getById(data.user.id);
        console.log('✅ Профиль загружен:', profile);
      } catch (profileError) {
        console.error('❌ Ошибка загрузки профиля:', profileError);
        
        // Пробуем напрямую
        const { data: directProfile, error: directError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (!directError && directProfile) {
          profile = directProfile;
          console.log('✅ Профиль через прямой запрос:', profile);
        }
      }
      
      set({ 
        user: data.user, 
        profile,
        session: data.session,
        loading: false,
        error: null
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Ошибка signIn:', error);
      set({ 
        error: error.message, 
        loading: false,
        user: null,
        profile: null,
        session: null
      });
      return { success: false, error: error.message };
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      
      console.log('🚪 Выход из системы...');
      
      set({ 
        user: null, 
        profile: null, 
        session: null 
      });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Ошибка выхода:', error);
      }
      
      set({ loading: false });
      
      window.location.href = '/login';
      
    } catch (error) {
      console.error('❌ Ошибка signOut:', error);
      set({ 
        user: null, 
        profile: null, 
        session: null,
        loading: false 
      });
      window.location.href = '/login';
    }
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return { success: false, error: 'Not authenticated' };

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
      console.error('❌ Ошибка обновления профиля:', error);
    }
  },

  reset: () => {
    set({
      user: null,
      profile: null,
      session: null,
      loading: false,
      error: null,
      initialized: false
    });
  }
}));