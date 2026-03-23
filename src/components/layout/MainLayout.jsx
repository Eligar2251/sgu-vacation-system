import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageTitles = {
  '/dashboard': 'Главная панель',
  '/my-requests': 'Мои заявки',
  '/new-request': 'Новая заявка на отпуск',
  '/department-requests': 'Заявки кафедры',
  '/all-requests': 'Все заявки',
  '/users': 'Управление сотрудниками',
  '/departments': 'Управление кафедрами',
  '/statistics': 'Статистика',
  '/calendar': 'Календарь отпусков',
  '/settings': 'Настройки системы',
  '/profile': 'Профиль'
};

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'АСУ ОП СГУ';

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        <Header 
          title={title}
          onMenuClick={() => setSidebarOpen(true)} 
        />
        
        <main className="flex-1 px-4 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;