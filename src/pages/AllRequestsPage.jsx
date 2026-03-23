import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog } from '@headlessui/react';
import {
  ClipboardDocumentListIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useVacationStore } from '../store/vacationStore';
import { VacationRequestCard } from '../components/vacation/VacationRequestCard';
import { SkeletonCard } from '../components/ui/LoadingSpinner';
import { showToast } from '../components/ui/Toast';

export const AllRequestsPage = () => {
  const { profile } = useAuthStore();
  const { allRequests, fetchAllRequests, approveByAdmin, rejectRequest, loading } = useVacationStore();
  const [filter, setFilter] = useState('approved_head');
  const [searchQuery, setSearchQuery] = useState('');
  const [commentModal, setCommentModal] = useState({ open: false, requestId: null, action: null });
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const filteredRequests = allRequests.filter(req => {
    // Filter by status
    if (filter === 'approved_head' && req.status !== 'approved_head') return false;
    if (filter === 'pending' && req.status !== 'pending') return false;
    if (filter === 'approved' && req.status !== 'approved') return false;
    if (filter === 'rejected' && req.status !== 'rejected') return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        req.user?.full_name?.toLowerCase().includes(query) ||
        req.user?.department?.name?.toLowerCase().includes(query)
      );
    }

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
      result = await approveByAdmin(requestId, profile.id, comment);
      if (result.success) {
        showToast.success('Заявка окончательно одобрена. Приказ сформирован.');
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
    fetchAllRequests();
  };

  const pendingCount = allRequests.filter(r => r.status === 'approved_head').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Все заявки</h1>
          <p className="text-gray-500">Управление заявками на отпуск</p>
        </div>

        {pendingCount > 0 && (
          <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl font-medium">
            {pendingCount} {pendingCount === 1 ? 'заявка ожидает' : 'заявок ожидают'} финального согласования
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по ФИО или кафедре..."
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'approved_head', label: 'От завкафедрой', color: 'blue' },
              { value: 'pending', label: 'Новые', color: 'amber' },
              { value: 'approved', label: 'Одобренные', color: 'emerald' },
              { value: 'rejected', label: 'Отклоненные', color: 'red' },
              { value: 'all', label: 'Все', color: 'gray' }
            ].map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === value
                    ? `bg-${color}-500 text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={filter === value ? { 
                  backgroundColor: color === 'gray' ? '#374151' : undefined 
                } : {}}
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
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <VacationRequestCard
              key={request.id}
              request={request}
              showActions={request.status === 'approved_head' || request.status === 'pending'}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <ClipboardDocumentListIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Заявок не найдено
          </h3>
          <p className="text-gray-500">
            Попробуйте изменить фильтры поиска
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
              {commentModal.action === 'approve' ? 'Финальное одобрение' : 'Отклонить заявку'}
            </Dialog.Title>

            {commentModal.action === 'approve' && (
              <p className="text-gray-600 mb-4">
                После одобрения будет сформирован приказ об отпуске и дни будут списаны с баланса сотрудника.
              </p>
            )}

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

export default AllRequestsPage;