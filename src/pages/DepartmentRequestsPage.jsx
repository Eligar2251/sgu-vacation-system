import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import {
  UsersIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UserIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { format, parseISO, eachDayOfInterval, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuthStore } from '../store/authStore';
import { useVacationStore } from '../store/vacationStore';
import { VacationRequestCard } from '../components/vacation/VacationRequestCard';
import { SkeletonCard } from '../components/ui/LoadingSpinner';
import { showToast } from '../components/ui/Toast';
import { db } from '../lib/supabase';

const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export const DepartmentRequestsPage = () => {
  const { profile } = useAuthStore();
  const { departmentRequests, fetchDepartmentRequests, approveByHead, rejectRequest, loading } = useVacationStore();
  const [filter, setFilter] = useState('pending');
  
  const [commentModal, setCommentModal] = useState({ open: false, requestId: null, action: null });
  const [comment, setComment] = useState('');
  
  const [replacementModal, setReplacementModal] = useState({ open: false, request: null });
  const [schedule, setSchedule] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [teachersWorkload, setTeachersWorkload] = useState({});
  const [replacements, setReplacements] = useState({});
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [savingReplacements, setSavingReplacements] = useState(false);
  const [autoDistributing, setAutoDistributing] = useState(false);

  useEffect(() => {
    if (profile?.department_id) {
      fetchDepartmentRequests(profile.department_id);
    }
  }, [profile]);

  const filteredRequests = departmentRequests.filter(req => {
    if (req.user_id === profile?.id) return false;
    
    if (filter === 'pending') return req.status === 'pending';
    if (filter === 'processed') return req.status !== 'pending';
    return true;
  });

  const loadReplacementData = async (request) => {
    try {
      setLoadingSchedule(true);
      
      const scheduleData = await db.schedule.getByTeacher(request.user_id);
      const teachersData = await db.profiles.getByDepartment(request.user?.department_id || profile?.department_id);
      
      const availableTeachers = (teachersData || []).filter(t => 
        t.id !== request.user_id && (t.role === 'teacher' || t.role === 'head')
      );
      
      const allSchedule = await db.schedule.getByDepartment(request.user?.department_id || profile?.department_id);
      
      const workload = {};
      availableTeachers.forEach(teacher => {
        const teacherLessons = (allSchedule || []).filter(s => s.teacher_id === teacher.id);
        workload[teacher.id] = {
          totalLessons: teacherLessons.length,
          byDay: {}
        };
        
        teacherLessons.forEach(lesson => {
          if (!workload[teacher.id].byDay[lesson.day_of_week]) {
            workload[teacher.id].byDay[lesson.day_of_week] = [];
          }
          workload[teacher.id].byDay[lesson.day_of_week].push(lesson);
        });
      });
      
      setSchedule(scheduleData || []);
      setTeachers(availableTeachers);
      setTeachersWorkload(workload);
      initReplacements(scheduleData || [], request.start_date, request.end_date);
    } catch (error) {
      console.error('Error loading replacement data:', error);
      showToast.error('Ошибка загрузки расписания');
    } finally {
      setLoadingSchedule(false);
    }
  };

  const initReplacements = (scheduleData, startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = eachDayOfInterval({ start, end });
    
    const replacementMap = {};
    
    days.forEach(date => {
      const dayOfWeek = getDay(date) === 0 ? 7 : getDay(date);
      
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

  const handleAutoDistribute = () => {
    setAutoDistributing(true);
    
    try {
      const newReplacements = { ...replacements };
      
      const currentWorkload = {};
      teachers.forEach(teacher => {
        currentWorkload[teacher.id] = teachersWorkload[teacher.id]?.totalLessons || 0;
      });
      
      const sortedEntries = Object.entries(newReplacements).sort((a, b) => {
        const dateCompare = a[1].dateStr.localeCompare(b[1].dateStr);
        if (dateCompare !== 0) return dateCompare;
        return (a[1].schedule.start_time || '').localeCompare(b[1].schedule.start_time || '');
      });
      
      for (const [key, entry] of sortedEntries) {
        if (entry.isCancelled) continue;
        
        const dayOfWeek = getDay(entry.date) === 0 ? 7 : getDay(entry.date);
        const lessonTime = entry.schedule.start_time;
        
        const availableForLesson = teachers.filter(teacher => {
          const teacherDayLessons = teachersWorkload[teacher.id]?.byDay[dayOfWeek] || [];
          const hasConflict = teacherDayLessons.some(lesson => 
            lesson.start_time === lessonTime
          );
          return !hasConflict;
        });
        
        if (availableForLesson.length > 0) {
          availableForLesson.sort((a, b) => {
            return (currentWorkload[a.id] || 0) - (currentWorkload[b.id] || 0);
          });
          
          const selectedTeacher = availableForLesson[0];
          newReplacements[key] = {
            ...entry,
            replacementTeacherId: selectedTeacher.id,
            isCancelled: false
          };
          
          currentWorkload[selectedTeacher.id] = (currentWorkload[selectedTeacher.id] || 0) + 1;
        } else {
          newReplacements[key] = {
            ...entry,
            replacementTeacherId: null,
            isCancelled: true,
            cancellationReason: 'Нет свободных преподавателей для замены'
          };
        }
      }
      
      setReplacements(newReplacements);
      showToast.success('Автораспределение выполнено');
    } catch (error) {
      console.error('Error in auto distribution:', error);
      showToast.error('Ошибка автораспределения');
    } finally {
      setAutoDistributing(false);
    }
  };

  const handleApprove = async (requestId) => {
    const request = departmentRequests.find(r => r.id === requestId);
    if (!request) return;

    await loadReplacementData(request);
    setReplacementModal({ open: true, request });
  };

  const handleReject = (requestId) => {
    setCommentModal({ open: true, requestId, action: 'reject' });
  };

  const handleSelectReplacement = (key, teacherId) => {
    setReplacements(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        replacementTeacherId: teacherId,
        isCancelled: false,
        cancellationReason: ''
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

  const confirmApproveWithReplacements = async () => {
    const { request } = replacementModal;
    if (!request) return;

    setSavingReplacements(true);
    
    try {
      const replacementEntries = Object.values(replacements);
      
      // Создаем записи о заменах
      if (replacementEntries.length > 0) {
        for (const entry of replacementEntries) {
          try {
            // Используем правильную структуру таблицы
            const { error } = await db.supabase
              .from('teacher_replacements')
              .insert({
                vacation_request_id: request.id,
                schedule_id: entry.schedule.id,
                original_teacher_id: request.user_id,
                replacement_teacher_id: entry.isCancelled ? null : entry.replacementTeacherId,
                class_date: entry.dateStr,
                is_cancelled: entry.isCancelled,
                cancellation_reason: entry.cancellationReason || null,
                status: entry.isCancelled ? 'cancelled' : 'pending', // pending - пока не одобрено админом
                created_by: profile.id
              });
            
            if (error) {
              console.warn('Error creating replacement entry:', error);
            }
          } catch (replError) {
            console.warn('Error creating replacement entry:', replError);
          }
        }
      }
      
      // Одобряем заявку завкафом (БЕЗ списания дней)
      const result = await approveByHead(request.id, profile.id, comment || null);
      
      if (result.success) {
        showToast.success('Заявка одобрена и передана в отдел кадров');
        closeReplacementModal();
        await fetchDepartmentRequests(profile.department_id);
      } else {
        showToast.error(result.error || 'Ошибка одобрения заявки');
      }
    } catch (error) {
      console.error('Error saving replacements:', error);
      showToast.error('Ошибка сохранения: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setSavingReplacements(false);
    }
  };

  const confirmApproveWithoutReplacements = async () => {
    const { request } = replacementModal;
    if (!request) return;

    setSavingReplacements(true);
    
    try {
      const result = await approveByHead(request.id, profile.id, comment || null);
      
      if (result.success) {
        showToast.success('Заявка одобрена и передана в отдел кадров');
        closeReplacementModal();
        await fetchDepartmentRequests(profile.department_id);
      } else {
        showToast.error(result.error || 'Ошибка одобрения заявки');
      }
    } catch (error) {
      console.error('Error approving:', error);
      showToast.error('Ошибка одобрения: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setSavingReplacements(false);
    }
  };

  const confirmReject = async () => {
    const { requestId } = commentModal;
    
    if (!comment.trim()) {
      showToast.error('Укажите причину отклонения');
      return;
    }

    const result = await rejectRequest(requestId, comment);
    
    if (result.success) {
      showToast.success('Заявка отклонена');
    } else {
      showToast.error(result.error || 'Произошла ошибка');
    }

    setCommentModal({ open: false, requestId: null, action: null });
    setComment('');
    fetchDepartmentRequests(profile.department_id);
  };

  const closeReplacementModal = () => {
    setReplacementModal({ open: false, request: null });
    setReplacements({});
    setComment('');
    setTeachers([]);
    setTeachersWorkload({});
    setSchedule([]);
  };

  const pendingCount = departmentRequests.filter(r => r.status === 'pending' && r.user_id !== profile?.id).length;
  
  const totalClasses = Object.keys(replacements).length;
  const assignedCount = Object.values(replacements).filter(r => r.replacementTeacherId).length;
  const cancelledCount = Object.values(replacements).filter(r => r.isCancelled).length;
  const allAssigned = totalClasses === 0 || Object.values(replacements).every(r => r.replacementTeacherId || r.isCancelled);

  const groupedByDate = {};
  Object.entries(replacements).forEach(([key, value]) => {
    const dateKey = value.dateStr;
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push({ key, ...value });
  });

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.full_name?.split(' ').slice(0, 2).join(' ') || 'Неизвестно';
  };

  const getTeacherWorkloadInfo = (teacherId) => {
    const workload = teachersWorkload[teacherId];
    if (!workload) return '';
    return `(${workload.totalLessons} ур.)`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-sgu-blue" />
            Заявки сотрудников кафедры
          </h1>
          <p className="text-gray-500">{profile?.department?.name}</p>
        </div>

        {pendingCount > 0 && (
          <div className="px-4 py-2 bg-amber-100 text-amber-800 rounded-xl font-medium">
            {pendingCount} {pendingCount === 1 ? 'заявка ожидает' : 'заявок ожидают'} рассмотрения
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            filter === 'pending'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Ожидающие
        </button>
        <button
          onClick={() => setFilter('processed')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            filter === 'processed'
              ? 'bg-sgu-blue text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Обработанные
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            filter === 'all'
              ? 'bg-gray-700 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Все
        </button>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <VacationRequestCard
              key={request.id}
              request={request}
              showActions={request.status === 'pending'}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === 'pending' ? 'Нет заявок на рассмотрении' : 'Заявок не найдено'}
          </h3>
          <p className="text-gray-500">
            {filter === 'pending' 
              ? 'Все заявки сотрудников кафедры обработаны'
              : 'Нет заявок по выбранному фильтру'}
          </p>
        </div>
      )}

      {/* Reject Modal */}
      <Dialog
        open={commentModal.open}
        onClose={() => setCommentModal({ open: false, requestId: null, action: null })}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              Отклонить заявку
            </Dialog.Title>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Причина отклонения <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Укажите причину отклонения заявки"
                className="input-field resize-none"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCommentModal({ open: false, requestId: null, action: null });
                  setComment('');
                }}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button
                onClick={confirmReject}
                disabled={!comment.trim()}
                className="btn-danger flex-1 disabled:opacity-50"
              >
                Отклонить
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Replacement Modal */}
      <Dialog
        open={replacementModal.open}
        onClose={closeReplacementModal}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-4xl bg-white rounded-2xl p-6 shadow-xl max-h-[90vh] flex flex-col">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-2">
              Одобрение заявки на отпуск
            </Dialog.Title>
            
            {replacementModal.request && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sgu-blue/10 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-sgu-blue" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{replacementModal.request.user?.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {format(parseISO(replacementModal.request.start_date), 'd MMMM', { locale: ru })} — {format(parseISO(replacementModal.request.end_date), 'd MMMM yyyy', { locale: ru })}
                      {' • '}{replacementModal.request.days_count} дн.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loadingSchedule ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-sgu-blue/20 border-t-sgu-blue rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Загрузка расписания...</p>
                </div>
              </div>
            ) : totalClasses === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-8">
                <CalendarDaysIcon className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-6 text-center">
                  У преподавателя нет занятий в период отпуска.<br />
                  Замены назначать не требуется.
                </p>
                
                <div className="w-full max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Комментарий (необязательно)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Комментарий к одобрению"
                    className="input-field resize-none mb-4"
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={closeReplacementModal} className="btn-secondary">
                    Отмена
                  </button>
                  <button
                    onClick={confirmApproveWithoutReplacements}
                    disabled={savingReplacements}
                    className="btn-success"
                  >
                    {savingReplacements ? (
                      <><ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />Сохранение...</>
                    ) : 'Одобрить заявку'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Прогресс и автораспределение */}
                <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                  <div className="flex items-center gap-3 text-sm flex-wrap">
                    <span className="px-3 py-1 bg-gray-100 rounded-full">
                      Всего: <strong>{totalClasses}</strong>
                    </span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                      Назначено: <strong>{assignedCount}</strong>
                    </span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full">
                      Отменено: <strong>{cancelledCount}</strong>
                    </span>
                  </div>
                  
                  <button
                    onClick={handleAutoDistribute}
                    disabled={autoDistributing}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {autoDistributing ? (
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      <SparklesIcon className="w-5 h-5" />
                    )}
                    Автораспределение
                  </button>
                </div>

                {/* Список занятий */}
                <div className="flex-1 overflow-y-auto space-y-6 mb-4">
                  {Object.entries(groupedByDate).sort().map(([dateStr, classes]) => (
                    <div key={dateStr}>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 sticky top-0 bg-white py-2 z-10">
                        <span className="w-8 h-8 rounded-lg bg-sgu-blue text-white flex items-center justify-center text-sm">
                          {dayNames[getDay(parseISO(dateStr))]}
                        </span>
                        {format(parseISO(dateStr), 'd MMMM yyyy', { locale: ru })}
                        <span className="text-sm font-normal text-gray-400">
                          ({classes.length} зан.)
                        </span>
                      </h4>
                      
                      <div className="space-y-3">
                        {classes.sort((a, b) => (a.schedule.start_time || '').localeCompare(b.schedule.start_time || '')).map(({ key, schedule, replacementTeacherId, isCancelled }) => (
                          <div 
                            key={key}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              isCancelled 
                                ? 'bg-amber-50 border-amber-200' 
                                : replacementTeacherId 
                                  ? 'bg-emerald-50 border-emerald-200' 
                                  : 'bg-white border-gray-200 border-dashed'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                  <span className="text-lg font-bold text-sgu-blue">
                                    {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
                                  </span>
                                  {schedule.room && (
                                    <span className="px-2 py-0.5 bg-gray-100 rounded text-sm">
                                      Ауд. {schedule.room}
                                    </span>
                                  )}
                                </div>
                                <p className="font-medium text-gray-900">{schedule.subject}</p>
                                {schedule.group_name && (
                                  <p className="text-sm text-gray-500">Группа: {schedule.group_name}</p>
                                )}
                              </div>

                              <div className="text-right">
                                {isCancelled ? (
                                  <div className="flex items-center gap-2 text-amber-600">
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                    <span className="font-medium">Отменено</span>
                                  </div>
                                ) : replacementTeacherId ? (
                                  <div className="text-right">
                                    <div className="flex items-center gap-2 text-emerald-600">
                                      <CheckIcon className="w-5 h-5" />
                                      <span className="font-medium">Замена</span>
                                    </div>
                                    <p className="text-sm text-emerald-700 mt-1">
                                      {getTeacherName(replacementTeacherId)}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-red-500 font-medium">Не назначено</span>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                              {isCancelled ? (
                                <button
                                  onClick={() => handleUndoCancel(key)}
                                  className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                                >
                                  ↩ Вернуть занятие
                                </button>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm text-gray-500">Заменяющий:</span>
                                  
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
                                      <span className="ml-1 opacity-60">{getTeacherWorkloadInfo(teacher.id)}</span>
                                    </button>
                                  ))}
                                  
                                  <div className="w-px h-6 bg-gray-300 mx-1" />
                                  
                                  <button
                                    onClick={() => handleCancelClass(key)}
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                                  >
                                    Отменить
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

                {/* Предупреждение */}
                {cancelledCount > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 flex-shrink-0" />
                      <p className="font-medium text-amber-800">
                        {cancelledCount} {cancelledCount === 1 ? 'занятие будет отменено' : 'занятий будут отменены'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Комментарий */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Комментарий (необязательно)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Комментарий к одобрению"
                    className="input-field resize-none"
                    rows={2}
                  />
                </div>

                {/* Кнопки */}
                <div className="flex items-center justify-between pt-4 border-t gap-4">
                  <button onClick={closeReplacementModal} className="btn-secondary">Отмена</button>
                  
                  <div className="flex items-center gap-3">
                    {!allAssigned && (
                      <span className="text-sm text-red-500">Назначьте замены для всех занятий</span>
                    )}
                    <button
                      onClick={confirmApproveWithReplacements}
                      disabled={!allAssigned || savingReplacements}
                      className="btn-success disabled:opacity-50"
                    >
                      {savingReplacements ? (
                        <><ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />Сохранение...</>
                      ) : (
                        <><CheckIcon className="w-5 h-5 mr-2" />Сохранить и одобрить</>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default DepartmentRequestsPage;