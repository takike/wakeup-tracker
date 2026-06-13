import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, Download, Upload, Trash2, Check, AlertTriangle } from 'lucide-react';
import type { WakeUpRecord, AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  records: WakeUpRecord[];
  onUpdateSettings: (settings: AppSettings) => void;
  onImportData: (records: WakeUpRecord[], settings: AppSettings) => void;
  onClearAllData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  records,
  onUpdateSettings,
  onImportData,
  onClearAllData
}) => {
  const [targetTime, setTargetTime] = useState(settings.targetTime);
  const [isSaved, setIsSaved] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ targetTime });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // データのダウンロード（エクスポート）
  const handleExport = () => {
    const backupData = {
      version: '1.0',
      records,
      settings
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    a.download = `risesync-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // データの読み込み（インポート）
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess(false);
    
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonText = event.target?.result as string;
        const parsedData = JSON.parse(jsonText);

        // かんたんなバリデーション
        if (!parsedData || typeof parsedData !== 'object') {
          throw new Error('データ形式が不正です。');
        }

        const importedRecords = parsedData.records;
        const importedSettings = parsedData.settings;

        if (!Array.isArray(importedRecords)) {
          throw new Error('記録データ (records) が見つからないか、配列ではありません。');
        }

        // 各レコードの構造チェック
        const isValidRecords = importedRecords.every(
          (r: any) => typeof r.id === 'string' && typeof r.timestamp === 'number'
        );

        if (!isValidRecords) {
          throw new Error('レコードの中に不正なフォーマットが含まれています。');
        }

        // 設定のデフォルト値補正
        const targetTimeStr = importedSettings?.targetTime || '07:00';
        
        onImportData(importedRecords, { targetTime: targetTimeStr });
        setImportSuccess(true);
        if (fileInputRef.current) fileInputRef.current.value = ''; // フォームリセット
      } catch (error: any) {
        setImportError(error.message || 'JSONファイルのパースに失敗しました。');
      }
    };

    reader.readAsText(file);
  };

  const handleClearClick = () => {
    const confirm1 = window.confirm('【警告】すべての起床記録と設定が完全に消去されます。本当によろしいですか？');
    if (confirm1) {
      const confirm2 = window.confirm('本当に復元できません。よろしいですか？');
      if (confirm2) {
        onClearAllData();
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 目標時間設定 */}
      <div className="glass-card animate-fade-in" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <SettingsIcon size={18} style={{ color: '#feb47b' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>目標設定</h3>
        </div>

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group" style={{ maxWidth: '300px' }}>
            <label htmlFor="target-time">目標起床時間</label>
            <input
              id="target-time"
              type="time"
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              className="form-input"
            />
          </div>

          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: '0.95rem' }}>
            {isSaved ? (
              <>
                <Check size={16} />
                設定を保存しました
              </>
            ) : (
              '設定を保存'
            )}
          </button>
        </form>
      </div>

      {/* データバックアップと復元 */}
      <div className="glass-card animate-fade-in" style={{ padding: '20px', animationDelay: '0.1s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Download size={18} style={{ color: '#ff7e5f' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>データのバックアップと復元</h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
          本アプリのデータはブラウザのLocalStorageに保存されています。PCの乗り換え時やブラウザのデータクリアに備えて、定期的にバックアップをダウンロードすることをお勧めします。
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* エクスポート */}
          <button onClick={handleExport} className="btn-secondary">
            <Download size={16} />
            データをエクスポート (JSON)
          </button>

          {/* インポート */}
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} />
            データをインポート (JSON)
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              ref={fileInputRef}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {importSuccess && (
          <div style={{ marginTop: '15px', color: '#4eefb2', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={14} />
            データのインポートに成功しました！
          </div>
        )}

        {importError && (
          <div style={{ marginTop: '15px', color: '#ff7e7e', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={14} />
            エラー: {importError}
          </div>
        )}
      </div>

      {/* 危険ゾーン（初期化） */}
      <div 
        className="glass-card animate-fade-in" 
        style={{ 
          padding: '20px', 
          animationDelay: '0.2s', 
          border: '1px solid rgba(255, 126, 95, 0.2)',
          background: 'rgba(255, 126, 95, 0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#ff7e5f' }}>
          <AlertTriangle size={18} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>デンジャーゾーン</h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
          すべての起床履歴、連続記録日数、目標時間などの設定データがローカルストレージから完全に削除されます。この操作は取り消せません。
        </p>

        <button 
          onClick={handleClearClick} 
          className="btn-secondary" 
          style={{ 
            borderColor: 'rgba(255, 126, 95, 0.3)', 
            color: '#ff7e5f'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 126, 95, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--glass-bg)';
          }}
        >
          <Trash2 size={16} />
          すべてのデータを初期化する
        </button>
      </div>

    </div>
  );
};
