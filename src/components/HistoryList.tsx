import React, { useState } from 'react';
import { Trash2, Plus, Calendar, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import type { WakeUpRecord } from '../types';
import { formatDate, formatTime, getWakeUpTag } from '../utils';

interface HistoryListProps {
  records: WakeUpRecord[];
  onAddRecord: (timestamp: number, note?: string) => void;
  onDeleteRecord: (id: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ records, onAddRecord, onDeleteRecord }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualDate, setManualDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [manualTime, setManualTime] = useState('07:00');
  const [manualNote, setManualNote] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 履歴を新しい順にソート
  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!manualDate || !manualTime) {
      setErrorMessage('日付と時刻を入力してください。');
      return;
    }

    // 入力された日付と時間からタイムスタンプを生成
    // ブラウザのタイムゾーンで解釈されるように組み立てる
    const datetimeStr = `${manualDate}T${manualTime}:00`;
    const timestamp = new Date(datetimeStr).getTime();

    if (isNaN(timestamp)) {
      setErrorMessage('有効な日時を入力してください。');
      return;
    }

    // 同じ日付のデータがすでに存在するかチェック
    const checkDate = new Date(timestamp);
    const dateAlreadyExists = records.some((r) => {
      const d = new Date(r.timestamp);
      return (
        d.getFullYear() === checkDate.getFullYear() &&
        d.getMonth() === checkDate.getMonth() &&
        d.getDate() === checkDate.getDate()
      );
    });

    if (dateAlreadyExists) {
      setErrorMessage('この日付の記録は既に存在します。1日につき1レコードのみ登録可能です。');
      return;
    }

    onAddRecord(timestamp, manualNote.trim() || undefined);
    
    // フォームを閉じてリセット
    setManualNote('');
    setShowAddForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 手動追加フォームアコーディオン */}
      <div className="glass-card animate-fade-in" style={{ padding: '16px' }}>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: 'transparent',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            fontWeight: 600
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: '#feb47b' }} />
            起床記録を手動で追加
          </span>
          {showAddForm ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showAddForm && (
          <form onSubmit={handleSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="input-group">
                <label htmlFor="manual-date">日付</label>
                <input
                  id="manual-date"
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="manual-time">時刻</label>
                <input
                  id="manual-time"
                  type="time"
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="manual-note">今朝のひとことメモ</label>
              <input
                id="manual-note"
                type="text"
                placeholder="気分、天気など..."
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                className="form-input"
              />
            </div>

            {errorMessage && (
              <div style={{ color: '#ff7e7e', fontSize: '0.85rem', fontWeight: 500 }}>
                {errorMessage}
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '0.95rem' }}>
              追加する
            </button>
          </form>
        )}
      </div>

      {/* 履歴リスト */}
      <div className="glass-card animate-fade-in" style={{ padding: '20px', animationDelay: '0.1s' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white', marginBottom: '20px' }}>
          履歴一覧 ({records.length}件)
        </h3>

        {sortedRecords.length === 0 ? (
          <div 
            style={{ 
              textAlign: 'center', 
              padding: '40px 0', 
              color: 'var(--text-muted)',
              fontSize: '0.95rem'
            }}
          >
            起床記録がありません。
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedRecords.map((record) => {
              const tag = getWakeUpTag(record.timestamp);
              return (
                <div 
                  key={record.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    transition: 'var(--transition-smooth)',
                    position: 'relative'
                  }}
                  className="history-item-hover"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    
                    {/* 日付・時間 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 600 }}>
                        <Calendar size={14} style={{ color: '#feb47b' }} />
                        <span>{formatDate(record.timestamp)}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit' }}>
                        <Clock size={14} style={{ color: '#ff7e5f' }} />
                        <span>{formatTime(record.timestamp)}</span>
                      </div>
                    </div>

                    {/* タグと削除ボタン */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`tag ${tag.className}`}>{tag.text}</span>
                      
                      <button
                        onClick={() => {
                          if (window.confirm(`${formatDate(record.timestamp)} の記録を削除しますか？`)) {
                            onDeleteRecord(record.id);
                          }
                        }}
                        style={{
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          padding: '6px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'var(--transition-smooth)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ff7e7e'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                  </div>

                  {/* メモ */}
                  {record.note && (
                    <div 
                      style={{ 
                        display: 'flex', 
                        gap: '6px', 
                        background: 'rgba(0, 0, 0, 0.15)',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <MessageSquare size={14} style={{ marginTop: '3px', flexShrink: 0, color: 'var(--text-muted)' }} />
                      <span style={{ wordBreak: 'break-all' }}>{record.note}</span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
