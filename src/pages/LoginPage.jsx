import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  EnvelopeIcon, 
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { SGULogoFull, SGULogo } from '../components/icons/SGULogo';
import { useAuthStore } from '../store/authStore';
import { showToast } from '../components/ui/Toast';

export const LoginPage = () => {
  const { signIn, user, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await signIn(email, password);
    
    if (result.success) {
      showToast.success('Добро пожаловать в систему!');
    } else {
      showToast.error(result.error || 'Ошибка входа');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sgu-blue via-sgu-blue-light to-sgu-blue-dark relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-sgu-gold/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-white/5 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-8"
            >
              <SGULogo variant="icon" className="w-32 h-32 mx-auto drop-shadow-2xl" />
            </motion.div>

            <h1 className="text-4xl font-bold mb-4">
              Сочинский государственный
              <br />университет
            </h1>
            
            <p className="text-xl text-white/80 mb-8">
              Автоматизированная система учета
              <br />и планирования отпусков
            </p>

            <div className="flex items-center justify-center gap-2 text-sgu-gold">
              <div className="w-12 h-px bg-sgu-gold/50" />
              <span className="text-sm uppercase tracking-wider">АСУ ОП СГУ</span>
              <div className="w-12 h-px bg-sgu-gold/50" />
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute bottom-12 left-12 right-12"
          >
            <div className="grid grid-cols-3 gap-6 text-center text-sm">
              {[
                { icon: '📋', text: 'Электронные заявки' },
                { icon: '✅', text: 'Быстрое согласование' },
                { icon: '📊', text: 'Аналитика и отчёты' }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/10 backdrop-blur">
                  <span className="text-2xl mb-2 block">{item.icon}</span>
                  <span className="text-white/90">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <SGULogo variant="icon" className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-sgu-blue">АСУ ОП СГУ</h1>
            <p className="text-gray-500">Система учета отпусков</p>
          </div>

          <div className="card">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Вход в систему</h2>
              <p className="text-gray-500 mt-2">Используйте корпоративную почту</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@sgu.ru"
                    required
                    className="input-field pl-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input-field pl-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting || loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Вход...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Войти
                    <ArrowRightIcon className="w-5 h-5" />
                  </span>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Проблемы со входом?{' '}
              <a href="mailto:support@sgu.ru" className="text-sgu-blue hover:underline">
                Обратитесь в поддержку
              </a>
            </div>
          </div>

          {/* Demo credentials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
          >
            <p className="text-sm text-amber-800 font-medium mb-2">Демо-доступ:</p>
            <div className="text-xs text-amber-700 space-y-1">
              <p><strong>Админ:</strong> admin@sgu.ru / admin123</p>
              <p><strong>Завкафедрой:</strong> head@sgu.ru / head123</p>
              <p><strong>Преподаватель:</strong> teacher@sgu.ru / teacher123</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;