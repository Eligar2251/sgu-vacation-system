import React, { useState, useEffect } from 'react';
import { format, eachDayOfInterval, parseISO, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  UserIcon, 
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { db } from '../../lib/supabase';

const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export const ReplacementSelector = ({ 
  request, 
  onComplete, 
  onCancel 
}) => {
  const [schedule, setSchedule] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [replacements, setReplacements] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [request]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем расписание преподавателя
      const scheduleData = await db.schedule.getByTeacher(request.user_id);
      
      // Загружаем преподавателей той же кафедры для замены
      const teachersData = await db.profiles.getByDepartment(request.user?.department_id);
      
      // Фильтруем - убираем самого преподавателя
      const availableTeachers = teachersData.filter(t => 
        t.id !== request.user_id && t.role === 'teacher'
      );
      
      setSchedule(scheduleData || []);
      setTeachers(availableTeachers || []);
      
      // Генерируем список занятий на период отпуска
      initReplacements(scheduleData || [], request.start_date, request.end_date);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initReplacements = (scheduleData, startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = eachDayOfInterval({ start, end });
    
    const replacementMap = {};
    
    days.forEach(date => {
      const dayOfWeek = getDay(date) === 0 ? 7 : getDay(date); // Преобразуем воскресенье
      
      scheduleData.forEach(lesson => {
        if (lesson.day_of_week === dayOfWeek) {
          const key = `${format(date, 'yyyy-MM-dd')}_${lesson.id}`;
          replacementMap[key] = {
            date: date,
            dateStr: format(date, 'yyyy-MM-dd'),
            schedule: lesson,
            replacementTeacherId: null,
            isCancelled: false,
            cancellationReason: ''
          };
        }
      });
    });
    
    setReplacements(replacementMap);
  };

  const handleSelectReplacement = (key, teacherId) => {
    setReplacements(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        replacementTeacherId: teacherId,
        isCancelled: false
      }
    }));
  };

  const handleCancelClass = (key) => {
    setReplacements(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        replacementTeacherId: null,
        isCancelled: true,
        cancellationReason: 'Занятие отменено в связи с отпуском преподавателя'
      }
    }));
  };

  const handleUndoCancel = (key) => {
    setReplacements(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isCancelled: false,
        cancellationReason: ''
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const replacementEntries = Object.values(replacements);
      
      // Создаем записи о заменах
      for (const entry of replacementEntries) {
        await db.replacements.create({
          vacation_request_id: request.id,
          schedule_id: entry.schedule.id,
          original_teacher_id: request.user_id,
          replacement_teacher_id: entry.isCancelled ? null : entry.replacementTeacherId,
          class_date: entry.dateStr,
          is_cancelled: entry.isCancelled,
          cancellation_reason: entry.cancellationReason || null,
          status: entry.isCancelled ? 'cancelled' : (entry.replacementTeacherId ? 'pending' : 'pending')
        });
      }
      
      onComplete();
    } catch (error) {
      console.error('Error saving replacements:', error);
    } finally {
      setSaving(false);
    }
  };

  const allAssigned = Object.values(replacements).every(
    r => r.replacementTeacherId || r.isCancelled
  );

  const totalClasses = Object.keys(replacements).length;
  const assignedCount = Object.values(replacements).filter(r => r.replacementTeacherId).length;
  const cancelledCount = Object.values(replacements).filter(r => r.isCancelled).length;

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-12 h-12 border-4 border-sgu-blue/20 border-t-sgu-blue rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Загрузка расписания...</p>
      </div>
    );
  }

  if (totalClasses === 0) {
    return (
      <div className="p-8 text-center">
        <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">
          У преподавателя нет занятий в период отпуска
        </p>
        <button onClick={onComplete} className="btn-primary">
          Продолжить одобрение
        </button>
      </div>
    );
  }

  // Группируем по датам
  const groupedByDate = {};
  Object.entries(replacements).forEach(([key, value]) => {
    const dateKey = value.dateStr;
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push({ key, ...value });
  });

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      {/* Заголовок */}
      <div className="sticky top-0 bg-white z-10 pb-4 border-b mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Назначение замен для: {request.user?.full_name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {format(parseISO(request.start_date), 'd MMMM', { locale: ru })} — {format(parseISO(request.end_date), 'd MMMM yyyy', { locale: ru })}
        </p>
        
        {/* Прогресс */}
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="px-3 py-1 bg-gray-100 rounded-full">
            Всего занятий: <strong>{totalClasses}</strong>
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
            Назначено замен: <strong>{assignedCount}</strong>
          </span>
          <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full">
            Отменено: <strong>{cancelledCount}</strong>
          </span>
        </div>
      </div>

      {/* Список занятий по датам */}
      <div className="space-y-6">
        {Object.entries(groupedByDate).sort().map(([dateStr, classes]) => (
          <div key={dateStr}>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-sgu-blue text-white flex items-center justify-center text-sm">
                {dayNames[getDay(parseISO(dateStr))]}
              </span>
              {format(parseISO(dateStr), 'd MMMM yyyy', { locale: ru })}
            </h4>
            
            <div className="space-y-3">
              {classes.map(({ key, schedule, replacementTeacherId, isCancelled }) => (
                <div 
                  key={key}
                  className={`p-4 rounded-xl border-2 transition-colors ${
                    isCancelled 
                      ? 'bg-amber-50 border-amber-200' 
                      : replacementTeacherId 
                        ? 'bg-emerald-50 border-emerald-200' 
                        : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Информация о занятии */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-sgu-blue">
                          {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-sm">
                          {schedule.room}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">{schedule.subject}</p>
                      <p className="text-sm text-gray-500">Группа: {schedule.group_name}</p>
                    </div>

                    {/* Статус */}
                    <div className="text-right">
                      {isCancelled ? (
                        <div className="flex items-center gap-2 text-amber-600">
                          <ExclamationTriangleIcon className="w-5 h-5" />
                          <span className="font-medium">Отменено</span>
                        </div>
                      ) : replacementTeacherId ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckIcon className="w-5 h-5" />
                          <span className="font-medium">Замена назначена</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Не назначено</span>
                      )}
                    </div>
                  </div>

                  {/* Выбор замены или действия */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {isCancelled ? (
                      <button
                        onClick={() => handleUndoCancel(key)}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        ↩ Отменить отмену занятия
                      </button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-500 mr-2">Заменяющий:</span>
                        
                        {teachers.map(teacher => (
                          <button
                            key={teacher.id}
                            onClick={() => handleSelectReplacement(key, teacher.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              replacementTeacherId === teacher.id
                                ? 'bg-sgu-blue text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {teacher.full_name?.split(' ').slice(0, 2).join(' ')}
                          </button>
                        ))}
                        
                        <div className="w-px h-6 bg-gray-300 mx-2" />
                        
                        <button
                          onClick={() => handleCancelClass(key)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                        >
                          Отменить занятие
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Предупреждение об отработке */}
      {cancelledCount > 0 && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">
                {cancelledCount} {cancelledCount === 1 ? 'занятие будет отменено' : 'занятий будут отменены'}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Часы отмененных занятий будут добавлены в счет отработки преподавателя
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Кнопки */}
      <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t flex items-center justify-between">
        <button
          onClick={onCancel}
          className="btn-secondary"
        >
          Отмена
        </button>
        
        <button
          onClick={handleSave}
          disabled={!allAssigned || saving}
          className="btn-success disabled:opacity-50"
        >
          {saving ? 'Сохранение...' : `Сохранить и одобрить заявку`}
        </button>
      </div>
    </div>
  );
};

export default ReplacementSelector;