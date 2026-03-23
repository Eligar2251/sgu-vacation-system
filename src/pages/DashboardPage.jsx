import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  CalendarDaysIcon,
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowRightIcon,
  SunIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useVacationStore } from '../store/vacationStore';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SkeletonCard } from '../components/ui/LoadingSpinner';

export const DashboardPage = () => {
  const { profile } = useAuthStore();
  const { requests, fetchUserRequests, loading } = useVacationStore();

  useEffect(() => {
    if (profile?.id) {
      fetchUserRequests(profile.id);
    }
  }, [profile]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const remainingDays = (profile?.total_vacation_days || 0) - (profile?.used_vacation_days || 0);
  const usedPercent = ((profile?.used_vacation_days || 0) / (profile?.total_vacation_days || 1)) * 100;

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approvedHead: requests.filter(r => r.status === 'approved_head').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  const recentRequests = requests.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card bg-gradient-to-r from-sgu-blue to-sgu-blue-light text-white overflow-hidden relative"
      >
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-white/80 mb-2">
                <SunIcon className="w-5 h-5" />
                <span>{getGreeting()}</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {profile?.full_name?.split(' ')[0] || 'Пользователь'}!
              </h1>
              <p className="text-white/80">
                {profile?.position} • {profile?.department?.name}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-white/60 text-sm">Сегодня</p>
              <p className="text-2xl font-semibold">
                {format(new Date(), 'd MMMM', { locale: ru })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Remaining Days */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{remainingDays}</span>
          </div>
          <p className="text-gray-600 font-medium">Доступно дней</p>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              style={{ width: `${100 - usedPercent}%` }}
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Использовано {profile?.used_vacation_days || 0} из {profile?.total_vacation_days || 0}
          </p>
        </motion.div>

        {/* Pending */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.pending + stats.approvedHead}</span>
          </div>
          <p className="text-gray-600 font-medium">На рассмотрении</p>
          <p className="text-xs text-gray-400 mt-2">
            Ожидают согласования
          </p>
        </motion.div>

        {/* Approved */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.approved}</span>
          </div>
          <p className="text-gray-600 font-medium">Одобрено</p>
          <p className="text-xs text-gray-400 mt-2">
            Всего за всё время
          </p>
        </motion.div>

        {/* Rejected */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <XCircleIcon className="w-6 h-6 text-gray-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.rejected}</span>
          </div>
          <p className="text-gray-600 font-medium">Отклонено</p>
          <p className="text-xs text-gray-400 mt-2">
            Всего за всё время
          </p>
        </motion.div>
      </div>

      {/* Quick Actions & Recent Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="card"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Быстрые действия
          </h2>
          
          <div className="space-y-3">
            <Link to="/new-request">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-sgu-blue/5 hover:bg-sgu-blue/10 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-sgu-blue flex items-center justify-center">
                  <DocumentPlusIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Создать заявку</p>
                  <p className="text-sm text-gray-500">Оформить отпуск</p>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-400" />
              </div>
            </Link>

            <Link to="/my-requests">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Мои заявки</p>
                  <p className="text-sm text-gray-500">История и статусы</p>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-400" />
              </div>
            </Link>

            <Link to="/calendar">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                  <CalendarDaysIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Календарь</p>
                  <p className="text-sm text-gray-500">График отпусков</p>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Recent Requests */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="lg:col-span-2 card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Последние заявки</h2>
            <Link to="/my-requests" className="text-sm text-sgu-blue hover:underline">
              Все заявки →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3 skeleton" />
                    <div className="h-3 bg-gray-200 rounded w-1/4 skeleton" />
                  </div>
                  <div className="w-24 h-8 bg-gray-200 rounded-full skeleton" />
                </div>
              ))}
            </div>
          ) : recentRequests.length > 0 ? (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-sgu-blue/10 flex items-center justify-center">
                    <CalendarDaysIcon className="w-6 h-6 text-sgu-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">
                      {format(new Date(request.start_date), 'd MMM', { locale: ru })} — {format(new Date(request.end_date), 'd MMM', { locale: ru })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {request.days_count} {request.days_count === 1 ? 'день' : request.days_count < 5 ? 'дня' : 'дней'}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">У вас пока нет заявок</p>
              <Link to="/new-request" className="btn-primary">
                Создать первую заявку
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardPage;