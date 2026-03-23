import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  Bars3Icon, 
  BellIcon,
  CheckIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';

const typeColors = {
  info: 'bg-blue-100 text-blue-600',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  error: 'bg-red-100 text-red-600',
  replacement: 'bg-purple-100 text-purple-600'
};

export const Header = ({ onMenuClick, title }) => {
  const { profile } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (profile?.id) {
      fetchNotifications(profile.id);
    }
  }, [profile?.id]);

  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    setShowNotifications(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200 mx-4 mt-4 mb-6 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Menu button & Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Bars3Icon className="w-6 h-6 text-gray-600" />
          </button>
          
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('ru-RU', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <BellIcon className="w-6 h-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[20px] h-5 px-1 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Уведомления</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead(profile?.id)}
                      className="text-sm text-sgu-blue hover:underline"
                    >
                      Прочитать все
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                          !notification.is_read ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 mt-2 rounded-full ${
                            !notification.is_read ? 'bg-sgu-blue' : 'bg-transparent'
                          }`} />
                          
                          <div className="flex-1 min-w-0">
                            {notification.link ? (
                              <Link
                                to={notification.link}
                                onClick={() => handleNotificationClick(notification)}
                                className="block"
                              >
                                <p className="font-medium text-gray-900 text-sm">
                                  {notification.title}
                                </p>
                                <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                              </Link>
                            ) : (
                              <>
                                <p className="font-medium text-gray-900 text-sm">
                                  {notification.title}
                                </p>
                                <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">
                                  {notification.message}
                                </p>
                              </>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {format(new Date(notification.created_at), 'd MMM, HH:mm', { locale: ru })}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Отметить как прочитанное"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Удалить"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <BellIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Нет уведомлений</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 10 && (
                  <div className="px-4 py-3 border-t border-gray-100 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setShowNotifications(false)}
                      className="text-sm text-sgu-blue hover:underline"
                    >
                      Показать все уведомления
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User avatar */}
          <div className="flex items-center gap-3 p-2 pr-4 rounded-xl bg-gray-50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sgu-blue to-sgu-blue-light flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {profile?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-gray-900 text-sm">
                {profile?.full_name?.split(' ')[0] || 'Пользователь'}
              </p>
              <p className="text-xs text-gray-500">
                {profile?.department?.name?.split(' ').slice(0, 2).join(' ') || 'Кафедра'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;