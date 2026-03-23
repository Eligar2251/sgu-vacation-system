import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import { ru } from 'date-fns/locale';
import { format, differenceInBusinessDays, addDays, isWeekend } from 'date-fns';
import { 
  CalendarDaysIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import { useVacationStore } from '../../store/vacationStore';
import { showToast } from '../ui/Toast';
import 'react-day-picker/dist/style.css';

const vacationTypes = [
  { 
    id: 'annual', 
    label: 'Ежегодный оплачиваемый', 
    description: 'Основной отпуск согласно ТК РФ',
    icon: '🌴'
  },
  { 
    id: 'additional', 
    label: 'Дополнительный', 
    description: 'За особые условия труда или стаж',
    icon: '⭐'
  },
  { 
    id: 'unpaid', 
    label: 'За свой счет', 
    description: 'Отпуск без сохранения зарплаты',
    icon: '📋'
  },
  { 
    id: 'educational', 
    label: 'Учебный', 
    description: 'Для прохождения обучения/защиты',
    icon: '📚'
  }
];

export const VacationRequestForm = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuthStore();
  const { createRequest, loading } = useVacationStore();
  
  const [step, setStep] = useState(1);
  const [vacationType, setVacationType] = useState(null);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [comment, setComment] = useState('');

  const remainingDays = (profile?.total_vacation_days || 0) - (profile?.used_vacation_days || 0);

  const workDaysCount = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return 0;
    let count = 0;
    let current = dateRange.from;
    while (current <= dateRange.to) {
      if (!isWeekend(current)) count++;
      current = addDays(current, 1);
    }
    return count;
  }, [dateRange]);

  const isValidRequest = useMemo(() => {
    if (!vacationType || !dateRange.from || !dateRange.to) return false;
    if (vacationType !== 'unpaid' && workDaysCount > remainingDays) return false;
    return workDaysCount > 0;
  }, [vacationType, dateRange, workDaysCount, remainingDays]);

  const handleSubmit = async () => {
    if (!isValidRequest) return;

    const request = {
      user_id: profile.id,
      vacation_type: vacationType,
      start_date: format(dateRange.from, 'yyyy-MM-dd'),
      end_date: format(dateRange.to, 'yyyy-MM-dd'),
      days_count: workDaysCount,
      comment: comment.trim() || null
    };

    const result = await createRequest(request);
    
    if (result.success) {
      showToast.success('Заявка успешно создана!');
      await refreshProfile();
      navigate('/my-requests');
    } else {
      showToast.error(result.error || 'Ошибка при создании заявки');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <motion.div
                animate={{ 
                  scale: step === s ? 1.1 : 1,
                  backgroundColor: step >= s ? '#003366' : '#e5e7eb'
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                  ${step >= s ? 'bg-sgu-blue' : 'bg-gray-300'}`}
              >
                {step > s ? <CheckIcon className="w-5 h-5" /> : s}
              </motion.div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-2 rounded ${step > s ? 'bg-sgu-blue' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-between mt-3 text-sm">
          <span className={step >= 1 ? 'text-sgu-blue font-medium' : 'text-gray-400'}>
            Тип отпуска
          </span>
          <span className={step >= 2 ? 'text-sgu-blue font-medium' : 'text-gray-400'}>
            Даты
          </span>
          <span className={step >= 3 ? 'text-sgu-blue font-medium' : 'text-gray-400'}>
            Подтверждение
          </span>
        </div>
      </div>

      {/* Remaining Days Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-sgu-blue to-sgu-blue-light text-white mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Доступно дней отпуска</p>
            <p className="text-4xl font-bold">{remainingDays}</p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Использовано</p>
            <p className="text-2xl font-semibold">{profile?.used_vacation_days || 0}</p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: `${((profile?.used_vacation_days || 0) / (profile?.total_vacation_days || 1)) * 100}%` 
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-white/80 rounded-full"
          />
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Step 1: Vacation Type */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Выберите тип отпуска
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vacationTypes.map((type) => (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setVacationType(type.id)}
                  className={`p-5 rounded-xl border-2 text-left transition-all
                    ${vacationType === type.id 
                      ? 'border-sgu-blue bg-sgu-blue/5 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{type.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{type.label}</p>
                      <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                    </div>
                    {vacationType === type.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-6 h-6 rounded-full bg-sgu-blue flex items-center justify-center"
                      >
                        <CheckIcon className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                disabled={!vacationType}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Далее
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Date Selection */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CalendarDaysIcon className="w-6 h-6 text-sgu-blue" />
              Выберите период отпуска
            </h2>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Calendar */}
              <div className="flex-1 flex justify-center">
                <DayPicker
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={ru}
                  disabled={{ before: new Date() }}
                  modifiers={{
                    weekend: (date) => isWeekend(date)
                  }}
                  modifiersStyles={{
                    weekend: { color: '#dc2626' }
                  }}
                  className="!font-sans"
                  classNames={{
                    day_selected: 'bg-sgu-blue text-white',
                    day_range_middle: 'bg-sgu-blue/20',
                    day_range_end: 'bg-sgu-blue text-white',
                    day_range_start: 'bg-sgu-blue text-white'
                  }}
                />
              </div>

              {/* Summary */}
              <div className="lg:w-72 space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3">Выбранный период</h3>
                  
                  {dateRange.from && dateRange.to ? (
                    <>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Начало:</span>
                          <span className="font-medium">
                            {format(dateRange.from, 'dd.MM.yyyy')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Окончание:</span>
                          <span className="font-medium">
                            {format(dateRange.to, 'dd.MM.yyyy')}
                          </span>
                        </div>
                        <div className="pt-2 mt-2 border-t flex justify-between">
                          <span className="text-gray-500">Рабочих дней:</span>
                          <span className={`font-bold text-lg ${
                            workDaysCount > remainingDays && vacationType !== 'unpaid'
                              ? 'text-red-600' 
                              : 'text-sgu-blue'
                          }`}>
                            {workDaysCount}
                          </span>
                        </div>
                      </div>

                      {workDaysCount > remainingDays && vacationType !== 'unpaid' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200"
                        >
                          <p className="text-sm text-red-600">
                            Превышен лимит доступных дней отпуска
                          </p>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 text-sm">
                      Выберите даты в календаре
                    </p>
                  )}
                </div>

                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex gap-2">
                    <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">
                      Выходные дни не учитываются при расчете продолжительности отпуска
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="btn-secondary">
                Назад
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!dateRange.from || !dateRange.to}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Далее
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DocumentTextIcon className="w-6 h-6 text-sgu-blue" />
              Подтверждение заявки
            </h2>

            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Тип отпуска</p>
                  <p className="font-semibold text-gray-900">
                    {vacationTypes.find(t => t.id === vacationType)?.label}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Количество дней</p>
                  <p className="font-semibold text-gray-900">{workDaysCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Дата начала</p>
                  <p className="font-semibold text-gray-900">
                    {dateRange.from && format(dateRange.from, 'dd MMMM yyyy', { locale: ru })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Дата окончания</p>
                  <p className="font-semibold text-gray-900">
                    {dateRange.to && format(dateRange.to, 'dd MMMM yyyy', { locale: ru })}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-2">
                  Комментарий (необязательно)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Дополнительная информация для руководителя..."
                  className="input-field resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex gap-2">
                <InformationCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  После отправки заявка будет направлена на рассмотрение заведующему кафедрой, 
                  затем — в отдел кадров
                </p>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)} className="btn-secondary">
                Назад
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValidRequest || loading}
                className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Отправка...
                  </span>
                ) : (
                  'Отправить заявку'
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VacationRequestForm;