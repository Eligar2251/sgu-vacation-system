import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import { format, addDays, startOfWeek, parseISO, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
    CalendarDaysIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ArrowPathIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    UserIcon,
    XMarkIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { db, supabase } from '../lib/supabase';
import { showToast } from '../components/ui/Toast';

const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const timeSlots = ['09:00', '10:45', '13:00', '14:45', '16:30', '18:15'];

const statusColors = {
    scheduled: 'bg-white border-gray-200',
    replaced: 'bg-blue-50 border-blue-300',
    cancelled: 'bg-red-50 border-red-300 opacity-60',
    rescheduled: 'bg-amber-50 border-amber-300'
};

const statusLabels = {
    scheduled: 'По расписанию',
    replaced: 'Замена',
    cancelled: 'Отменено',
    rescheduled: 'Перенесено'
};

export const SchedulePage = () => {
    const { profile } = useAuthStore();
    const isAdmin = profile?.role === 'admin';
    const isHead = profile?.role === 'head';
    const canViewAll = isAdmin || isHead; // Админ и завкаф видят всё
    const canEdit = isAdmin; // Только админ может редактировать

    const [activeTab, setActiveTab] = useState('weekly');
    const [currentWeekStart, setCurrentWeekStart] = useState(
        startOfWeek(new Date(), { weekStartsOn: 1 })
    );
    const [weeklySchedule, setWeeklySchedule] = useState([]);
    const [templateSchedule, setTemplateSchedule] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    const [editModal, setEditModal] = useState({ open: false, item: null });
    const [cancelModal, setCancelModal] = useState({ open: false, item: null });
    const [replaceModal, setReplaceModal] = useState({ open: false, item: null });
    const [subjectsModal, setSubjectsModal] = useState(false);

    const [formData, setFormData] = useState({
        teacher_id: '',
        department_id: '',
        day_of_week: 1,
        start_time: '09:00',
        end_time: '10:30',
        subject: '',
        room: '',
        group_name: ''
    });
    const [cancelReason, setCancelReason] = useState('');
    const [replacementTeacherId, setReplacementTeacherId] = useState('');

    useEffect(() => {
        loadStaticData();
    }, []);

    useEffect(() => {
        loadScheduleData();
    }, [currentWeekStart, activeTab, profile]);

    useEffect(() => {
        const channel = supabase
            .channel('schedule-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'weekly_schedule'
                },
                () => {
                    loadScheduleData();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'schedule'
                },
                () => {
                    loadScheduleData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile, currentWeekStart, activeTab]);

    const loadStaticData = async () => {
        try {
            const [teachersData, subjectsData, deptsData] = await Promise.all([
                db.profiles.getTeachers(),
                db.subjects.getAll(),
                db.departments.getAll()
            ]);
            setTeachers(teachersData || []);
            setSubjects(subjectsData || []);
            setDepartments(deptsData || []);
        } catch (error) {
            console.error('Error loading static data:', error);
        }
    };

    const loadScheduleData = async () => {
        if (!profile?.id) return;

        try {
            setLoading(true);

            const startStr = format(currentWeekStart, 'yyyy-MM-dd');
            const endStr = format(addDays(currentWeekStart, 5), 'yyyy-MM-dd');

            if (activeTab === 'weekly') {
                let data = [];

                if (canViewAll) {
                    // Админ и завкаф видят ВСЁ расписание
                    data = await db.weeklySchedule.getAll(startStr, endStr);
                } else {
                    // Преподаватель видит только свои занятия
                    data = await db.weeklySchedule.getByTeacher(profile.id, startStr, endStr);
                }

                setWeeklySchedule(data || []);
            } else if (activeTab === 'template') {
                let data = [];

                if (canViewAll) {
                    // Админ и завкаф видят ВСЁ расписание
                    data = await db.schedule.getAll();
                } else {
                    // Преподаватель видит только свои занятия
                    data = await db.schedule.getByTeacher(profile.id);
                }

                setTemplateSchedule(data || []);
            }
        } catch (error) {
            console.error('Error loading schedule:', error);
            showToast.error('Ошибка загрузки расписания');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateWeek = async () => {
        if (!canEdit) return;

        try {
            setGenerating(true);
            const startStr = format(currentWeekStart, 'yyyy-MM-dd');
            const endStr = format(addDays(currentWeekStart, 5), 'yyyy-MM-dd');

            console.log('Generating schedule for:', startStr, 'to', endStr);

            const count = await db.weeklySchedule.generate(startStr, endStr);

            if (count === 0) {
                showToast.info('Нет занятий в шаблоне для формирования расписания');
            } else {
                showToast.success(`Сформировано ${count} ${count === 1 ? 'занятие' : count < 5 ? 'занятия' : 'занятий'}`);
            }

            await loadScheduleData();
        } catch (error) {
            console.error('Error generating:', error);

            // Детальная обработка ошибок
            let errorMessage = 'Ошибка формирования расписания';

            if (error.message) {
                errorMessage = error.message;
            } else if (error.details) {
                errorMessage = error.details;
            } else if (error.hint) {
                errorMessage = error.hint;
            }

            showToast.error(errorMessage);
        } finally {
            setGenerating(false);
        }
    };

    const openEditModal = (item = null) => {
        if (!canEdit) return;

        setFormData({
            teacher_id: item?.teacher_id || '',
            department_id: item?.department_id || profile?.department_id || '',
            day_of_week: item?.day_of_week || 1,
            start_time: item?.start_time?.slice(0, 5) || '09:00',
            end_time: item?.end_time?.slice(0, 5) || '10:30',
            subject: item?.subject || '',
            room: item?.room || '',
            group_name: item?.group_name || ''
        });
        setEditModal({ open: true, item });
    };

    const handleSaveTemplate = async () => {
        if (!formData.teacher_id || !formData.subject || !formData.department_id) {
            showToast.error('Заполните обязательные поля');
            return;
        }

        try {
            if (editModal.item) {
                await db.schedule.update(editModal.item.id, formData);
                showToast.success('Занятие обновлено');
            } else {
                await db.schedule.create(formData);
                showToast.success('Занятие добавлено');
            }
            setEditModal({ open: false, item: null });
            await loadScheduleData();
        } catch (error) {
            showToast.error('Ошибка сохранения');
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!canEdit || !confirm('Удалить занятие?')) return;

        try {
            await db.schedule.delete(id);
            showToast.success('Занятие удалено');
            await loadScheduleData();
        } catch (error) {
            showToast.error('Ошибка удаления');
        }
    };

    const handleCancelClass = async () => {
        if (!cancelModal.item) return;
        try {
            await db.weeklySchedule.cancel(cancelModal.item.id, cancelReason || 'Отменено администратором');
            showToast.success('Занятие отменено');
            setCancelModal({ open: false, item: null });
            setCancelReason('');
            await loadScheduleData();
        } catch (error) {
            showToast.error('Ошибка');
        }
    };

    const handleSetReplacement = async () => {
        if (!replaceModal.item || !replacementTeacherId) return;
        try {
            await db.weeklySchedule.setReplacement(replaceModal.item.id, replacementTeacherId);
            showToast.success('Замена назначена');
            setReplaceModal({ open: false, item: null });
            setReplacementTeacherId('');
            await loadScheduleData();
        } catch (error) {
            showToast.error('Ошибка');
        }
    };

    const prevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
    const nextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
    const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

    // Группировка по дням
    const scheduleByDay = {};
    weeklySchedule.forEach(item => {
        const key = item.schedule_date;
        if (!scheduleByDay[key]) scheduleByDay[key] = [];
        scheduleByDay[key].push(item);
    });

    const templateByDay = {};
    templateSchedule.forEach(item => {
        if (!templateByDay[item.day_of_week]) templateByDay[item.day_of_week] = [];
        templateByDay[item.day_of_week].push(item);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <CalendarDaysIcon className="w-8 h-8 text-sgu-blue" />
                        Расписание занятий
                    </h1>
                    <p className="text-gray-500">
                        {isAdmin ? 'Управление расписанием' :
                            isHead ? 'Просмотр полного расписания' : 'Ваше расписание'}
                    </p>
                </div>

                {canEdit && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSubjectsModal(true)} className="btn-secondary !py-2 !px-4">
                            Предметы
                        </button>
                        {activeTab === 'template' && (
                            <button onClick={() => openEditModal()} className="btn-primary !py-2 !px-4">
                                <PlusIcon className="w-5 h-5 mr-1" />
                                Добавить
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b">
                <button
                    onClick={() => setActiveTab('weekly')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'weekly'
                        ? 'border-sgu-blue text-sgu-blue'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Расписание на неделю
                </button>
                <button
                    onClick={() => setActiveTab('template')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'template'
                        ? 'border-sgu-blue text-sgu-blue'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {canEdit ? 'Шаблон расписания' : 'Базовое расписание'}
                </button>
            </div>

            {/* ========== WEEKLY TAB ========== */}
            {activeTab === 'weekly' && (
                <>
                    <div className="card">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                                <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <ChevronRightIcon className="w-5 h-5" />
                                </button>
                                <button onClick={goToToday} className="px-3 py-1 text-sm text-sgu-blue hover:bg-sgu-blue/10 rounded-lg">
                                    Сегодня
                                </button>
                            </div>

                            <h2 className="text-lg font-semibold text-gray-900">
                                {format(currentWeekStart, 'd MMM', { locale: ru })} — {format(addDays(currentWeekStart, 5), 'd MMM yyyy', { locale: ru })}
                            </h2>

                            {canEdit && (
                                <button
                                    onClick={handleGenerateWeek}
                                    disabled={generating}
                                    className="btn-primary !py-2 !px-4"
                                >
                                    {generating ? (
                                        <><ArrowPathIcon className="w-5 h-5 mr-1 animate-spin" />Формирование...</>
                                    ) : (
                                        <><ArrowPathIcon className="w-5 h-5 mr-1" />Сформировать</>
                                    )}
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-white border-2 border-gray-200" />
                                <span className="text-gray-600">По расписанию</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300" />
                                <span className="text-gray-600">Замена</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300" />
                                <span className="text-gray-600">Отменено</span>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="card animate-pulse">
                                    <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                                    <div className="space-y-3">
                                        <div className="h-20 bg-gray-100 rounded" />
                                        <div className="h-20 bg-gray-100 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : weeklySchedule.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[0, 1, 2, 3, 4, 5].map(dayOffset => {
                                const date = addDays(currentWeekStart, dayOffset);
                                const dateStr = format(date, 'yyyy-MM-dd');
                                const daySchedule = scheduleByDay[dateStr] || [];
                                const isCurrentDay = isToday(date);

                                return (
                                    <motion.div
                                        key={dateStr}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: dayOffset * 0.05 }}
                                        className={`card ${isCurrentDay ? 'ring-2 ring-sgu-blue' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{dayNames[dayOffset]}</h3>
                                                <p className="text-sm text-gray-500">{format(date, 'd MMMM', { locale: ru })}</p>
                                            </div>
                                            {isCurrentDay && (
                                                <span className="px-2 py-1 bg-sgu-blue text-white text-xs rounded-full">Сегодня</span>
                                            )}
                                        </div>

                                        {daySchedule.length > 0 ? (
                                            <div className="space-y-3">
                                                {daySchedule.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(item => {
                                                    const isMyReplacement = item.replacement_teacher_id === profile?.id;
                                                    const isMyClass = item.teacher_id === profile?.id;

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className={`p-3 rounded-xl border-2 ${statusColors[item.status]} ${isMyReplacement ? 'ring-2 ring-purple-400' : ''
                                                                } ${isMyClass && !isAdmin ? 'ring-2 ring-sgu-blue' : ''}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                        <span className="text-sm font-bold text-sgu-blue">
                                                                            {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                                                                        </span>
                                                                        {item.status !== 'scheduled' && (
                                                                            <span className={`text-xs px-1.5 py-0.5 rounded ${item.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                                item.status === 'replaced' ? 'bg-blue-100 text-blue-700' :
                                                                                    'bg-amber-100 text-amber-700'
                                                                                }`}>
                                                                                {statusLabels[item.status]}
                                                                            </span>
                                                                        )}
                                                                        {isMyReplacement && (
                                                                            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                                                                                Вы заменяете
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className={`font-medium text-gray-900 ${item.status === 'cancelled' ? 'line-through' : ''}`}>
                                                                        {item.subject}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        {item.room && `Ауд. ${item.room}`} {item.group_name && `• ${item.group_name}`}
                                                                    </p>

                                                                    <div className="mt-2 text-sm">
                                                                        {item.status === 'replaced' && item.replacementTeacher ? (
                                                                            <div className="flex items-center gap-1 text-blue-600">
                                                                                <UserIcon className="w-4 h-4" />
                                                                                <span className="line-through text-gray-400 mr-1">
                                                                                    {item.teacher?.full_name?.split(' ').slice(0, 2).join(' ')}
                                                                                </span>
                                                                                → {item.replacementTeacher.full_name?.split(' ').slice(0, 2).join(' ')}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-1 text-gray-600">
                                                                                <UserIcon className="w-4 h-4" />
                                                                                {item.teacher?.full_name?.split(' ').slice(0, 2).join(' ')}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {item.cancellation_reason && (
                                                                        <p className="text-xs text-red-600 mt-1 italic">{item.cancellation_reason}</p>
                                                                    )}
                                                                </div>

                                                                {/* Кнопки редактирования только для админа */}
                                                                {canEdit && item.status === 'scheduled' && (
                                                                    <div className="flex flex-col gap-1">
                                                                        <button
                                                                            onClick={() => setReplaceModal({ open: true, item })}
                                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                                            title="Назначить замену"
                                                                        >
                                                                            <UserIcon className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setCancelModal({ open: true, item })}
                                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                                            title="Отменить"
                                                                        >
                                                                            <XMarkIcon className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400">
                                                <ClockIcon className="w-8 h-8 mx-auto mb-2" />
                                                <p className="text-sm">Нет занятий</p>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card text-center py-16">
                            <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Расписание не сформировано
                            </h3>
                            <p className="text-gray-500 mb-4">
                                {canEdit
                                    ? 'Нажмите "Сформировать" для создания расписания'
                                    : 'Администратор ещё не сформировал расписание на эту неделю'}
                            </p>
                            {canEdit && (
                                <button onClick={handleGenerateWeek} className="btn-primary">
                                    <ArrowPathIcon className="w-5 h-5 mr-2" />
                                    Сформировать
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ========== TEMPLATE TAB ========== */}
            {activeTab === 'template' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="card animate-pulse">
                                <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                                <div className="space-y-3">
                                    <div className="h-16 bg-gray-100 rounded" />
                                    <div className="h-16 bg-gray-100 rounded" />
                                </div>
                            </div>
                        ))
                    ) : (
                        [1, 2, 3, 4, 5, 6].map(dayNum => {
                            const daySchedule = templateByDay[dayNum] || [];

                            return (
                                <motion.div
                                    key={dayNum}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (dayNum - 1) * 0.05 }}
                                    className="card"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-semibold text-gray-900">{dayNames[dayNum - 1]}</h3>
                                        <span className="text-sm text-gray-400">{daySchedule.length}</span>
                                    </div>

                                    {daySchedule.length > 0 ? (
                                        <div className="space-y-3">
                                            {daySchedule.sort((a, b) => a.start_time.localeCompare(b.start_time)).map(item => {
                                                const isMyClass = item.teacher_id === profile?.id;

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className={`p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors ${isMyClass && !isAdmin ? 'ring-2 ring-sgu-blue' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-sm font-bold text-sgu-blue">
                                                                        {item.start_time?.slice(0, 5)} - {item.end_time?.slice(0, 5)}
                                                                    </span>
                                                                    {item.room && (
                                                                        <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">{item.room}</span>
                                                                    )}
                                                                </div>
                                                                <p className="font-medium text-gray-900">{item.subject}</p>
                                                                <p className="text-sm text-gray-500">{item.group_name}</p>
                                                                <p className="text-sm text-sgu-blue mt-1">
                                                                    {item.teacher?.full_name?.split(' ').slice(0, 2).join(' ')}
                                                                </p>
                                                            </div>

                                                            {/* Кнопки редактирования только для админа */}
                                                            {canEdit && (
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => openEditModal(item)}
                                                                        className="p-1.5 text-gray-400 hover:text-sgu-blue rounded"
                                                                    >
                                                                        <PencilSquareIcon className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteTemplate(item.id)}
                                                                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                                                                    >
                                                                        <TrashIcon className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <p className="text-sm">Нет занятий</p>
                                            {canEdit && (
                                                <button
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, day_of_week: dayNum }));
                                                        openEditModal();
                                                    }}
                                                    className="mt-2 text-sgu-blue hover:underline text-sm"
                                                >
                                                    + Добавить
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}

            {/* ========== МОДАЛКИ ========== */}

            {/* Edit Template */}
            <Dialog open={editModal.open} onClose={() => setEditModal({ open: false, item: null })} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl">
                        <Dialog.Title className="text-xl font-bold text-gray-900 mb-6">
                            {editModal.item ? 'Редактирование' : 'Новое занятие'}
                        </Dialog.Title>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">День *</label>
                                    <select value={formData.day_of_week} onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })} className="input-field">
                                        {dayNames.map((d, i) => <option key={i + 1} value={i + 1}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Кафедра *</label>
                                    <select value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} className="input-field">
                                        <option value="">Выберите...</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Преподаватель *</label>
                                <select value={formData.teacher_id} onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })} className="input-field">
                                    <option value="">Выберите...</option>
                                    {teachers.filter(t => !formData.department_id || t.department_id === formData.department_id).map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Предмет *</label>
                                <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="input-field" placeholder="Программирование" list="subjects-list" />
                                <datalist id="subjects-list">
                                    {subjects.map(s => <option key={s.id} value={s.name} />)}
                                </datalist>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Начало</label>
                                    <select value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="input-field">
                                        {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Окончание</label>
                                    <input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="input-field" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Аудитория</label>
                                    <input type="text" value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} className="input-field" placeholder="А-301" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Группа</label>
                                    <input type="text" value={formData.group_name} onChange={(e) => setFormData({ ...formData, group_name: e.target.value })} className="input-field" placeholder="ИТ-21" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setEditModal({ open: false, item: null })} className="btn-secondary flex-1">Отмена</button>
                            <button onClick={handleSaveTemplate} className="btn-primary flex-1">Сохранить</button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Cancel */}
            <Dialog open={cancelModal.open} onClose={() => setCancelModal({ open: false, item: null })} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
                        <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">Отменить занятие</Dialog.Title>
                        <div className="p-4 bg-gray-50 rounded-xl mb-4">
                            <p className="font-medium">{cancelModal.item?.subject}</p>
                            <p className="text-sm text-gray-500">
                                {cancelModal.item?.schedule_date && format(parseISO(cancelModal.item.schedule_date), 'd MMMM yyyy', { locale: ru })}
                            </p>
                        </div>
                        <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Причина отмены..." className="input-field resize-none mb-4" rows={2} />
                        <div className="flex gap-3">
                            <button onClick={() => setCancelModal({ open: false, item: null })} className="btn-secondary flex-1">Отмена</button>
                            <button onClick={handleCancelClass} className="btn-danger flex-1">Отменить занятие</button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Replace */}
            <Dialog open={replaceModal.open} onClose={() => setReplaceModal({ open: false, item: null })} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
                        <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">Назначить замену</Dialog.Title>
                        <div className="p-4 bg-gray-50 rounded-xl mb-4">
                            <p className="font-medium">{replaceModal.item?.subject}</p>
                            <p className="text-sm text-gray-500">
                                {replaceModal.item?.schedule_date && format(parseISO(replaceModal.item.schedule_date), 'd MMMM', { locale: ru })}
                                {' • '}{replaceModal.item?.start_time?.slice(0, 5)}
                                {' • '}{replaceModal.item?.teacher?.full_name}
                            </p>
                        </div>
                        <select value={replacementTeacherId} onChange={(e) => setReplacementTeacherId(e.target.value)} className="input-field mb-4">
                            <option value="">Выберите преподавателя...</option>
                            {teachers.filter(t => t.id !== replaceModal.item?.teacher_id).map(t => (
                                <option key={t.id} value={t.id}>{t.full_name}</option>
                            ))}
                        </select>
                        <div className="flex gap-3">
                            <button onClick={() => setReplaceModal({ open: false, item: null })} className="btn-secondary flex-1">Отмена</button>
                            <button onClick={handleSetReplacement} disabled={!replacementTeacherId} className="btn-primary flex-1 disabled:opacity-50">Назначить</button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Subjects */}
            <SubjectsModal open={subjectsModal} onClose={() => setSubjectsModal(false)} subjects={subjects} departments={departments} onRefresh={loadStaticData} />
        </div>
    );
};

const SubjectsModal = ({ open, onClose, subjects, departments, onRefresh }) => {
    const [form, setForm] = useState({ name: '', short_name: '', department_id: '', hours_per_week: 2, subject_type: 'lecture' });
    const [editingId, setEditingId] = useState(null);

    const handleSave = async () => {
        if (!form.name || !form.department_id) { showToast.error('Заполните поля'); return; }
        try {
            if (editingId) {
                await db.subjects.update(editingId, form);
            } else {
                await db.subjects.create(form);
            }
            showToast.success('Сохранено');
            setForm({ name: '', short_name: '', department_id: '', hours_per_week: 2, subject_type: 'lecture' });
            setEditingId(null);
            onRefresh();
        } catch (e) { showToast.error('Ошибка'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Удалить?')) return;
        try { await db.subjects.delete(id); showToast.success('Удалено'); onRefresh(); } catch (e) { showToast.error('Ошибка'); }
    };

    return (
        <Dialog open={open} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-xl max-h-[80vh] flex flex-col">
                    <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">Предметы</Dialog.Title>
                    <div className="p-4 bg-gray-50 rounded-xl mb-4">
                        <div className="grid grid-cols-2 gap-3">
                            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Название *" className="input-field !py-2" />
                            <input value={form.short_name} onChange={(e) => setForm({ ...form, short_name: e.target.value })} placeholder="Сокращение" className="input-field !py-2" />
                            <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="input-field !py-2">
                                <option value="">Кафедра *</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <select value={form.subject_type} onChange={(e) => setForm({ ...form, subject_type: e.target.value })} className="input-field !py-2">
                                <option value="lecture">Лекция</option>
                                <option value="practice">Практика</option>
                                <option value="lab">Лабораторная</option>
                                <option value="seminar">Семинар</option>
                            </select>
                        </div>
                        <button onClick={handleSave} className="btn-primary !py-2 mt-3 w-full">
                            {editingId ? 'Сохранить' : 'Добавить'}
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {subjects.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium">{s.name}{s.short_name && ` (${s.short_name})`}</p>
                                    <p className="text-sm text-gray-500">{s.department?.name}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => { setEditingId(s.id); setForm({ name: s.name, short_name: s.short_name || '', department_id: s.department_id || '', hours_per_week: s.hours_per_week, subject_type: s.subject_type }); }} className="p-2 text-gray-400 hover:text-sgu-blue rounded">
                                        <PencilSquareIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-600 rounded">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {subjects.length === 0 && <p className="text-center text-gray-500 py-8">Нет предметов</p>}
                    </div>
                    <button onClick={onClose} className="btn-secondary mt-4">Закрыть</button>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default SchedulePage;