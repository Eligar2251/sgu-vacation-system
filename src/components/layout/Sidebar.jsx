import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HomeIcon,
  CalendarDaysIcon,
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChartBarIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';
import { SGULogo } from '../icons/SGULogo';
import { useAuthStore } from '../../store/authStore';

const menuItems = {
  teacher: [
    { path: '/dashboard', icon: HomeIcon, label: 'Главная' },
    { path: '/my-requests', icon: ClipboardDocumentListIcon, label: 'Мои заявки' },
    { path: '/new-request', icon: DocumentPlusIcon, label: 'Новая заявка' },
    { path: '/calendar', icon: CalendarDaysIcon, label: 'Календарь' },
  ],
  head: [
    { path: '/dashboard', icon: HomeIcon, label: 'Главная' },
    { path: '/my-requests', icon: ClipboardDocumentListIcon, label: 'Мои заявки' },
    { path: '/new-request', icon: DocumentPlusIcon, label: 'Новая заявка' },
    { path: '/department-requests', icon: UsersIcon, label: 'Заявки кафедры' },
    { path: '/calendar', icon: CalendarDaysIcon, label: 'Календарь' },
  ],
  admin: [
    { path: '/dashboard', icon: HomeIcon, label: 'Главная' },
    { path: '/all-requests', icon: ClipboardDocumentListIcon, label: 'Все заявки' },
    { path: '/users', icon: UsersIcon, label: 'Сотрудники' },
    { path: '/departments', icon: BuildingOffice2Icon, label: 'Кафедры' },
    { path: '/statistics', icon: ChartBarIcon, label: 'Статистика' },
    { path: '/calendar', icon: CalendarDaysIcon, label: 'Календарь' },
    { path: '/settings', icon: Cog6ToothIcon, label: 'Настройки' },
  ]
};

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { profile, signOut } = useAuthStore();
  const role = profile?.role || 'teacher';
  const items = menuItems[role] || menuItems.teacher;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed left-0 top-0 bottom-0 w-72 z-50 
          glass-panel rounded-r-3xl
          flex flex-col
          lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-200/50">
          <SGULogo className="w-full" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className="block"
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-sgu-blue to-sgu-blue-light text-white shadow-lg shadow-sgu-blue/25' 
                      : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-white/80"
                    />
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        {/* User info & Logout */}
        <div className="p-4 border-t border-gray-200/50">
          <div className="p-4 rounded-xl bg-gray-100/50 mb-3">
            <p className="font-semibold text-gray-900 truncate">
              {profile?.full_name || 'Пользователь'}
            </p>
            <p className="text-sm text-gray-500 truncate">
              {profile?.position || 'Должность не указана'}
            </p>
            <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium
              ${role === 'admin' ? 'bg-purple-100 text-purple-700' :
                role === 'head' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'}`}>
              {role === 'admin' ? 'Администратор' :
               role === 'head' ? 'Заведующий кафедрой' : 'Преподаватель'}
            </span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 
              rounded-xl text-red-600 hover:bg-red-50 
              transition-colors duration-200 font-medium"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Выйти
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;