import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import {
  UsersIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { db } from '../lib/supabase';
import { showToast } from '../components/ui/Toast';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    academic_degree: '',
    role: 'teacher',
    department_id: '',
    total_vacation_days: 28,
    phone: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, depsData] = await Promise.all([
        db.profiles.getAll(),
        db.departments.getAll()
      ]);
      setUsers(usersData);
      setDepartments(depsData);
    } catch (error) {
      showToast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.position?.toLowerCase().includes(query)
    );
  });

  const openEditModal = (user) => {
    setFormData({
      full_name: user.full_name || '',
      position: user.position || '',
      academic_degree: user.academic_degree || '',
      role: user.role || 'teacher',
      department_id: user.department_id || '',
      total_vacation_days: user.total_vacation_days || 28,
      phone: user.phone || ''
    });
    setEditModal({ open: true, user });
  };

  const handleSave = async () => {
    try {
      await db.profiles.update(editModal.user.id, formData);
      showToast.success('Профиль обновлён');
      setEditModal({ open: false, user: null });
      loadData();
    } catch (error) {
      showToast.error('Ошибка сохранения');
    }
  };

  const roleLabels = {
    teacher: 'Преподаватель',
    head: 'Завкафедрой',
    admin: 'Администратор'
  };

  const roleBadgeColors = {
    teacher: 'bg-gray-100 text-gray-700',
    head: 'bg-blue-100 text-blue-700',
    admin: 'bg-purple-100 text-purple-700'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Сотрудники</h1>
          <p className="text-gray-500">Управление пользователями системы</p>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по ФИО, email или должности..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Сотрудник</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Кафедра</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Роль</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Отпуск</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded" />
                          <div className="h-3 w-24 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="h-8 w-8 bg-gray-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sgu-blue to-sgu-blue-light flex items-center justify-center text-white font-bold">
                          {user.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{user.position}</p>
                      <p className="text-sm text-gray-500">{user.department?.name || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleBadgeColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <span className="font-semibold text-sgu-blue">
                          {user.total_vacation_days - user.used_vacation_days}
                        </span>
                        <span className="text-gray-400"> / {user.total_vacation_days}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-gray-400 hover:text-sgu-blue hover:bg-sgu-blue/10 rounded-lg transition-colors"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Сотрудники не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog
        open={editModal.open}
        onClose={() => setEditModal({ open: false, user: null })}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-6">
              Редактирование профиля
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ФИО</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Учёная степень</label>
                  <input
                    type="text"
                    value={formData.academic_degree}
                    onChange={(e) => setFormData({ ...formData, academic_degree: e.target.value })}
                    className="input-field"
                    placeholder="Кандидат наук, Доктор наук"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-field"
                  >
                    <option value="teacher">Преподаватель</option>
                    <option value="head">Завкафедрой</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Кафедра</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Не указана</option>
                    {departments.map(dep => (
                      <option key={dep.id} value={dep.id}>{dep.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дней отпуска</label>
                  <input
                    type="number"
                    value={formData.total_vacation_days}
                    onChange={(e) => setFormData({ ...formData, total_vacation_days: parseInt(e.target.value) })}
                    className="input-field"
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditModal({ open: false, user: null })}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button onClick={handleSave} className="btn-primary flex-1">
                Сохранить
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default UsersPage;