import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon, Calendar } from 'lucide-react';
import { formatDate } from '../utils';

export const Clock: React.FC = () => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatHoursMinutes = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatSeconds = (date: Date) => {
    return String(date.getSeconds()).padStart(2, '0');
  };

  return (
    <div className="glass-card animate-fade-in" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* 背景の微弱な光 */}
      <div 
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-20%',
          width: '140%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(254, 180, 123, 0.08) 0%, rgba(255, 126, 95, 0) 60%)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px', 
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '10px'
          }}
        >
          <ClockIcon size={14} style={{ color: '#ffb87d' }} />
          <span>Current Time</span>
        </div>

        {/* 大きなデジタル時計 */}
        <div 
          style={{ 
            fontFamily: "'Outfit', sans-serif", 
            fontSize: '4.5rem', 
            fontWeight: 800, 
            lineHeight: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'baseline',
            gap: '8px',
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          <span className="gradient-text">{formatHoursMinutes(time)}</span>
          <span 
            style={{ 
              fontSize: '2rem', 
              color: 'var(--text-muted)',
              fontWeight: 500
            }}
          >
            :{formatSeconds(time)}
          </span>
        </div>

        {/* 今日の日付 */}
        <div 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginTop: '16px',
            padding: '6px 16px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.95rem',
            color: 'var(--text-secondary)'
          }}
        >
          <Calendar size={14} style={{ color: '#feb47b' }} />
          <span>{formatDate(time.getTime())}</span>
        </div>
      </div>
    </div>
  );
};
