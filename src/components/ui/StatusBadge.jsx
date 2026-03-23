import React from 'react';
import { motion } from 'framer-motion';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

const statusConfig = {
  pending: {
    label: 'На рассмотрении',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: ClockIcon,
    iconClassName: 'text-amber-500'
  },
  approved_head: {
    label: 'Одобрено завкафедрой',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: ArrowPathIcon,
    iconClassName: 'text-blue-500'
  },
  approved: {
    label: 'Одобрено',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircleIcon,
    iconClassName: 'text-emerald-500'
  },
  rejected: {
    label: 'Отклонено',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircleIcon,
    iconClassName: 'text-red-500'
  }
};

const vacationTypeConfig = {
  annual: {
    label: 'Ежегодный основной',
    className: 'bg-sky-100 text-sky-800 border-sky-200'
  },
  additional: {
    label: 'Дополнительный',
    className: 'bg-violet-100 text-violet-800 border-violet-200'
  },
  unpaid: {
    label: 'За свой счет',
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  educational: {
    label: 'Учебный',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  sick: {
    label: 'По болезни',
    className: 'bg-rose-100 text-rose-800 border-rose-200'
  }
};

export const StatusBadge = ({ status, animate = true }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const badge = (
    <span className={`status-badge border ${config.className}`}>
      <Icon className={`w-4 h-4 ${config.iconClassName}`} />
      {config.label}
    </span>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
};

export const VacationTypeBadge = ({ type }) => {
  const config = vacationTypeConfig[type] || vacationTypeConfig.annual;

  return (
    <span className={`status-badge border ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;