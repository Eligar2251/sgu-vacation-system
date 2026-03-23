import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';
import {
  CalendarDaysIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  PrinterIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { StatusBadge, VacationTypeBadge } from '../ui/StatusBadge';
import { PrintableApplication } from '../print/PrintableApplication';
import { PrintableOrder } from '../print/PrintableOrder';
import { useAuthStore } from '../../store/authStore';

export const VacationRequestCard = ({ 
  request, 
  onDelete, 
  onApprove, 
  onReject,
  showActions = false 
}) => {
  const { profile } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const [printType, setPrintType] = useState(null);
  
  const applicationRef = useRef();
  const orderRef = useRef();

  const handlePrintApplication = useReactToPrint({
    content: () => applicationRef.current,
    documentTitle: `Заявление_${request.user?.full_name}_${format(new Date(request.start_date), 'dd.MM.yyyy')}`
  });

  const handlePrintOrder = useReactToPrint({
    content: () => orderRef.current,
    documentTitle: `Приказ_${request.order_number || 'черновик'}`
  });

  const canDelete = request.status === 'pending' && request.user_id === profile?.id;
  const canPrintApplication = true;
  const canPrintOrder = request.status === 'approved' && request.order_number;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="card card-hover"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sgu-blue/10 to-sgu-blue-light/10 
              flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6 text-sgu-blue" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">
                  {request.user?.full_name || 'Сотрудник'}
                </h3>
                <StatusBadge status={request.status} />
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {request.user?.position} • {request.user?.department?.name}
              </p>
            </div>
          </div>

          <VacationTypeBadge type={request.vacation_type} />
        </div>

        {/* Dates */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <ClockIcon className="w-4 h-4" />
            <span>
              {format(new Date(request.start_date), 'd MMM', { locale: ru })} — {' '}
              {format(new Date(request.end_date), 'd MMM yyyy', { locale: ru })}
            </span>
          </div>
          <div className="px-2 py-1 bg-sgu-blue/10 text-sgu-blue font-medium rounded-lg">
            {request.days_count} {request.days_count === 1 ? 'день' : 
              request.days_count < 5 ? 'дня' : 'дней'}
          </div>
          {request.order_number && (
            <div className="px-2 py-1 bg-emerald-100 text-emerald-700 font-medium rounded-lg">
              № {request.order_number}
            </div>
          )}
        </div>

        {/* Comment */}
        {request.comment && (
          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <div className="flex items-start gap-2">
              <ChatBubbleLeftIcon className="w-4 h-4 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-600">{request.comment}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <EyeIcon className="w-5 h-5" />
            </motion.button>
            
            {canPrintApplication && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrintApplication}
                className="p-2 text-gray-400 hover:text-sgu-blue hover:bg-sgu-blue/10 rounded-lg transition-colors"
                title="Печать заявления"
              >
                <DocumentTextIcon className="w-5 h-5" />
              </motion.button>
            )}

            {canPrintOrder && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrintOrder}
                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="Печать приказа"
              >
                <PrinterIcon className="w-5 h-5" />
              </motion.button>
            )}

            {canDelete && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete?.(request.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <TrashIcon className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          {showActions && (request.status === 'pending' || request.status === 'approved_head') && (
            <div className="flex items-center gap-2">
              {onReject && (
                <button
                  onClick={() => onReject(request.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  Отклонить
                </button>
              )}
              {onApprove && (
                <button
                  onClick={() => onApprove(request.id)}
                  className="btn-success !py-2 !px-4"
                >
                  Одобрить
                </button>
              )}
            </div>
          )}
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Создано:</span>
                  <span className="font-medium">
                    {format(new Date(request.created_at), 'dd.MM.yyyy HH:mm')}
                  </span>
                </div>
                
                {request.approvedByHead && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Одобрено завкафедрой:</span>
                    <span className="font-medium">{request.approvedByHead.full_name}</span>
                  </div>
                )}
                
                {request.head_comment && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 mb-1">Комментарий завкафедрой:</p>
                    <p className="text-blue-800">{request.head_comment}</p>
                  </div>
                )}

                {request.approvedByAdmin && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Одобрено отделом кадров:</span>
                    <span className="font-medium">{request.approvedByAdmin.full_name}</span>
                  </div>
                )}
                
                {request.admin_comment && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 mb-1">Комментарий отдела кадров:</p>
                    <p className="text-purple-800">{request.admin_comment}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Print Templates (hidden) */}
      <div className="hidden">
        <PrintableApplication ref={applicationRef} request={request} />
        <PrintableOrder ref={orderRef} request={request} />
      </div>
    </>
  );
};

export default VacationRequestCard;