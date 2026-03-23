import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useVacationStore } from '../store/vacationStore';
import { VacationRequestCard } from '../components/vacation/VacationRequestCard';
import { SkeletonCard } from '../components/ui/LoadingSpinner';
import { showToast } from '../components/ui/Toast';

const statusFilters = [
  { value: 'all', label: 'Все' },
  { value: 'pending', label: 'На рассмотрении' },
  { value: 'approved_head', label: 'Одобрено завкафедрой' },
  { value: 'approved', label: 'Одобрено' },
  { value: 'rejected', label: 'Отклонено' }
];

export const MyRequestsPage = () => {
  const { profile } = useAuthStore();
  const { requests, fetchUserRequests, deleteRequest, loading } = useVacationStore();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchUserRequests(profile.id);
    }
  }, [profile]);

  const filteredRequests = requests.filter(req => {
    if (filter !== 'all' && req.status !== filter) return false;
    return true;
  });

  const handleDelete = async (requestId) => {
    if (window.confirm('Вы уверены, что хотите удалить заявку?')) {
      const result = await deleteRequest(requestId);
      if (result.success) {
        showToast.success('Заявка удалена');
      } else {
        showToast.error(result.error || 'Ошибка удаления');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Мои заявки</h1>
          <p className="text-gray-500">Управление заявками на отпуск</p>
        </div>
        <Link to="/new-request">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Новая заявка
          </motion.button>
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {statusFilters.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === value
                    ? 'bg-sgu-blue text-white shadow-lg shadow-sgu-blue/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filteredRequests.length > 0 ? (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <VacationRequestCard
                key={request.id}
                request={request}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <FunnelIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Заявок не найдено
          </h3>
          <p className="text-gray-500 mb-6">
            {filter !== 'all' 
              ? 'Попробуйте изменить фильтры' 
              : 'Создайте первую заявку на отпуск'}
          </p>
          {filter === 'all' && (
            <Link to="/new-request" className="btn-primary">
              Создать заявку
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default MyRequestsPage;