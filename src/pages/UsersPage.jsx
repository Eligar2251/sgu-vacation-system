import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import {
  UsersIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { db } from '../lib/supabase';
import { showToast } from '../components/ui/Toast';

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

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  
  // Модалки
  const [editModal, setEditModal] = useState({ open: false, user: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });
  const [importModal, setImportModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  
  // Форма
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    position: '',
    academic_degree: '',
    role: 'teacher',
    department_id: '',
    total_vacation_days: 28,
    used_vacation_days: 0,
    phone: '',
    hire_date: ''
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
      setUsers(usersData || []);
      setDepartments(depsData || []);
    } catch (error) {
      showToast.error('Ошибка загрузки данных');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Фильтрация
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.position?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesDepartment = filterDepartment === 'all' || user.department_id === filterDepartment;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  // Открытие модалки редактирования
  const openEditModal = (user = null) => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        position: user.position || '',
        academic_degree: user.academic_degree || '',
        role: user.role || 'teacher',
        department_id: user.department_id || '',
        total_vacation_days: user.total_vacation_days || 28,
        used_vacation_days: user.used_vacation_days || 0,
        phone: user.phone || '',
        hire_date: user.hire_date || ''
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        position: '',
        academic_degree: '',
        role: 'teacher',
        department_id: '',
        total_vacation_days: 28,
        used_vacation_days: 0,
        phone: '',
        hire_date: ''
      });
    }
    setEditModal({ open: true, user });
  };

  // Сохранение
  const handleSave = async () => {
    try {
      if (!formData.full_name.trim()) {
        showToast.error('Введите ФИО');
        return;
      }

      if (editModal.user) {
        // Редактирование
        await db.profiles.update(editModal.user.id, formData);
        showToast.success('Профиль обновлён');
      } else {
        // Для создания нового пользователя нужен Auth
        showToast.info('Создайте пользователя в Supabase Auth, затем обновите профиль здесь');
      }
      
      setEditModal({ open: false, user: null });
      loadData();
    } catch (error) {
      showToast.error('Ошибка сохранения');
      console.error(error);
    }
  };

  // Удаление
  const handleDelete = async () => {
    try {
      await db.profiles.delete(deleteModal.user.id);
      showToast.success('Пользователь удалён');
      setDeleteModal({ open: false, user: null });
      loadData();
    } catch (error) {
      showToast.error('Ошибка удаления. Возможно, есть связанные данные.');
      console.error(error);
    }
  };

  // Экспорт в CSV
  const handleExport = () => {
    const csvContent = [
      ['ID', 'ФИО', 'Email', 'Должность', 'Роль', 'Кафедра', 'Дней отпуска', 'Использовано', 'Телефон'].join(';'),
      ...filteredUsers.map(u => [
        u.id,
        u.full_name,
        u.email,
        u.position,
        roleLabels[u.role],
        u.department?.name || '',
        u.total_vacation_days,
        u.used_vacation_days,
        u.phone || ''
      ].join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast.success('Файл экспортирован');
  };

  // Импорт из CSV
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
      
      const imported = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';');
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index]?.trim();
        });
        imported.push(obj);
      }

      showToast.info(`Найдено ${imported.length} записей. Обновите профили вручную.`);
      console.log('Imported data:', imported);
      setImportModal(false);
    } catch (error) {
      showToast.error('Ошибка чтения файла');
      console.error(error);
    }
  };

  // Массовое обновление отпусков
  const handleResetVacationDays = async () => {
    if (!confirm('Сбросить использованные дни отпуска для всех сотрудников?')) return;
    
    try {
      await db.profiles.resetVacationDays();
      showToast.success('Дни отпуска сброшены');
      loadData();
    } catch (error) {
      showToast.error('Ошибка сброса');
    }
  };

  // Выбор пользователей
  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-sgu-blue" />
            Сотрудники
          </h1>
          <p className="text-gray-500">Всего: {users.length} | Показано: {filteredUsers.length}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setImportModal(true)} className="btn-secondary !py-2 !px-4">
            <ArrowUpTrayIcon className="w-5 h-5 mr-1" />
            Импорт
          </button>
          <button onClick={handleExport} className="btn-secondary !py-2 !px-4">
            <ArrowDownTrayIcon className="w-5 h-5 mr-1" />
            Экспорт
          </button>
          <button onClick={() => openEditModal()} className="btn-primary !py-2 !px-4">
            <PlusIcon className="w-5 h-5 mr-1" />
            Добавить
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по ФИО, email, должности..."
              className="input-field pl-10"
            />
          </div>

          {/* Role filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input-field w-full lg:w-48"
          >
            <option value="all">Все роли</option>
            <option value="teacher">Преподаватели</option>
            <option value="head">Завкафедрой</option>
            <option value="admin">Администраторы</option>
          </select>

          {/* Department filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="input-field w-full lg:w-64"
          >
            <option value="all">Все кафедры</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        {/* Bulk actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Выбрано: {selectedUsers.length}
            </span>
            <button
              onClick={handleResetVacationDays}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Сбросить дни отпуска
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </th>
                <th className="text-left px-4 py-4 text-sm font-semibold text-gray-900">Сотрудник</th>
                <th className="text-left px-4 py-4 text-sm font-semibold text-gray-900">Кафедра</th>
                <th className="text-left px-4 py-4 text-sm font-semibold text-gray-900">Роль</th>
                <th className="text-left px-4 py-4 text-sm font-semibold text-gray-900">Отпуск</th>
                <th className="text-right px-4 py-4 text-sm font-semibold text-gray-900">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="w-4 h-4 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded" />
                          <div className="h-3 w-24 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-6 w-20 bg-gray-200 rounded-full" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                    <td className="px-4 py-4"><div className="h-8 w-8 bg-gray-200 rounded ml-auto" /></td>
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
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-4">
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
                    <td className="px-4 py-4">
                      <p className="text-gray-900">{user.position || '—'}</p>
                      <p className="text-sm text-gray-500">{user.department?.name || 'Не указана'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleBadgeColors[user.role]}`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <span className="font-semibold text-sgu-blue">
                          {(user.total_vacation_days || 0) - (user.used_vacation_days || 0)}
                        </span>
                        <span className="text-gray-400"> / {user.total_vacation_days || 0}</span>
                      </div>
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full mt-1">
                        <div 
                          className="h-full bg-sgu-blue rounded-full"
                          style={{ 
                            width: `${100 - ((user.used_vacation_days || 0) / (user.total_vacation_days || 1)) * 100}%` 
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-gray-400 hover:text-sgu-blue hover:bg-sgu-blue/10 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, user })}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Удалить"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
              {editModal.user ? 'Редактирование профиля' : 'Новый сотрудник'}
              <button 
                onClick={() => setEditModal({ open: false, user: null })}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </Dialog.Title>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ФИО *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="input-field"
                    placeholder="Иванов Иван Иванович"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    placeholder="email@sgu.ru"
                    disabled={!!editModal.user}
                  />
                  {editModal.user && (
                    <p className="text-xs text-gray-400 mt-1">Email изменяется через Supabase Auth</p>
                  )}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Должность</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="input-field"
                    placeholder="Доцент"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Учёная степень</label>
                  <input
                    type="text"
                    value={formData.academic_degree}
                    onChange={(e) => setFormData({ ...formData, academic_degree: e.target.value })}
                    className="input-field"
                    placeholder="Кандидат технических наук"
                  />
                </div>

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
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Всего дней отпуска</label>
                  <input
                    type="number"
                    value={formData.total_vacation_days}
                    onChange={(e) => setFormData({ ...formData, total_vacation_days: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min={0}
                    max={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Использовано дней</label>
                  <input
                    type="number"
                    value={formData.used_vacation_days}
                    onChange={(e) => setFormData({ ...formData, used_vacation_days: parseInt(e.target.value) || 0 })}
                    className="input-field"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата приёма</label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setEditModal({ open: false, user: null })}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button onClick={handleSave} className="btn-primary flex-1">
                {editModal.user ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Delete Modal */}
      <Dialog
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, user: null })}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900">
                  Удалить сотрудника?
                </Dialog.Title>
                <p className="text-gray-500">{deleteModal.user?.full_name}</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Это действие нельзя отменить. Все связанные данные (заявки, расписание) также будут удалены.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button onClick={handleDelete} className="btn-danger flex-1">
                Удалить
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Import Modal */}
      <Dialog
        open={importModal}
        onClose={() => setImportModal(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              Импорт сотрудников
            </Dialog.Title>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-800 font-medium mb-2">Формат CSV файла:</p>
                <code className="text-xs text-blue-600 block">
                  ФИО;Должность;Роль;Кафедра;Дней отпуска;Телефон
                </code>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Перетащите CSV файл или нажмите для выбора</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                  id="import-file"
                />
                <label htmlFor="import-file" className="btn-secondary cursor-pointer">
                  Выбрать файл
                </label>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl">
                <p className="text-sm text-amber-800">
                  <strong>Важно:</strong> Пользователи создаются через Supabase Auth. 
                  CSV импорт обновляет только профили существующих пользователей.
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={() => setImportModal(false)} className="btn-secondary">
                Закрыть
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default UsersPage;