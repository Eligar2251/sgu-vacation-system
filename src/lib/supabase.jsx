import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const db = {
  supabase,

  // ==================== ПРОФИЛИ ====================
  profiles: {
    async getById(id) {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments!profiles_department_id_fkey(*)
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
          department:departments!profiles_department_id_fkey(*)
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
          department:departments!profiles_department_id_fkey(*)
        `)
        .order('full_name');
      if (error) throw error;
      return data;
    },

    async getTeachers() {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          department:departments!profiles_department_id_fkey(*)
        `)
        .in('role', ['teacher', 'head'])
        .order('full_name');
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          department:departments!profiles_department_id_fkey(*)
        `)
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async resetVacationDays() {
      const { data, error } = await supabase
        .from('profiles')
        .update({ used_vacation_days: 0, updated_at: new Date().toISOString() })
        .neq('role', 'admin')
        .select();
      if (error) throw error;
      return data;
    }
  },

  // ==================== КАФЕДРЫ ====================
  departments: {
    async getAll() {
      const { data, error } = await supabase
        .from('departments')
        .select(`
          *,
          head:profiles!departments_head_of_department_id_fkey(id, full_name, position)
        `)
        .order('name');
      if (error) throw error;
      return data;
    },

    async getWithStats() {
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select(`
          *,
          head:profiles!departments_head_of_department_id_fkey(id, full_name, position)
        `)
        .order('name');

      if (deptError) throw deptError;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('department_id, role');

      return (departments || []).map(dept => ({
        ...dept,
        employees_count: (profiles || []).filter(p => p.department_id === dept.id).length,
        teachers_count: (profiles || []).filter(p => p.department_id === dept.id && p.role === 'teacher').length,
        heads_count: (profiles || []).filter(p => p.department_id === dept.id && p.role === 'head').length
      }));
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

  // ==================== ПРЕДМЕТЫ ====================
  subjects: {
    async getAll() {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          department:departments!subjects_department_id_fkey(id, name, code)
        `)
        .order('name');
      if (error) throw error;
      return data;
    },

    async getByDepartment(departmentId) {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('department_id', departmentId)
        .order('name');
      if (error) throw error;
      return data;
    },

    async create(subject) {
      const { data, error } = await supabase
        .from('subjects')
        .insert(subject)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('subjects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  // ==================== ШАБЛОН РАСПИСАНИЯ ====================
  schedule: {
    async getAll() {
      const { data, error } = await supabase
        .from('schedule')
        .select(`
          *,
          teacher:profiles!schedule_teacher_id_fkey(id, full_name, position, department_id),
          department:departments!schedule_department_id_fkey(id, name, code)
        `)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return data;
    },

    async getByTeacher(teacherId) {
      const { data, error } = await supabase
        .from('schedule')
        .select(`
          *,
          teacher:profiles!schedule_teacher_id_fkey(id, full_name, position, department_id),
          department:departments!schedule_department_id_fkey(id, name, code)
        `)
        .eq('teacher_id', teacherId)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return data;
    },

    async getByDepartment(departmentId) {
      const { data, error } = await supabase
        .from('schedule')
        .select(`
          *, 
          teacher:profiles!schedule_teacher_id_fkey(id, full_name, position, department_id),
          department:departments!schedule_department_id_fkey(id, name, code)
        `)
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return data;
    },

    async create(schedule) {
      const { data, error } = await supabase
        .from('schedule')
        .insert({ ...schedule, is_template: true, is_active: true })
        .select(`
          *, 
          teacher:profiles!schedule_teacher_id_fkey(id, full_name, position, department_id),
          department:departments!schedule_department_id_fkey(id, name, code)
        `)
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('schedule')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *, 
          teacher:profiles!schedule_teacher_id_fkey(id, full_name, position, department_id),
          department:departments!schedule_department_id_fkey(id, name, code)
        `)
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('schedule')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },

    async hardDelete(id) {
      const { error } = await supabase
        .from('schedule')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  // ==================== НЕДЕЛЬНОЕ РАСПИСАНИЕ ====================
  weeklySchedule: {
    async getAll(startDate, endDate) {
      const { data, error } = await supabase
        .from('weekly_schedule')
        .select(`
          *,
          teacher:profiles!weekly_schedule_teacher_id_fkey(id, full_name, position, department_id),
          replacementTeacher:profiles!weekly_schedule_replacement_teacher_id_fkey(id, full_name, position, department_id)
        `)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)
        .order('schedule_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async getByTeacher(teacherId, startDate, endDate) {
      const { data, error } = await supabase
        .from('weekly_schedule')
        .select(`
          *,
          teacher:profiles!weekly_schedule_teacher_id_fkey(id, full_name, position, department_id),
          replacementTeacher:profiles!weekly_schedule_replacement_teacher_id_fkey(id, full_name, position, department_id)
        `)
        .or(`teacher_id.eq.${teacherId},replacement_teacher_id.eq.${teacherId}`)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)
        .order('schedule_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    },

    async generate(startDate, endDate) {
      try {
        console.log('Calling generate_weekly_schedule:', { startDate, endDate });
        
        const { data, error } = await supabase.rpc('generate_weekly_schedule', {
          p_start_date: startDate,
          p_end_date: endDate
        });
        
        if (error) {
          console.error('RPC error:', error);
          throw new Error(`Ошибка генерации расписания: ${error.message || error.details || 'Неизвестная ошибка'}`);
        }
        
        console.log('Generated count:', data);
        return data || 0;
      } catch (err) {
        console.error('Generate schedule error:', err);
        throw err;
      }
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from('weekly_schedule')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async cancel(id, reason) {
      const { data, error } = await supabase
        .from('weekly_schedule')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    async setReplacement(id, replacementTeacherId) {
      const { data, error } = await supabase
        .from('weekly_schedule')
        .update({
          replacement_teacher_id: replacementTeacherId,
          status: 'replaced',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // ==================== ЗАЯВКИ НА ОТПУСК ====================
  vacationRequests: {
    async getByUser(userId) {
      const { data, error } = await supabase
        .from('vacation_requests')
        .select(`
          *,
          user:profiles!vacation_requests_user_id_fkey(
            id, 
            full_name, 
            position, 
            department_id,
            department:departments!profiles_department_id_fkey(*)
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
            id, 
            full_name, 
            position, 
            department_id,
            department:departments!profiles_department_id_fkey(*)
          ),
          approvedByHead:profiles!vacation_requests_approved_by_head_fkey(full_name),
          approvedByAdmin:profiles!vacation_requests_approved_by_admin_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).filter(r => r.user?.department_id === departmentId);
    },

    async getAll() {
      const { data, error } = await supabase
        .from('vacation_requests')
        .select(`
          *,
          user:profiles!vacation_requests_user_id_fkey(
            id, 
            full_name, 
            position,
            department:departments!profiles_department_id_fkey(*)
          ),
          approvedByHead:profiles!vacation_requests_approved_by_head_fkey(full_name),
          approvedByAdmin:profiles!vacation_requests_approved_by_admin_fkey(full_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },

    async getApprovedInRange(startDate, endDate) {
      const { data, error } = await supabase
        .from('vacation_requests')
        .select(`
          *, 
          user:profiles!vacation_requests_user_id_fkey(id, full_name)
        `)
        .eq('status', 'approved')
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);
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

    async approveByAdmin(id, adminId, orderNumber = null, comment = null) {
      const { data, error } = await supabase
        .from('vacation_requests')
        .update({
          status: 'approved',
          approved_by_admin: adminId,
          admin_approved_at: new Date().toISOString(),
          order_number: orderNumber,
          admin_comment: comment
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async reject(id, comment) {
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

  // ==================== ЗАМЕНЫ ====================
  replacements: {
    async getByTeacher(teacherId) {
      const { data, error } = await supabase
        .from('teacher_replacements')
        .select(`
          *,
          originalTeacher:profiles!teacher_replacements_original_teacher_id_fkey(id, full_name, position),
          replacementTeacher:profiles!teacher_replacements_replacement_teacher_id_fkey(id, full_name, position),
          schedule:schedule!teacher_replacements_schedule_id_fkey(*)
        `)
        .or(`original_teacher_id.eq.${teacherId},replacement_teacher_id.eq.${teacherId}`)
        .order('class_date', { ascending: true });
      if (error) throw error;
      return data;
    },

    async getByVacationRequest(vacationRequestId) {
      const { data, error } = await supabase
        .from('teacher_replacements')
        .select(`
          *,
          originalTeacher:profiles!teacher_replacements_original_teacher_id_fkey(id, full_name, position),
          replacementTeacher:profiles!teacher_replacements_replacement_teacher_id_fkey(id, full_name, position),
          schedule:schedule!teacher_replacements_schedule_id_fkey(*)
        `)
        .eq('vacation_request_id', vacationRequestId)
        .order('class_date', { ascending: true });
      if (error) throw error;
      return data;
    },

    async getAll() {
      const { data, error } = await supabase
        .from('teacher_replacements')
        .select(`
          *,
          originalTeacher:profiles!teacher_replacements_original_teacher_id_fkey(id, full_name, position),
          replacementTeacher:profiles!teacher_replacements_replacement_teacher_id_fkey(id, full_name, position),
          schedule:schedule!teacher_replacements_schedule_id_fkey(*),
          vacationRequest:vacation_requests!teacher_replacements_vacation_request_id_fkey(id, start_date, end_date)
        `)
        .order('class_date', { ascending: false });
      if (error) throw error;
      return data;
    },

    async create(replacement) {
      const { data, error } = await supabase
        .from('teacher_replacements')
        .insert(replacement)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async createMany(replacements) {
      if (!replacements || replacements.length === 0) return [];

      const { data, error } = await supabase
        .from('teacher_replacements')
        .insert(replacements)
        .select();
      if (error) throw error;
      return data;
    },

    async updateStatus(id, status, comment = null) {
      const { data, error } = await supabase
        .from('teacher_replacements')
        .update({
          status,
          replacement_comment: comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from('teacher_replacements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  // ==================== УВЕДОМЛЕНИЯ ====================
  notifications: {
    async getByUser(userId) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },

    async getUnreadCount(userId) {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
      return count || 0;
    },

    async create(notification) {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async markAsRead(id) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },

    async markAllAsRead(userId) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      if (error) throw error;
    },

    async delete(id) {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  // ==================== НАСТРОЙКИ ====================
  settings: {
    async getAll() {
      const { data, error } = await supabase
        .from('vacation_settings')
        .select('*')
        .order('setting_key');
      if (error) throw error;
      return data || [];
    },

    async get(key) {
      const { data, error } = await supabase
        .from('vacation_settings')
        .select('*')
        .eq('setting_key', key)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async update(key, value, description = null) {
      const { data, error } = await supabase
        .from('vacation_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          description: description,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(key) {
      const { error } = await supabase
        .from('vacation_settings')
        .delete()
        .eq('setting_key', key);
      if (error) throw error;
    }
  }
};