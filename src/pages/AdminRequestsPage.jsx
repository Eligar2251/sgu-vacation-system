import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import {
  ClipboardDocumentListIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuthStore } from '../store/authStore';
import { useVacationStore } from '../store/vacationStore';
import { VacationRequestCard } from '../components/vacation/VacationRequestCard';
import { SkeletonCard } from '../components/ui/LoadingSpinner';
import { showToast } from '../components/ui/Toast';
import { db } from '../lib/supabase';

export const AdminRequestsPage = () => {
  const { profile } = useAuthStore();
  const { allRequests, fetchAllRequests, approveByAdmin, rejectRequest, loading } = useVacationStore();
  const [filter, setFilter] = useState('pending');
  
  // Модалка одобрения
  const [approveModal, setApproveModal] = useState({ open: false, request: null });
  const [orderNumber, setOrderNumber] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [savingApproval, setSavingApproval] = useState(false);
  
  // Модалка отклонения
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null });
  const [rejectComment, setRejectComment] = useState('');

  useEffect(() => {
    fetchAllRequests();
  }, []);

  // Фильтрация заявок
  const filteredRequests = allRequests.filter(req => {
    if (filter === 'pending') return req.status === 'approved_head'; // Ожидают одобрения админа
    if (filter === 'all_pending') return req.status === 'pending' || req.status === 'approved_head';
    if (filter === 'approved') return req.status === 'approved';
    if (filter === 'rejected') return req.status === 'rejected';
    return true;
  });

  // Статистика
  const stats = {
    awaitingAdmin: allRequests.filter(r => r.status === 'approved_head').length,
    awaitingHead: allRequests.filter(r => r.status === 'pending').length,
    approved: allRequests.filter(r => r.status === 'approved').length,
    rejected: allRequests.filter(r => r.status === 'rejected').length
  };

  const handleApprove = (requestId) => {
    const request = allRequests.find(r => r.id === requestId);
    if (!request) return;
    
    // Генерируем номер приказа
    const year = new Date().getFullYear();
    const orderNum = `${Math.floor(Math.random() * 9000) + 1000}-О/${year}`;
    setOrderNumber(orderNum);
    setAdminComment('');
    setApproveModal({ open: true, request });
  };

  const handleReject = (requestId) => {
    setRejectComment('');
    setRejectModal({ open: true, requestId });
  };

  const confirmApprove = async () => {
    const { request } = approveModal;
    if (!request) return;

    setSavingApproval(true);
    
    try {
      // Обновляем заявку с номером приказа
      await db.vacationRequests.approveByAdmin(request.id, profile.id, adminComment || null);
      
      // Обновляем номер приказа отдельно если он есть
      if (orderNumber) {
        const { error } = await db.supabase
          .from('vacation_requests')
          .update({ order_number: orderNumber })
          .eq('id', request.id);
        
        if (error) console.warn('Error updating order number:', error);
      }
      
      // Обновляем использованные дни отпуска у сотрудника
      if (request.user_id && request.days_count) {
        try {
          const userProfile = await db.profiles.getById(request.user_id);
          const newUsedDays = (userProfile.used_vacation_days || 0) + request.days_count;
          await db.profiles.update(request.user_id, { used_vacation_days: newUsedDays });
        } catch (err) {
          console.warn('Error updating vacation days:', err);
        }
      }
      
      showToast.success('Заявка одобрена. Приказ сформирован.');
      setApproveModal({ open: false, request: null });
      setOrderNumber('');
      setAdminComment('');
      await fetchAllRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      showToast.error('Ошибка одобрения: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setSavingApproval(false);
    }
  };

  const confirmReject = async () => {
    const { requestId } = rejectModal;
    
    if (!rejectComment.trim()) {
      showToast.error('Укажите причину отклонения');
      return;
    }

    try {
      const result = await rejectRequest(requestId, rejectComment);
      
      if (result.success) {
        showToast.success('Заявка отклонена');
        setRejectModal({ open: false, requestId: null });
        setRejectComment('');
        await fetchAllRequests();
      } else {
        showToast.error(result.error || 'Ошибка отклонения');
      }
    } catch (error) {
      console.error('Error rejecting:', error);
      showToast.error('Ошибка отклонения');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardDocumentListIcon className="w-8 h-8 text-sgu-blue" />
            Заявки на отпуск
          </h1>
          <p className="text-gray-500">Управление заявками всех сотрудников</p>
        </div>

        <button
          onClick={() => fetchAllRequests()}
          className="btn-secondary"
        >
          <ArrowPathIcon className="w-5 h-5 mr-2" />
          Обновить
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-br from-amber-500 to-orange-500 text-white cursor-pointer"
          onClick={() => setFilter('pending')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Ожидают вашего решения</p>
              <p className="text-3xl font-bold">{stats.awaitingAdmin}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilter('all_pending')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">У завкафедры</p>
              <p className="text-3xl font-bold text-gray-900">{stats.awaitingHead}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilter('approved')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Одобрено</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.approved}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckIcon className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setFilter('rejected')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Отклонено</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <XMarkIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>
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
          На рассмотрении ({stats.awaitingAdmin})
        </button>
        <button
          onClick={() => setFilter('all_pending')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            filter === 'all_pending'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Все ожидающие
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            filter === 'approved'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Одобренные
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            filter === 'rejected'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Отклонённые
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
              showActions={request.status === 'approved_head'}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {filter === 'pending' ? 'Нет заявок на рассмотрении' : 'Заявок не найдено'}
          </h3>
          <p className="text-gray-500">
            {filter === 'pending' 
              ? 'Все заявки, ожидающие вашего решения, обработаны'
              : 'По выбранному фильтру заявок нет'}
          </p>
        </div>
      )}

      {/* Approve Modal */}
      <Dialog
        open={approveModal.open}
        onClose={() => setApproveModal({ open: false, request: null })}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              Одобрение заявки
            </Dialog.Title>

            {approveModal.request && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-sgu-blue/10 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-sgu-blue" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {approveModal.request.user?.full_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {approveModal.request.user?.position}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Период:</span>
                    <p className="font-medium">
                      {format(parseISO(approveModal.request.start_date), 'd MMM', { locale: ru })} — {format(parseISO(approveModal.request.end_date), 'd MMM yyyy', { locale: ru })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Дней:</span>
                    <p className="font-medium">{approveModal.request.days_count}</p>
                  </div>
                </div>

                {approveModal.request.head_comment && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 mb-1">Комментарий завкафедрой:</p>
                    <p className="text-sm text-blue-800">{approveModal.request.head_comment}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Номер приказа
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="input-field"
                  placeholder="1234-О/2024"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Комментарий (необязательно)
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Комментарий к одобрению..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setApproveModal({ open: false, request: null })}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button
                onClick={confirmApprove}
                disabled={savingApproval}
                className="btn-success flex-1"
              >
                {savingApproval ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-5 h-5 mr-2" />
                    Одобрить
                  </>
                )}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Reject Modal */}
      <Dialog
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, requestId: null })}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
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
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Укажите причину отклонения заявки"
                className="input-field resize-none"
                rows={3}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setRejectModal({ open: false, requestId: null });
                  setRejectComment('');
                }}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectComment.trim()}
                className="btn-danger flex-1 disabled:opacity-50"
              >
                <XMarkIcon className="w-5 h-5 mr-2" />
                Отклонить
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminRequestsPage;