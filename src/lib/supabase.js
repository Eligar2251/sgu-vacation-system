import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Хелперы для работы с базой данных
export const db = {
  // Профили
  profiles: {
    async getById(id) {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async getByDepartment(departmentId) {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments(*)
        `)
        .eq('department_id', departmentId)
        .order('full_name');
      if (error) throw error;
      return data;
    },

    async getAll() {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments(*)
        `)
        .order('full_name');
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Кафедры
  departments: {
    async getAll() {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },

    async create(department) {
      const { data, error } = await supabase
        .from('departments')
        .insert(department)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  // Заявки на отпуск
  vacationRequests: {
    async getByUser(userId) {
      const { data, error } = await supabase
        .from('vacation_requests')
        .select(`
          *,
          user:profiles!vacation_requests_user_id_fkey(
            id, full_name, position, department:departments(*)
          ),
          approvedByHead:profiles!vacation_requests_approved_by_head_fkey(full_name),
          approvedByAdmin:profiles!vacation_requests_approved_by_admin_fkey(full_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async getByDepartment(departmentId) {
      const { data, error } = await supabase
        .from('vacation_requests')
        .select(`
          *,
          user:profiles!vacation_requests_user_id_fkey(
            id, full_name, position, department_id, department:departments(*)
          ),
          approvedByHead:profiles!vacation_requests_approved_by_head_fkey(full_name),
          approvedByAdmin:profiles!vacation_requests_approved_by_admin_fkey(full_name)
        `)
        .eq('user.department_id', departmentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async getAll() {
      const { data, error } = await supabase
        .from('vacation_requests')
        .select(`
          *,
          user:profiles!vacation_requests_user_id_fkey(
            id, full_name, position, department:departments(*)
          ),
          approvedByHead:profiles!vacation_requests_approved_by_head_fkey(full_name),
          approvedByAdmin:profiles!vacation_requests_approved_by_admin_fkey(full_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async getPending() {
      const { data, error } = await supabase
        .from('vacation_requests')
        .select(`
          *,
          user:profiles!vacation_requests_user_id_fkey(
            id, full_name, position, department:departments(*)
          )
        `)
        .in('status', ['pending', 'approved_head'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async create(request) {
      const { data, error } = await supabase
        .from('vacation_requests')
        .insert(request)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('vacation_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('vacation_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async approveByHead(id, headId, comment = null) {
      const { data, error } = await supabase
        .from('vacation_requests')
        .update({
          status: 'approved_head',
          approved_by_head: headId,
          head_approved_at: new Date().toISOString(),
          head_comment: comment
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async approveByAdmin(id, adminId, comment = null) {
      const { data, error } = await supabase
        .from('vacation_requests')
        .update({
          status: 'approved',
          approved_by_admin: adminId,
          admin_approved_at: new Date().toISOString(),
          admin_comment: comment
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async reject(id, comment, rejectedBy) {
      const { data, error } = await supabase
        .from('vacation_requests')
        .update({
          status: 'rejected',
          admin_comment: comment
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },

  // Настройки
  settings: {
    async getAll() {
      const { data, error } = await supabase
        .from('vacation_settings')
        .select('*');
      if (error) throw error;
      return data.reduce((acc, item) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {});
    },

    async update(key, value) {
      const { data, error } = await supabase
        .from('vacation_settings')
        .upsert({
          setting_key: key,
          setting_value: value
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }
};