import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import { ru } from 'date-fns/locale';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  UserCircleIcon 
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../lib/supabase';
import { StatusBadge } from '../ui/StatusBadge';
import 'react-day-picker/dist/style.css';

export const VacationCalendar = () => {
  const { profile } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [profile]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      let data;
      
      if (profile?.role === 'admin') {
        data = await db.vacationRequests.getAll();
      } else if (profile?.role === 'head') {
        const allRequests = await db.vacationRequests.getAll();
        data = allRequests.filter(r => 
          r.user?.department?.id === profile.department_id
        );
      } else {
        data = await db.vacationRequests.getByUser(profile.id);
      }
      
      setRequests(data.filter(r => r.status !== 'rejected'));
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Создаем модификаторы для отображения отпусков в календаре
  const vacationDays = useMemo(() => {
    const days = {};
    
    requests.forEach(req => {
      let current = parseISO(req.start_date);
      const end = parseISO(req.end_date);
      
      while (current <= end) {
        const dateStr = format(current, 'yyyy-MM-dd');
        if (!days[dateStr]) {
          days[dateStr] = [];
        }
        days[dateStr].push(req);
        current = new Date(current.setDate(current.getDate() + 1));
      }
    });
    
    return days;
  }, [requests]);

  // Заявки на выбранную дату
  const selectedDateRequests = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return vacationDays[dateStr] || [];
  }, [selectedDate, vacationDays]);

  // Стили для дней с отпусками
  const modifiers = useMemo(() => {
    const approved = [];
    const pending = [];
    const approvedHead = [];

    Object.entries(vacationDays).forEach(([dateStr, reqs]) => {
      const date = parseISO(dateStr);
      const hasApproved = reqs.some(r => r.status === 'approved');
      const hasApprovedHead = reqs.some(r => r.status === 'approved_head');
      const hasPending = reqs.some(r => r.status === 'pending');

      if (hasApproved) approved.push(date);
      else if (hasApprovedHead) approvedHead.push(date);
      else if (hasPending) pending.push(date);
    });

    return { approved, pending, approvedHead };
  }, [vacationDays]);

  const modifiersStyles = {
    approved: {
      backgroundColor: '#10b981',
      color: 'white',
      borderRadius: '8px'
    },
    approvedHead: {
      backgroundColor: '#3b82f6',
      color: 'white',
      borderRadius: '8px'
    },
    pending: {
      backgroundColor: '#f59e0b',
      color: 'white',
      borderRadius: '8px'
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Календарь */}
      <div className="lg:col-span-2 card">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Календарь отпусков
        </h2>

        <div className="flex justify-center">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={ru}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="!font-sans"
            showOutsideDays
            fixedWeeks
          />
        </div>

        {/* Легенда */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span className="text-sm text-gray-600">Одобрено</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-sm text-gray-600">Одобрено завкафедрой</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-500" />
            <span className="text-sm text-gray-600">На рассмотрении</span>
          </div>
        </div>
      </div>

      {/* Список отпусков на выбранную дату */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-4 bg-gray-100 rounded-xl">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : selectedDateRequests.length > 0 ? (
          <div className="space-y-3">
            {selectedDateRequests.map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sgu-blue to-sgu-blue-light flex items-center justify-center text-white font-bold">
                    {req.user?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {req.user?.full_name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {req.user?.position}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={req.status} animate={false} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                  {format(parseISO(req.start_date), 'd MMM', { locale: ru })} — {' '}
                  {format(parseISO(req.end_date), 'd MMM', { locale: ru })}
                  <span className="ml-2 text-sgu-blue font-medium">
                    ({req.days_count} дн.)
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <UserCircleIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Нет отпусков на эту дату</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VacationCalendar;