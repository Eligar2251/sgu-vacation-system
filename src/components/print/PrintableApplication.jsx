import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const vacationTypeLabels = {
  annual: 'ежегодного оплачиваемого отпуска',
  additional: 'дополнительного отпуска',
  unpaid: 'отпуска без сохранения заработной платы',
  educational: 'учебного отпуска',
  sick: 'отпуска по болезни'
};

export const PrintableApplication = forwardRef(({ request }, ref) => {
  const today = new Date();
  
  return (
    <div ref={ref} className="print-document" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
        <div style={{ width: '300px', textAlign: 'left' }}>
          <p style={{ marginBottom: '5px' }}>Ректору</p>
          <p style={{ marginBottom: '5px' }}>ФГБОУ ВО «Сочинский государственный университет»</p>
          <p style={{ marginBottom: '5px' }}>Романовой Г.М.</p>
          <p style={{ marginTop: '20px' }}>от {request?.user?.full_name}</p>
          <p style={{ marginBottom: '5px' }}>должность: {request?.user?.position}</p>
          <p>кафедра: {request?.user?.department?.name}</p>
        </div>
      </div>

      {/* Заголовок */}
      <h1 style={{ 
        textAlign: 'center', 
        fontSize: '18pt', 
        marginBottom: '30px',
        fontWeight: 'bold' 
      }}>
        ЗАЯВЛЕНИЕ
      </h1>

      {/* Текст заявления */}
      <div style={{ textIndent: '40px', lineHeight: '2', textAlign: 'justify' }}>
        <p>
          Прошу предоставить мне {vacationTypeLabels[request?.vacation_type] || 'отпуск'} с{' '}
          <strong>
            {request?.start_date && format(new Date(request.start_date), 'd MMMM yyyy', { locale: ru })}
          </strong>
          {' '}г. по{' '}
          <strong>
            {request?.end_date && format(new Date(request.end_date), 'd MMMM yyyy', { locale: ru })}
          </strong>
          {' '}г. продолжительностью{' '}
          <strong>{request?.days_count}</strong>
          {' '}{getDaysWord(request?.days_count)}.
        </p>

        {request?.comment && (
          <p style={{ marginTop: '20px' }}>
            Основание: {request.comment}
          </p>
        )}
      </div>

      {/* Подпись */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '60px',
        alignItems: 'flex-end'
      }}>
        <div>
          <p>{format(today, 'd MMMM yyyy', { locale: ru })} г.</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            borderBottom: '1px solid black', 
            width: '200px', 
            marginBottom: '5px' 
          }}></div>
          <p style={{ fontSize: '10pt' }}>
            ({request?.user?.full_name?.split(' ').slice(0, 1).join(' ')}{' '}
            {request?.user?.full_name?.split(' ').slice(1).map(n => n[0] + '.').join('')})
          </p>
        </div>
      </div>

      {/* Визы согласования */}
      <div style={{ marginTop: '60px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '20px' }}>Согласовано:</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div style={{ width: '45%' }}>
            <p>Заведующий кафедрой</p>
            <div style={{ 
              borderBottom: '1px solid black', 
              width: '100%', 
              marginTop: '30px',
              marginBottom: '5px'
            }}></div>
            <p style={{ fontSize: '10pt' }}>(подпись, дата)</p>
          </div>
          <div style={{ width: '45%' }}>
            <p>Начальник отдела кадров</p>
            <div style={{ 
              borderBottom: '1px solid black', 
              width: '100%', 
              marginTop: '30px',
              marginBottom: '5px'
            }}></div>
            <p style={{ fontSize: '10pt' }}>(подпись, дата)</p>
          </div>
        </div>
      </div>
    </div>
  );
});

function getDaysWord(count) {
  if (count === 1) return 'календарный день';
  if (count >= 2 && count <= 4) return 'календарных дня';
  return 'календарных дней';
}

PrintableApplication.displayName = 'PrintableApplication';

export default PrintableApplication;