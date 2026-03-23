import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import {
  UsersIcon,
  CheckIcon,
  XMarkIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useVacationStore } from '../store/vacationStore';
import { VacationRequestCard } from '../components/vacation/VacationRequestCard';
import { SkeletonCard } from '../components/ui/LoadingSpinner';
import { showToast } from '../components/ui/Toast';

export const DepartmentRequestsPage = () => {
  const { profile } = useAuthStore();
  const { departmentRequests, fetchDepartmentRequests, approveByHead, rejectRequest, loading } = useVacationStore();
  const [filter, setFilter] = useState('pending');
  const [commentModal, setCommentModal] = useState({ open: false, requestId: null, action: null });
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (profile?.department_id) {
      fetchDepartmentRequests(profile.department_id);
    }
  }, [profile]);

  const filteredRequests = departmentRequests.filter(req => {
    if (filter === 'pending') return req.status === 'pending';
    if (filter === 'processed') return req.status !== 'pending';
    return true;
  });

  const handleApprove = (requestId) => {
    setCommentModal({ open: true, requestId, action: 'approve' });
  };

  const handleReject = (requestId) => {
    setCommentModal({ open: true, requestId, action: 'reject' });
  };

  const confirmAction = async () => {
    const { requestId, action } = commentModal;
    
    let result;
    if (action === 'approve') {
      result = await approveByHead(requestId, profile.id, comment);
      if (result.success) {
        showToast.success('Заявка одобрена и передана в отдел кадров');
      }
    } else {
      result = await rejectRequest(requestId, comment, profile.id);
      if (result.success) {
        showToast.success('Заявка отклонена');
      }
    }

    if (!result.success) {
      showToast.error(result.error || 'Произошла ошибка');
    }

    setCommentModal({ open: false, requestId: null, action: null });
    setComment('');
    fetchDepartmentRequests(profile.department_id);
  };

  const pendingCount = departmentRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-sgu-blue" />
            Заявки кафедры
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
      <div className="flex gap-2">
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
            Все заявки сотрудников кафедры обработаны
          </p>
        </div>
      )}

      {/* Comment Modal */}
      <Dialog
        open={commentModal.open}
        onClose={() => setCommentModal({ open: false, requestId: null, action: null })}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
            <Dialog.Title className="text-xl font-bold text-gray-900 mb-4">
              {commentModal.action === 'approve' ? 'Одобрить заявку' : 'Отклонить заявку'}
            </Dialog.Title>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий {commentModal.action === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={commentModal.action === 'approve' 
                  ? 'Комментарий (необязательно)' 
                  : 'Укажите причину отклонения'}
                className="input-field resize-none"
                rows={3}
                required={commentModal.action === 'reject'}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCommentModal({ open: false, requestId: null, action: null })}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button
                onClick={confirmAction}
                disabled={commentModal.action === 'reject' && !comment.trim()}
                className={`flex-1 ${commentModal.action === 'approve' ? 'btn-success' : 'btn-danger'} disabled:opacity-50`}
              >
                {commentModal.action === 'approve' ? 'Одобрить' : 'Отклонить'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default DepartmentRequestsPage;