import React from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  InformationCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

export const ToasterProvider = () => (
  <Toaster
    position="top-right"
    gutter={12}
    toastOptions={{
      duration: 4000,
      style: {
        background: '#fff',
        color: '#333',
        padding: '16px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.05)',
      },
    }}
  />
);

export const showToast = {
  success: (message) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-down' : 'opacity-0'
        } flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-xl border border-emerald-100`}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
        </div>
        <p className="text-gray-800 font-medium">{message}</p>
      </div>
    ));
  },

  error: (message) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-down' : 'opacity-0'
        } flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-xl border border-red-100`}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <XCircleIcon className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-gray-800 font-medium">{message}</p>
      </div>
    ));
  },

  info: (message) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-down' : 'opacity-0'
        } flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-xl border border-blue-100`}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <InformationCircleIcon className="w-6 h-6 text-blue-600" />
        </div>
        <p className="text-gray-800 font-medium">{message}</p>
      </div>
    ));
  },

  warning: (message) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-down' : 'opacity-0'
        } flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-xl border border-amber-100`}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
        </div>
        <p className="text-gray-800 font-medium">{message}</p>
      </div>
    ));
  }
};

export default ToasterProvider;