import { create } from 'zustand';
import { db } from '../lib/supabase';

export const useVacationStore = create((set, get) => ({
  requests: [],
  departmentRequests: [],
  allRequests: [],
  loading: false,
  error: null,

  fetchUserRequests: async (userId) => {
    if (!userId) return;
    
    try {
      set({ loading: true, error: null });
      const requests = await db.vacationRequests.getByUser(userId);
      set({ requests: requests || [], loading: false });
    } catch (error) {
      console.error('Error fetching user requests:', error);
      set({ error: error.message, loading: false, requests: [] });
    }
  },

  fetchDepartmentRequests: async (departmentId) => {
    if (!departmentId) return;
    
    try {
      set({ loading: true, error: null });
      const requests = await db.vacationRequests.getByDepartment(departmentId);
      set({ departmentRequests: requests || [], loading: false });
    } catch (error) {
      console.error('Error fetching department requests:', error);
      set({ error: error.message, loading: false, departmentRequests: [] });
    }
  },

  fetchAllRequests: async () => {
    try {
      set({ loading: true, error: null });
      const requests = await db.vacationRequests.getAll();
      set({ allRequests: requests || [], loading: false });
    } catch (error) {
      console.error('Error fetching all requests:', error);
      set({ error: error.message, loading: false, allRequests: [] });
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
      console.error('Error creating request:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  approveByHead: async (requestId, headId, comment = null) => {
    try {
      set({ loading: true, error: null });
      await db.vacationRequests.approveByHead(requestId, headId, comment);
      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error('Error approving by head:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  approveByAdmin: async (requestId, adminId, comment = null) => {
    try {
      set({ loading: true, error: null });
      await db.vacationRequests.approveByAdmin(requestId, adminId, comment);
      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error('Error approving by admin:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  rejectRequest: async (requestId, comment, rejectedBy = null) => {
    try {
      set({ loading: true, error: null });
      await db.vacationRequests.reject(requestId, comment);
      set({ loading: false });
      return { success: true };
    } catch (error) {
      console.error('Error rejecting request:', error);
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
      console.error('Error deleting request:', error);
      set({ error: error.message, loading: false });
      return { success: false, error: error.message };
    }
  },

  // Очистка при выходе
  clear: () => {
    set({
      requests: [],
      departmentRequests: [],
      allRequests: [],
      loading: false,
      error: null
    });
  }
}));