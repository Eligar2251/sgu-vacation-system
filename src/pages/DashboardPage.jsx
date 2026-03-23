import React, { useEffect, useState } from 'react';
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
  SunIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useVacationStore } from '../store/vacationStore';
import { StatusBadge } from '../components/ui/StatusBadge';
import { SkeletonCard } from '../components/ui/LoadingSpinner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const DashboardPage = () => {
  const { profile } = useAuthStore();
  const { requests, fetchUserRequests, loading } = useVacationStore();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchUserRequests(profile.id);
    }

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Доброе утро');
    else if (hour < 18) setGreeting('Добрый день');
    else setGreeting('Добрый вечер');
  }, [profile]);

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div
        variants={itemVariants}
        className="card bg-gradient-to-r from-sgu-blue via-sgu-blue-light to-sgu-blue text-white overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sgu-gold/20 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-white/80 mb-2">
                <SunIcon className="w-5 h-5" />
                <span>{greeting}</span>
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
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CalendarDaysIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{remainingDays}</span>
          </div>
          <p className="text-gray-600 font-medium">Доступно дней</p>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${100 - usedPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Использовано {profile?.used_vacation_days || 0} из {profile?.total_vacation_days || 0}
          </p>
        </motion.div>

        {/* Pending */}
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.pending + stats.approvedHead}</span>
          </div>
          <p className="text-gray-600 font-medium">На рассмотрении</p>
          <p className="text-xs text-gray-400 mt-2">
            Ожидают согласования
          </p>
        </motion.div>

        {/* Approved */}
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{stats.approved}</span>
          </div>
          <p className="text-gray-600 font-medium">Одобрено</p>
          <p className="text-xs text-gray-400 mt-2">
            Всего за всё время
          </p>
        </motion.div>

        {/* Rejected */}
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg shadow-gray-500/30">
              <XCircleIcon className="w-6 h-6 text-white" />
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
        <motion.div variants={itemVariants} className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-sgu-gold" />
            Быстрые действия
          </h2>
          
          <div className="space-y-3">
            <Link to="/new-request">
              <motion.div
                whileHover={{ scale: 1.02, x: 5 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-sgu-blue/10 to-sgu-blue-light/10 hover:from-sgu-blue/20 hover:to-sgu-blue-light/20 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-sgu-blue flex items-center justify-center">
                  <DocumentPlusIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Создать заявку</p>
                  <p className="text-sm text-gray-500">Оформить отпуск</p>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-400" />
              </motion.div>
            </Link>

            <Link to="/my-requests">
              <motion.div
                whileHover={{ scale: 1.02, x: 5 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Мои заявки</p>
                  <p className="text-sm text-gray-500">История и статусы</p>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-400" />
              </motion.div>
            </Link>

            <Link to="/calendar">
              <motion.div
                whileHover={{ scale: 1.02, x: 5 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                  <CalendarDaysIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Календарь</p>
                  <p className="text-sm text-gray-500">График отпусков</p>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-400" />
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* Recent Requests */}
        <motion.div variants={itemVariants} className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Последние заявки</h2>
            <Link to="/my-requests" className="text-sm text-sgu-blue hover:underline">
              Все заявки →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                  <div className="w-24 h-8 bg-gray-200 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentRequests.length > 0 ? (
            <div className="space-y-3">
              {recentRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sgu-blue/20 to-sgu-blue-light/20 flex items-center justify-center">
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
                </motion.div>
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
    </motion.div>
  );
};

export default DashboardPage;