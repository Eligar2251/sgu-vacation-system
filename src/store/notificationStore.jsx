import { create } from 'zustand';
import { db } from '../lib/supabase';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async (userId) => {
    if (!userId) return;
    
    try {
      set({ loading: true });
      const [notifications, unreadCount] = await Promise.all([
        db.notifications.getByUser(userId),
        db.notifications.getUnreadCount(userId)
      ]);
      set({ 
        notifications: notifications || [], 
        unreadCount: unreadCount || 0, 
        loading: false 
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ loading: false, notifications: [], unreadCount: 0 });
    }
  },

  markAsRead: async (id) => {
    try {
      await db.notifications.markAsRead(id);
      const { notifications, unreadCount } = get();
      set({
        notifications: notifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, unreadCount - 1)
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async (userId) => {
    if (!userId) return;
    
    try {
      await db.notifications.markAllAsRead(userId);
      const { notifications } = get();
      set({
        notifications: notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      await db.notifications.delete(id);
      const { notifications, unreadCount } = get();
      const notification = notifications.find(n => n.id === id);
      set({
        notifications: notifications.filter(n => n.id !== id),
        unreadCount: notification && !notification.is_read 
          ? Math.max(0, unreadCount - 1) 
          : unreadCount
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },

  // Очистка при выходе
  clear: () => {
    set({
      notifications: [],
      unreadCount: 0,
      loading: false
    });
  }
}));