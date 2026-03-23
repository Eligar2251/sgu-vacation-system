import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  CalendarDaysIcon,
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  XMarkIcon,
  ClockIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import { SGULogo } from '../icons/SGULogo';
import { useAuthStore } from '../../store/authStore';

const menuItems = {
  teacher: [
    { path: '/dashboard', icon: HomeIcon, label: 'Главная' },
    { path: '/my-requests', icon: ClipboardDocumentListIcon, label: 'Мои заявки' },
    { path: '/new-request', icon: DocumentPlusIcon, label: 'Новая заявка' },
    { path: '/schedule', icon: ClockIcon, label: 'Расписание' },
    { path: '/replacements', icon: ArrowsRightLeftIcon, label: 'Замены' },
    { path: '/calendar', icon: CalendarDaysIcon, label: 'Календарь' },
  ],
  head: [
    { path: '/dashboard', icon: HomeIcon, label: 'Главная' },
    { path: '/my-requests', icon: ClipboardDocumentListIcon, label: 'Мои заявки' },
    { path: '/new-request', icon: DocumentPlusIcon, label: 'Новая заявка' },
    { path: '/department-requests', icon: UsersIcon, label: 'Заявки кафедры' },
    { path: '/schedule', icon: ClockIcon, label: 'Расписание' },
    { path: '/replacements', icon: ArrowsRightLeftIcon, label: 'Замены' },
    { path: '/calendar', icon: CalendarDaysIcon, label: 'Календарь' },
  ],
  admin: [
    { path: '/dashboard', icon: HomeIcon, label: 'Главная' },
    { path: '/all-requests', icon: ClipboardDocumentListIcon, label: 'Все заявки' },
    { path: '/users', icon: UsersIcon, label: 'Сотрудники' },
    { path: '/departments', icon: BuildingOffice2Icon, label: 'Кафедры' },
    { path: '/schedule', icon: ClockIcon, label: 'Расписание' },
    { path: '/calendar', icon: CalendarDaysIcon, label: 'Календарь' },
    { path: '/settings', icon: Cog6ToothIcon, label: 'Настройки' },
  ]
};

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { profile, signOut } = useAuthStore();
  const role = profile?.role || 'teacher';
  const items = menuItems[role] || menuItems.teacher;

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 bottom-0 w-72 z-50 
          bg-white border-r border-gray-200 shadow-lg
          flex flex-col
          transform transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100"
        >
          <XMarkIcon className="w-6 h-6 text-gray-500" />
        </button>

        <div className="p-6 border-b border-gray-200">
          <SGULogo className="w-full" />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-hide">
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-150
                  ${isActive 
                    ? 'bg-sgu-blue text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="p-4 rounded-xl bg-gray-50 mb-3">
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
          
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 
              rounded-xl text-red-600 hover:bg-red-50 
              transition-colors duration-150 font-medium"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Выйти
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;