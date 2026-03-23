import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import {
BuildingOffice2Icon,
PlusIcon,
PencilSquareIcon,
TrashIcon,
UsersIcon,
AcademicCapIcon
} from '@heroicons/react/24/outline';
import { db } from '../lib/supabase';
import { showToast } from '../components/ui/Toast';
import { SkeletonCard } from '../components/ui/LoadingSpinner';

export const DepartmentsPage = () => {
const [departments, setDepartments] = useState([]);
const [loading, setLoading] = useState(true);
const [editModal, setEditModal] = useState({ open: false, department: null });
const [formData, setFormData] = useState({ name: '', code: '', description: '' });
const [saving, setSaving] = useState(false);

useEffect(() => {
loadDepartments();
}, []);

const loadDepartments = async () => {
try {
setLoading(true);
const data = await db.departments.getWithStats();
setDepartments(data || []);
} catch (error) {
console.error('Error loading departments:', error);
showToast.error('Ошибка загрузки кафедр');
} finally {
setLoading(false);
}
};

const openEditModal = (department = null) => {
setFormData({
name: department?.name || '',
code: department?.code || '',
description: department?.description || ''
});
setEditModal({ open: true, department });
};

const handleSave = async () => {
if (!formData.name.trim()) {
showToast.error('Введите название кафедры');
return;
}

text

setSaving(true);
try {
  if (editModal.department) {
    await db.departments.update(editModal.department.id, formData);
    showToast.success('Кафедра обновлена');
  } else {
    await db.departments.create(formData);
    showToast.success('Кафедра создана');
  }
  setEditModal({ open: false, department: null });
  loadDepartments();
} catch (error) {
  console.error('Error saving department:', error);
  showToast.error('Ошибка сохранения');
} finally {
  setSaving(false);
}
};

const handleDelete = async (id) => {
if (!confirm('Удалить кафедру? Это действие нельзя отменить.')) return;

text

try {
  await db.departments.delete(id);
  showToast.success('Кафедра удалена');
  loadDepartments();
} catch (error) {
  console.error('Error deleting department:', error);
  showToast.error('Ошибка удаления. Возможно, есть связанные сотрудники.');
}
};

return (
<div className="space-y-6">
{/* Header */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
<div>
<h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
<BuildingOffice2Icon className="w-8 h-8 text-sgu-blue" />
Управление кафедрами
</h1>
<p className="text-gray-500">Список кафедр и подразделений</p>
</div>

text

    <button
      onClick={() => openEditModal()}
      className="btn-primary"
    >
      <PlusIcon className="w-5 h-5 mr-2" />
      Добавить кафедру
    </button>
  </div>

  {/* Stats */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div className="card bg-gradient-to-br from-sgu-blue to-blue-700 text-white">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <BuildingOffice2Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-white/80 text-sm">Всего кафедр</p>
          <p className="text-2xl font-bold">{departments.length}</p>
        </div>
      </div>
    </div>

    <div className="card">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <UsersIcon className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Всего сотрудников</p>
          <p className="text-2xl font-bold text-gray-900">
            {departments.reduce((sum, d) => sum + (d.employees_count || 0), 0)}
          </p>
        </div>
      </div>
    </div>

    <div className="card">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
          <AcademicCapIcon className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Заведующих</p>
          <p className="text-2xl font-bold text-gray-900">
            {departments.reduce((sum, d) => sum + (d.heads_count || 0), 0)}
          </p>
        </div>
      </div>
    </div>
  </div>

  {/* Departments List */}
  {loading ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
    </div>
  ) : departments.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {departments.map((dept, index) => (
        <motion.div
          key={dept.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="card card-hover"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {dept.code && (
                  <span className="px-2 py-0.5 bg-sgu-blue/10 text-sgu-blue text-xs font-medium rounded">
                    {dept.code}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{dept.name}</h3>
              {dept.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{dept.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <UsersIcon className="w-4 h-4" />
                  <span>{dept.employees_count || 0} сотр.</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <AcademicCapIcon className="w-4 h-4" />
                  <span>{dept.teachers_count || 0} преп.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <button
                onClick={() => openEditModal(dept)}
                className="p-2 text-gray-400 hover:text-sgu-blue hover:bg-sgu-blue/10 rounded-lg transition-colors"
                title="Редактировать"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(dept.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Удалить"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  ) : (
    <div className="card text-center py-16">
      <BuildingOffice2Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет кафедр</h3>
      <p className="text-gray-500 mb-4">Создайте первую кафедру</p>
      <button onClick={() => openEditModal()} className="btn-primary">
        <PlusIcon className="w-5 h-5 mr-2" />
        Добавить кафедру
      </button>
    </div>
  )}

  {/* Edit Modal */}
  <Dialog
    open={editModal.open}
    onClose={() => setEditModal({ open: false, department: null })}
    className="relative z-50"
  >
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
        <Dialog.Title className="text-xl font-bold text-gray-900 mb-6">
          {editModal.department ? 'Редактирование кафедры' : 'Новая кафедра'}
        </Dialog.Title>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="Кафедра информационных технологий"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Код/Сокращение
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="input-field"
              placeholder="КИТ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
              rows={3}
              placeholder="Краткое описание кафедры..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setEditModal({ open: false, department: null })}
            className="btn-secondary flex-1"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : editModal.department ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </Dialog.Panel>
    </div>
  </Dialog>
</div>
);
};

export default DepartmentsPage;