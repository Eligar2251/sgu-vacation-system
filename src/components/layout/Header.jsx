import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bars3Icon, 
  BellIcon,
  UserCircleIcon 
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';

export const Header = ({ onMenuClick, title }) => {
  const { profile } = useAuthStore();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-30 glass-panel rounded-2xl mx-4 mt-4 mb-6"
    >
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-3 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <BellIcon className="w-6 h-6 text-gray-600" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          </motion.button>

          {/* User avatar */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 p-2 pr-4 rounded-xl bg-gray-100/50 cursor-pointer"
          >
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="" 
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sgu-blue to-sgu-blue-light flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {profile?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <div className="hidden sm:block">
              <p className="font-semibold text-gray-900 text-sm">
                {profile?.full_name?.split(' ')[0] || 'Пользователь'}
              </p>
              <p className="text-xs text-gray-500">
                {profile?.department?.name?.split(' ').slice(0, 2).join(' ') || 'Кафедра'}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;