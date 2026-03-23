import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  ArrowsRightLeftIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { db } from '../lib/supabase';
import { showToast } from '../components/ui/Toast';

const statusConfig = {
  pending: { 
    label: 'Ожидает ответа', 
    className: 'bg-amber-100 text-amber-800', 
    icon: ClockIcon 
  },
  accepted: { 
    label: 'Принято', 
    className: 'bg-emerald-100 text-emerald-800', 
    icon: CheckIcon 
  },
  declined: { 
    label: 'Отклонено', 
    className: 'bg-red-100 text-red-800', 
    icon: XMarkIcon 
  },
  cancelled: { 
    label: 'Занятие отменено', 
    className: 'bg-gray-100 text-gray-800', 
    icon: ExclamationTriangleIcon 
  }
};

export const ReplacementsPage = () => {
  const { profile } = useAuthStore();
  const [replacements, setReplacements] = useState([]);
  const [overtime, setOvertime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('incoming');

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      
      // Загружаем замены
      const data = await db.replacements.getByTeacher(profile.id);
      setReplacements(data || []);
      
      // Загружаем информацию о переработках (с обработкой ошибки если таблицы нет)
      try {
        const { data: overtimeData, error: overtimeError } = await db.supabase
          .from('overtime_hours')
          .select('*')
          .eq('teacher_id', profile.id)
          .maybeSingle(); // maybeSingle вместо single - не выбрасывает ошибку если нет данных
        
        if (!overtimeError) {
          setOvertime(overtimeData);
        }
      } catch (err) {
        // Таблица может не существовать - это нормально
        console.log('overtime_hours not available:', err.message);
        setOvertime(null);
      }
    } catch (error) {
      console.error('Error loading replacements:', error);
      showToast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await db.replacements.updateStatus(id, 'accepted');
      showToast.success('Вы приняли замену');
      loadData();
    } catch (error) {
      console.error('Error accepting replacement:', error);
      showToast.error('Ошибка при принятии замены: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  const handleDecline = async (id) => {
    try {
      await db.replacements.updateStatus(id, 'declined', 'Преподаватель отказался от замены');
      showToast.success('Замена отклонена');
      loadData();
    } catch (error) {
      console.error('Error declining replacement:', error);
      showToast.error('Ошибка при отклонении замены: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  // Входящие запросы (меня просят заменить)
  const incomingReplacements = replacements.filter(r => 
    r.replacement_teacher_id === profile?.id && !r.is_cancelled
  );
  
  // Исходящие (мои занятия заменяют)
  const outgoingReplacements = replacements.filter(r => 
    r.original_teacher_id === profile?.id
  );

  const pendingCount = incomingReplacements.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ArrowsRightLeftIcon className="w-8 h-8 text-sgu-blue" />
            Замены занятий
          </h1>
          <p className="text-gray-500">Управление заменами</p>
        </div>

        {pendingCount > 0 && (
          <div className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl font-medium animate-pulse">
            {pendingCount} {pendingCount === 1 ? 'запрос' : 'запросов'} на замену
          </div>
        )}
      </div>

      {/* Статистика переработок - показываем только если есть данные */}
      {overtime && (overtime.hours_extra > 0 || overtime.hours_owed > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card bg-gradient-to-r from-emerald-50 to-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Часы переработки</p>
                <p className="text-3xl font-bold text-emerald-700">{overtime.hours_extra || 0} ч.</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-200 flex items-center justify-center">
                <CheckIcon className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-2">За замены других преподавателей</p>
          </div>

          <div className="card bg-gradient-to-r from-amber-50 to-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">К отработке</p>
                <p className="text-3xl font-bold text-amber-700">{overtime.hours_owed || 0} ч.</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-200 flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-amber-700" />
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-2">За отмененные занятия</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'incoming'
              ? 'border-sgu-blue text-sgu-blue'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Входящие запросы
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'outgoing'
              ? 'border-sgu-blue text-sgu-blue'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Мои занятия (замены)
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-20 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : activeTab === 'incoming' ? (
        /* Входящие запросы */
        incomingReplacements.length > 0 ? (
          <div className="space-y-4">
            {incomingReplacements.map((replacement) => {
              const status = statusConfig[replacement.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isPending = replacement.status === 'pending';

              return (
                <motion.div
                  key={replacement.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`card ${isPending ? 'ring-2 ring-amber-300' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <ArrowsRightLeftIcon className="w-7 h-7 text-purple-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Замена за: {replacement.originalTeacher?.full_name || 'Неизвестно'}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {replacement.originalTeacher?.position || ''}
                          </p>
                        </div>
                        
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
                          <StatusIcon className="w-4 h-4" />
                          {status.label}
                        </span>
                      </div>

                      {/* Информация о занятии */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {format(parseISO(replacement.class_date), 'EEEE, d MMMM', { locale: ru })}
                            </span>
                          </div>
                          {replacement.schedule && (
                            <span className="text-sgu-blue font-bold">
                              {replacement.schedule.start_time?.slice(0, 5)} - {replacement.schedule.end_time?.slice(0, 5)}
                            </span>
                          )}
                        </div>
                        {replacement.schedule && (
                          <>
                            <p className="font-medium text-gray-900 mt-2">
                              {replacement.schedule.subject}
                            </p>
                            <p className="text-sm text-gray-500">
                              Ауд. {replacement.schedule.room} • Группа {replacement.schedule.group_name}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Кнопки действий */}
                      {isPending && (
                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={() => handleAccept(replacement.id)}
                            className="btn-success !py-2"
                          >
                            <CheckIcon className="w-5 h-5 mr-1" />
                            Принять замену
                          </button>
                          <button
                            onClick={() => handleDecline(replacement.id)}
                            className="btn-secondary !py-2 text-red-600 hover:bg-red-50"
                          >
                            <XMarkIcon className="w-5 h-5 mr-1" />
                            Отказаться
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-12">
            <ArrowsRightLeftIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Нет входящих запросов
            </h3>
            <p className="text-gray-500">
              Когда вас попросят заменить преподавателя, запрос появится здесь
            </p>
          </div>
        )
      ) : (
        /* Мои занятия */
        outgoingReplacements.length > 0 ? (
          <div className="space-y-4">
            {outgoingReplacements.map((replacement) => {
              const status = statusConfig[replacement.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <div key={replacement.id} className="card">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      replacement.is_cancelled ? 'bg-gray-100' : 'bg-blue-100'
                    }`}>
                      {replacement.is_cancelled ? (
                        <ExclamationTriangleIcon className="w-7 h-7 text-gray-500" />
                      ) : (
                        <CalendarDaysIcon className="w-7 h-7 text-blue-600" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-500">
                            {format(parseISO(replacement.class_date), 'EEEE, d MMMM', { locale: ru })}
                          </p>
                          <h3 className="font-semibold text-gray-900">
                            {replacement.schedule?.subject || 'Занятие'}
                          </h3>
                          {replacement.schedule && (
                            <p className="text-sm text-gray-500">
                              {replacement.schedule.start_time?.slice(0, 5)} - {replacement.schedule.end_time?.slice(0, 5)} • 
                              Ауд. {replacement.schedule.room} • {replacement.schedule.group_name}
                            </p>
                          )}
                        </div>

                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
                          <StatusIcon className="w-4 h-4" />
                          {status.label}
                        </span>
                      </div>

                      {replacement.replacementTeacher && !replacement.is_cancelled && (
                        <p className="mt-2 text-sm">
                          Заменяет: <span className="font-medium text-sgu-blue">
                            {replacement.replacementTeacher.full_name}
                          </span>
                        </p>
                      )}

                      {replacement.is_cancelled && (
                        <p className="mt-2 text-sm text-amber-600">
                          Занятие отменено. {replacement.cancellation_reason || ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card text-center py-12">
            <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Нет замен по вашим занятиям
            </h3>
            <p className="text-gray-500">
              Информация о заменах появится когда вы уйдете в отпуск
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default ReplacementsPage;