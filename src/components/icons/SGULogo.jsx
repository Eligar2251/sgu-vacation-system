import React from 'react';

export const SGULogo = ({ className = "w-12 h-12", variant = "full" }) => {
  if (variant === "icon") {
    return (
      <svg 
        viewBox="0 0 100 100" 
        className={className}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Герб/Щит */}
        <defs>
          <linearGradient id="sguGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#003366" />
            <stop offset="50%" stopColor="#0055a5" />
            <stop offset="100%" stopColor="#003366" />
          </linearGradient>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a227" />
            <stop offset="50%" stopColor="#e6c65c" />
            <stop offset="100%" stopColor="#c9a227" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Основа щита */}
        <path 
          d="M50 5 L90 20 L90 55 C90 75 70 90 50 95 C30 90 10 75 10 55 L10 20 Z"
          fill="url(#sguGradient)"
          filter="url(#shadow)"
          stroke="url(#goldGradient)"
          strokeWidth="2"
        />
        
        {/* Волны (символ моря/Сочи) */}
        <path 
          d="M20 50 Q30 45 40 50 Q50 55 60 50 Q70 45 80 50"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path 
          d="M20 60 Q30 55 40 60 Q50 65 60 60 Q70 55 80 60"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        
        {/* Книга (символ образования) */}
        <path 
          d="M35 25 L35 42 L50 38 L65 42 L65 25 L50 29 Z"
          fill="white"
          opacity="0.95"
        />
        <path 
          d="M50 29 L50 38"
          stroke="url(#sguGradient)"
          strokeWidth="1"
        />
        
        {/* Солнце (символ юга) */}
        <circle cx="50" cy="75" r="8" fill="url(#goldGradient)" />
        <g stroke="url(#goldGradient)" strokeWidth="2" strokeLinecap="round">
          <line x1="50" y1="62" x2="50" y2="66" />
          <line x1="50" y1="84" x2="50" y2="88" />
          <line x1="37" y1="75" x2="41" y2="75" />
          <line x1="59" y1="75" x2="63" y2="75" />
          <line x1="40.5" y1="66.5" x2="43.5" y2="69.5" />
          <line x1="56.5" y1="80.5" x2="59.5" y2="83.5" />
          <line x1="59.5" y1="66.5" x2="56.5" y2="69.5" />
          <line x1="43.5" y1="80.5" x2="40.5" y2="83.5" />
        </g>
      </svg>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <SGULogo variant="icon" className="w-12 h-12" />
      <div className="flex flex-col">
        <span className="text-xl font-bold text-sgu-blue tracking-tight">СГУ</span>
        <span className="text-xs text-gray-500 -mt-1">Сочинский государственный</span>
      </div>
    </div>
  );
};

export const SGULogoFull = ({ className = "" }) => (
  <div className={`flex items-center gap-4 ${className}`}>
    <SGULogo variant="icon" className="w-16 h-16" />
    <div className="flex flex-col">
      <span className="text-2xl font-bold text-sgu-blue tracking-tight">
        Сочинский государственный
      </span>
      <span className="text-lg font-medium text-sgu-blue-light -mt-1">
        университет
      </span>
      <span className="text-sm text-gray-500 mt-1">
        Система учета отпусков
      </span>
    </div>
  </div>
);

export default SGULogo;