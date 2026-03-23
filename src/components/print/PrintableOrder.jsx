import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const vacationTypeLabels = {
  annual: 'ежегодный оплачиваемый отпуск',
  additional: 'дополнительный отпуск',
  unpaid: 'отпуск без сохранения заработной платы',
  educational: 'учебный отпуск',
  sick: 'отпуск по болезни'
};

export const PrintableOrder = forwardRef(({ request }, ref) => {
  const today = new Date();
  
  return (
    <div ref={ref} className="print-document" style={{ fontFamily: 'Times New Roman, serif' }}>
      {/* Шапка организации */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <p style={{ fontSize: '12pt', marginBottom: '5px' }}>
          МИНИСТЕРСТВО НАУКИ И ВЫСШЕГО ОБРАЗОВАНИЯ РОССИЙСКОЙ ФЕДЕРАЦИИ
        </p>
        <p style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '5px' }}>
          ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ БЮДЖЕТНОЕ
        </p>
        <p style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '5px' }}>
          ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ ВЫСШЕГО ОБРАЗОВАНИЯ
        </p>
        <p style={{ fontSize: '16pt', fontWeight: 'bold' }}>
          «СОЧИНСКИЙ ГОСУДАРСТВЕННЫЙ УНИВЕРСИТЕТ»
        </p>
      </div>

      {/* Номер и дата приказа */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '30px',
        borderBottom: '2px solid black',
        paddingBottom: '10px'
      }}>
        <div>
          <p style={{ fontSize: '14pt' }}>
            ПРИКАЗ № <strong>{request?.order_number || '____'}</strong>
          </p>
        </div>
        <div>
          <p style={{ fontSize: '14pt' }}>
            от «{format(today, 'dd')}» {format(today, 'MMMM', { locale: ru })} {format(today, 'yyyy')} г.
          </p>
        </div>
      </div>

      {/* Заголовок приказа */}
      <div style={{ marginBottom: '30px' }}>
        <p style={{ fontSize: '14pt', fontWeight: 'bold' }}>
          О предоставлении отпуска
        </p>
      </div>

      {/* Текст приказа */}
      <div style={{ lineHeight: '1.8', textAlign: 'justify' }}>
        <p style={{ textIndent: '40px', marginBottom: '15px' }}>
          На основании статьи 114 Трудового кодекса Российской Федерации и личного 
          заявления работника
        </p>

        <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>ПРИКАЗЫВАЮ:</p>

        <p style={{ textIndent: '40px', marginBottom: '15px' }}>
          1. Предоставить {vacationTypeLabels[request?.vacation_type] || 'отпуск'} работнику:
        </p>

        <table style={{ width: '100%', marginBottom: '20px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '5px 0', width: '200px' }}>ФИО:</td>
              <td style={{ padding: '5px 0', fontWeight: 'bold' }}>
                {request?.user?.full_name}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0' }}>Должность:</td>
              <td style={{ padding: '5px 0' }}>{request?.user?.position}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0' }}>Структурное подразделение:</td>
              <td style={{ padding: '5px 0' }}>{request?.user?.department?.name}</td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0' }}>Период отпуска:</td>
              <td style={{ padding: '5px 0' }}>
                с {request?.start_date && format(new Date(request.start_date), 'd MMMM yyyy', { locale: ru })} г.{' '}
                по {request?.end_date && format(new Date(request.end_date), 'd MMMM yyyy', { locale: ru })} г.
              </td>
            </tr>
            <tr>
              <td style={{ padding: '5px 0' }}>Количество дней:</td>
              <td style={{ padding: '5px 0', fontWeight: 'bold' }}>
                {request?.days_count} {getDaysWord(request?.days_count)}
              </td>
            </tr>
          </tbody>
        </table>

        <p style={{ textIndent: '40px', marginBottom: '15px' }}>
          2. Бухгалтерии произвести начисление отпускных в установленном порядке.
        </p>

        <p style={{ textIndent: '40px', marginBottom: '15px' }}>
          3. Контроль за исполнением настоящего приказа возложить на начальника 
          отдела кадров.
        </p>
      </div>

      {/* Основание */}
      <div style={{ marginTop: '30px', marginBottom: '40px' }}>
        <p>
          <span style={{ fontWeight: 'bold' }}>Основание:</span> заявление работника 
          от {request?.created_at && format(new Date(request.created_at), 'dd.MM.yyyy')} г.
        </p>
      </div>

      {/* Подпись ректора */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '60px'
      }}>
        <div>
          <p style={{ fontWeight: 'bold' }}>Ректор</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            borderBottom: '1px solid black', 
            width: '150px', 
            marginBottom: '5px' 
          }}></div>
          <p style={{ fontSize: '10pt' }}>(подпись)</p>
        </div>
        <div>
          <p>Г.М. Романова</p>
        </div>
      </div>

      {/* Ознакомление работника */}
      <div style={{ borderTop: '1px solid #ccc', paddingTop: '20px' }}>
        <p style={{ marginBottom: '20px' }}>С приказом ознакомлен(а):</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              borderBottom: '1px solid black', 
              width: '200px', 
              marginBottom: '5px' 
            }}></div>
            <p style={{ fontSize: '10pt' }}>(подпись работника)</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              borderBottom: '1px solid black', 
              width: '200px', 
              marginBottom: '5px' 
            }}></div>
            <p style={{ fontSize: '10pt' }}>(дата)</p>
          </div>
        </div>
      </div>

      {/* Регистрационные данные */}
      <div style={{ 
        marginTop: '40px', 
        fontSize: '10pt', 
        color: '#666',
        borderTop: '1px dashed #ccc',
        paddingTop: '10px'
      }}>
        <p>Исполнитель: Отдел кадров СГУ</p>
        <p>Тел.: +7 (862) 264-88-48</p>
      </div>
    </div>
  );
});

function getDaysWord(count) {
  if (count === 1) return 'календарный день';
  if (count >= 2 && count <= 4) return 'календарных дня';
  return 'календарных дней';
}

PrintableOrder.displayName = 'PrintableOrder';

export default PrintableOrder;