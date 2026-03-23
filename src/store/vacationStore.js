import { create } from 'zustand';
import { db } from '../lib/supabase';

export const useVacationStore = create((set, get) => ({
  requests: [],
  departmentRequests: [],
  allRequests: [],
  loading: false,
  error: null,

  fetchUserRequests: async (userId) => {
    try {
      set({ loading: true, error: null });
      const requests = await db.vacationRequests.getByUser(userId);
      set({ requests, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchDepartmentRequests: async (departmentId) => {
    try {
      set({ loading: true, error: null });
      const requests = await db.vacationRequests.getAll();
      const filtered = requests.filter(r => 
        r.user?.department?.id === departmentId
      );
      set({ departmentRequests: filtered, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAllRequests: async () => {
    try {
      set({ loading: true, error: null });
      const requests = await db.vacationRequests.getAll();
      set({ allRequests: requests, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createRequest: async (request) => {
    try {
      set({ loading: true, error: null });
      const newRequest = await db.vacationRequests.create(request);
      const { requests } = get();
      set({ 
        requests: [newRequest, ...requests], 
        loading: false 
      });
      return { success: true, data: newRequest };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  approveByHead: async (requestId, headId, comment) => {
    try {
      set({ loading: true, error: null });
      await db.vacationRequests.approveByHead(requestId, headId, comment);
      await get().fetchDepartmentRequests();
      set({ loading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  approveByAdmin: async (requestId, adminId, comment) => {
    try {
      set({ loading: true, error: null });
      await db.vacationRequests.approveByAdmin(requestId, adminId, comment);
      await get().fetchAllRequests();
      set({ loading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  rejectRequest: async (requestId, comment, rejectedBy) => {
    try {
      set({ loading: true, error: null });
      await db.vacationRequests.reject(requestId, comment, rejectedBy);
      await get().fetchAllRequests();
      set({ loading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  deleteRequest: async (requestId) => {
    try {
      set({ loading: true, error: null });
      await db.vacationRequests.delete(requestId);
      const { requests } = get();
      set({ 
        requests: requests.filter(r => r.id !== requestId),
        loading: false 
      });
      return { success: true };
    } catch (error) {
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  }
}));