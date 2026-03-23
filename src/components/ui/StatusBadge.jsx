import React from 'react';
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
    icon: ClockIcon
  },
  approved_head: {
    label: 'Одобрено завкафедрой',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: ArrowPathIcon
  },
  approved: {
    label: 'Одобрено',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircleIcon
  },
  rejected: {
    label: 'Отклонено',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircleIcon
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

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`status-badge border ${config.className}`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
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