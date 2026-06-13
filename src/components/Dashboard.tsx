import React, { useState, useEffect } from 'react';
import { Sun, CheckCircle, Award, FileText } from 'lucide-react';
import type { WakeUpRecord } from '../types';
import { isSameDay, formatTime, getWakeUpTag } from '../utils';

interface DashboardProps {
  records: WakeUpRecord[];
  onRecordWakeUp: (note: string) => void;
  streak: number;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ records, onRecordWakeUp, streak }) => {
  const [note, setNote] = useState('');
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [todayRecord, setTodayRecord] = useState<WakeUpRecord | null>(null);

  // 今日すでに記録したかを判定
  useEffect(() => {
    const today = new Date();
    const found = records.find((r) => isSameDay(new Date(r.timestamp), today));
    setTodayRecord(found || null);
  }, [records]);

  const handleWakeUpClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (todayRecord) return;

    // ボタンの位置を取得してキラキラエフェクトの座標を生成
    const rect = e.currentTarget.getBoundingClientRect();
    const newSparkles: Sparkle[] = [];
    const sparkleCount = 15;

    for (let i = 0; i < sparkleCount; i++) {
      // ボタンの周りに散らばる座標をランダム生成
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 80;
      const x = rect.width / 2 + Math.cos(angle) * distance;
      const y = rect.height / 2 + Math.sin(angle) * distance;
      const size = 5 + Math.random() * 12;

      newSparkles.push({
        id: Date.now() + i,
        x,
        y,
        size
      });
    }

    setSparkles(newSparkles);

    // アニメーション完了後にキラキラを消去
    setTimeout(() => {
      setSparkles([]);
    }, 800);

    // 親コンポーネントに起床を記録
    onRecordWakeUp(note);
    setNote(''); // 入力クリア
  };

  const getGreetingMessage = (timestamp: number) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    if (hour < 6) return 'ものすごい早起きですね！素晴らしい一日のスタートです。';
    if (hour < 8) return 'さわやかな朝ですね！今日も良い一日になりますように。';
    if (hour < 10) return 'おはようございます！今日も自分のペースでいきましょう。';
    return 'しっかり睡眠を取れましたね！充実した一日にしましょう。';
  };

  return (
    <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      
      {/* ストリーク（連続記録日数）バッジ */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(255, 126, 95, 0.1)',
          border: '1px solid rgba(255, 126, 95, 0.2)',
          borderRadius: '16px',
          alignSelf: 'flex-start',
          color: '#ffb87d',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}
      >
        <Award size={16} />
        <span>連続記録: {streak}日</span>
      </div>

      <div style={{ textAlign: 'center', margin: '15px 0' }}>
        {todayRecord ? (
          /* 今日すでに記録済みの場合 */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(78, 239, 178, 0.1)',
                border: '2px solid var(--color-early)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-early)',
                marginBottom: '10px'
              }}
            >
              <CheckCircle size={40} />
            </div>
            
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>
              今日の起床を記録しました！
            </h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>
                {formatTime(todayRecord.timestamp)}
              </span>
              
              {(() => {
                const tag = getWakeUpTag(todayRecord.timestamp);
                return <span className={`tag ${tag.className}`}>{tag.text}</span>;
              })()}
            </div>

            <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', fontSize: '0.95rem', lineHeight: '1.6', marginTop: '10px' }}>
              {getGreetingMessage(todayRecord.timestamp)}
            </p>

            {todayRecord.note && (
              <div 
                style={{ 
                  marginTop: '15px', 
                  padding: '12px 16px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  width: '100%',
                  maxWidth: '400px',
                  textAlign: 'left',
                  display: 'flex',
                  gap: '8px'
                }}
              >
                <FileText size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0, marginTop: '3px' }} />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px', fontWeight: 600 }}>今日のメモ</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{todayRecord.note}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 今日まだ未記録の場合 */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'white' }}>
              おはようございます！
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              起きたらボタンを押して、今日の時間を記録しましょう。
            </p>

            {/* メモ書きフィールド */}
            <div style={{ width: '100%', maxWidth: '400px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="morning-note" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                今朝のひとことメモ (任意)
              </label>
              <input
                id="morning-note"
                type="text"
                placeholder="気分、天気、見た夢など..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* 起きた！ボタン */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                className="btn-primary"
                onClick={handleWakeUpClick}
                style={{
                  padding: '20px 45px',
                  fontSize: '1.3rem',
                  borderRadius: '40px',
                  minWidth: '220px',
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                <Sun size={24} className="sun-icon" />
                起きた！
              </button>

              {/* キラキラ要素のレンダリング */}
              {sparkles.map((sparkle) => (
                <div
                  key={sparkle.id}
                  className="sparkle-effect"
                  style={{
                    left: `${sparkle.x}px`,
                    top: `${sparkle.y}px`,
                    width: `${sparkle.size}px`,
                    height: `${sparkle.size}px`
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
