import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import {
  Cog6ToothIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { db } from '../lib/supabase';
import { showToast } from '../components/ui/Toast';

const settingGroups = {
  vacation: {
    label: 'Настройки отпусков',
    keys: ['default_vacation_days_professor', 'default_vacation_days_docent', 'default_vacation_days_teacher', 
           'additional_days_phd', 'additional_days_doctor', 'max_consecutive_days', 'min_days_before_request']
  },
  university: {
    label: 'Данные университета',
    keys: ['university_name', 'university_short_name', 'rector_name', 'rector_position']
  },
  academic: {
    label: 'Учебный год',
    keys: ['academic_year_start', 'academic_year_end']
  }
};

export const SettingsPage = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, setting: null });
  const [formData, setFormData] = useState({
    setting_key: '',
    setting_value: '',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await db.settings.getAll();
      setSettings(data || []);
    } catch (error) {
      showToast.error('Ошибка загрузки');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (setting = null) => {
    setFormData({
      setting_key: setting?.setting_key || '',
      setting_value: setting?.setting_value || '',
      description: setting?.description || ''
    });
    setEditModal({ open: true, setting });
  };

  const handleSave = async () => {
    try {
      if (!formData.setting_key.trim() || !formData.setting_value.trim()) {
        showToast.error('Заполните обязательные поля');
        return;
      }

      setSaving(true);
      await db.settings.update(formData.setting_key, formData.setting_value, formData.description);
      showToast.success('Настройка сохранена');
      setEditModal({ open: false, setting: null });
      loadData();
    } catch (error) {
      showToast.error('Ошибка сохранения');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key) => {
    if (!confirm('Удалить эту настройку?')) return;
    
    try {
      await db.settings.delete(key);
      showToast.success('Настройка удалена');
      loadData();
    } catch (error) {
      showToast.error('Ошибка удаления');
    }
  };

  const handleQuickUpdate = async (key, value) => {
    try {
      await db.settings.update(key, value);
      setSettings(prev => prev.map(s => 
        s.setting_key === key ? { ...s, setting_value: value } : s
      ));
      showToast.success('Сохранено');
    } catch (error) {
      showToast.error('Ошибка');
    }
  };

  const getSettingsByGroup = (groupKeys) => {
    return settings.filter(s => groupKeys.includes(s.setting_key));
  };

  const otherSettings = settings.filter(s => 
    !Object.values(settingGroups).some(g => g.keys.includes(s.setting_key))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Cog6ToothIcon className="w-8 h-8 text-sgu-blue" />
            Настройки системы
          </h1>
          <p className="text-gray-500">Управление параметрами системы</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadData} className="btn-secondary !py-2 !px-4">
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          <button onClick={() => openEditModal()} className="btn-primary !py-2 !px-4">
            <PlusIcon className="w-5 h-5 mr-1" />
            Добавить
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-12 bg-gray-100 rounded" />
                <div className="h-12 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Grouped settings */}
          {Object.entries(settingGroups).map(([key, group]) => {
            const groupSettings = getSettingsByGroup(group.keys);
            if (groupSettings.length === 0) return null;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{group.label}</h2>
                
                <div className="space-y-3">
                  {groupSettings.map(setting => (
                    <div
                      key={setting.setting_key}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{setting.setting_key}</p>
                        {setting.description && (
                          <p className="text-xs text-gray-500 truncate">{setting.description}</p>
                        )}
                      </div>
                      
                      <input
                        type="text"
                        value={setting.setting_value}
                        onChange={(e) => {
                          setSettings(prev => prev.map(s => 
                            s.setting_key === setting.setting_key 
                              ? { ...s, setting_value: e.target.value } 
                              : s
                          ));
                        }}
                        onBlur={(e) => handleQuickUpdate(setting.setting_key, e.target.value)}
                        className="input-field !py-2 w-40 text-sm"
                      />

                      <button
                        onClick={() => openEditModal(setting)}
                        className="p-2 text-gray-400 hover:text-sgu-blue rounded-lg"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}

          {/* Other settings */}
          {otherSettings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Прочие настройки</h2>
              
              <div className="space-y-3">
                {otherSettings.map(setting => (
                  <div
                    key={setting.setting_key}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{setting.setting_key}</p>
                      {setting.description && (
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      )}
                    </div>
                    
                    <span className="text-gray-700 font-mono text-xs bg-white px-3 py-1 rounded border">
                      {setting.setting_value}
                    </span>

                    <button
                      onClick={() => openEditModal(setting)}
                      className="p-2 text-gray-400 hover:text-sgu-blue rounded-lg"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(setting.setting_key)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty state */}
          {settings.length === 0 && (
            <div className="card text-center py-12">
              <Cog6ToothIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Настройки не найдены</p>
              <button onClick={() => openEditModal()} className="btn-primary mt-4">
                Добавить первую настройку
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog
        open={editModal.open}
        onClose={() => setEditModal({ open: false, setting: null })}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-6">
              {editModal.setting ? 'Редактирование настройки' : 'Новая настройка'}
            </Dialog.Title>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ключ *
                </label>
                <input
                  type="text"
                  value={formData.setting_key}
                  onChange={(e) => setFormData({ ...formData, setting_key: e.target.value })}
                  className="input-field font-mono text-sm"
                  placeholder="setting_key"
                  disabled={!!editModal.setting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Значение *
                </label>
                <input
                  type="text"
                  value={formData.setting_value}
                  onChange={(e) => setFormData({ ...formData, setting_value: e.target.value })}
                  className="input-field"
                  placeholder="Значение настройки"
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
                  rows={2}
                  placeholder="Описание настройки"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditModal({ open: false, setting: null })}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button 
                onClick={handleSave} 
                className="btn-primary flex-1"
                disabled={saving}
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default SettingsPage;