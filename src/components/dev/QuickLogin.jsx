// =====================================================
// ФАЙЛ ДЛЯ ТЕСТИРОВАНИЯ - УДАЛИТЬ ПЕРЕД ПРОДАКШЕНОМ
// =====================================================

import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { showToast } from '../ui/Toast';

const accounts = [
  {
    label: 'Администратор',
    sublabel: 'Петрова А.С.',
    email: 'admin@sgu.ru',
    password: 'admin123',
    color: 'from-purple-500 to-purple-600',
    icon: '🔑'
  },
  {
    label: 'Завкафедрой',
    sublabel: 'Николаев П. М.',
    email: 'head.it@sgu.ru',
    password: 'head123',
    color: 'from-blue-500 to-blue-600',
    icon: '👔'
  },
  {
    label: 'Преподаватель',
    sublabel: 'Иванов А.В.',
    email: 'ivanov@sgu.ru',
    password: 'teacher123',
    color: 'from-emerald-500 to-emerald-600',
    icon: '👨‍🏫'
  }
];

export const QuickLogin = () => {
  const { signIn } = useAuthStore();
  const [loadingAccount, setLoadingAccount] = useState(null);

  const handleQuickLogin = async (account) => {
    setLoadingAccount(account.email);
    
    const result = await signIn(account.email, account.password);
    
    if (result.success) {
      showToast.success(`Вход как ${account.label}`);
    } else {
      showToast.error(`Ошибка: ${result.error}`);
    }
    
    setLoadingAccount(null);
  };

  return (
    <div className="mt-8 p-5 bg-gray-50 border border-gray-200 rounded-2xl">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-4 text-center">
        Быстрый вход
      </p>
      
      <div className="grid grid-cols-3 gap-3">
        {accounts.map((account) => (
          <button
            key={account.email}
            onClick={() => handleQuickLogin(account)}
            disabled={loadingAccount !== null}
            className={`
              relative p-4 rounded-xl text-white text-center
              bg-gradient-to-br ${account.color}
              hover:shadow-lg hover:scale-105
              active:scale-95
              transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed
              disabled:hover:scale-100 disabled:hover:shadow-none
            `}
          >
            {loadingAccount === account.email ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-xs">Вход...</span>
              </div>
            ) : (
              <>
                <span className="text-2xl block mb-1">{account.icon}</span>
                <span className="text-sm font-semibold block">{account.label}</span>
                <span className="text-xs text-white/70 block">{account.sublabel}</span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickLogin;