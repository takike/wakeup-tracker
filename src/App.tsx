import React, { useState, useEffect, useMemo } from 'react';
import { Sun, History, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import type { WakeUpRecord, AppSettings } from './types';
import { Clock } from './components/Clock';
import { Dashboard } from './components/Dashboard';
import { Stats } from './components/Stats';
import { HistoryList } from './components/HistoryList';
import { Settings } from './components/Settings';
import { calculateStreak } from './utils';

// 初回起動用のダミーデータを作成するヘルパー
const generateDummyRecords = (): WakeUpRecord[] => {
  const dummy: WakeUpRecord[] = [];
  const today = new Date();
  
  // 過去5日間の起床データ（今日を除く）
  const times = ['06:45', '07:15', '06:30', '07:05', '06:50'];
  const notes = [
    'すっきり起きられた！🌅',
    'ちょっと夜更かししたかも💤',
    '早起き成功！散歩に行く🚶‍♂️',
    '雨の音で目が覚めた🌧️',
    'だいたい目標通り⏰'
  ];

  for (let i = 5; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const [h, m] = times[5 - i].split(':').map(Number);
    d.setHours(h, m, 0, 0);

    dummy.push({
      id: `dummy-${i}`,
      timestamp: d.getTime(),
      note: notes[5 - i]
    });
  }

  return dummy;
};

export const App: React.FC = () => {
  const [records, setRecords] = useState<WakeUpRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ targetTime: '07:00' });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stats' | 'history' | 'settings'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // 初回読み込み
  useEffect(() => {
    const storedRecords = localStorage.getItem('risesync_records');
    const storedSettings = localStorage.getItem('risesync_settings');

    if (storedRecords) {
      setRecords(JSON.parse(storedRecords));
    } else {
      // 記録がまったくない場合、体験用にダミーデータを自動生成
      const dummy = generateDummyRecords();
      setRecords(dummy);
      localStorage.setItem('risesync_records', JSON.stringify(dummy));
    }

    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    } else {
      localStorage.setItem('risesync_settings', JSON.stringify({ targetTime: '07:00' }));
    }

    setIsLoading(false);
  }, []);

  // レコード更新時のLocalStorage保存
  const saveRecords = (newRecords: WakeUpRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('risesync_records', JSON.stringify(newRecords));
  };

  // 設定更新時のLocalStorage保存
  const saveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('risesync_settings', JSON.stringify(newSettings));
  };

  // 今日の起床を記録
  const handleRecordWakeUp = (note: string) => {
    const now = new Date();
    
    // 重複チェック (同日の記録は1件のみ)
    const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const alreadyRecorded = records.some((r) => {
      const d = new Date(r.timestamp);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayStr;
    });

    if (alreadyRecorded) return;

    const newRecord: WakeUpRecord = {
      id: Date.now().toString(),
      timestamp: now.getTime(),
      note: note.trim() ? note : undefined
    };

    saveRecords([newRecord, ...records]);
  };

  // 手動で記録を追加
  const handleAddRecord = (timestamp: number, note?: string) => {
    const newRecord: WakeUpRecord = {
      id: Date.now().toString(),
      timestamp,
      note
    };

    saveRecords([newRecord, ...records]);
  };

  // 記録を削除
  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    saveRecords(updated);
  };

  // データのインポート
  const handleImportData = (importedRecords: WakeUpRecord[], importedSettings: AppSettings) => {
    saveRecords(importedRecords);
    saveSettings(importedSettings);
  };

  // データの初期化
  const handleClearAllData = () => {
    localStorage.removeItem('risesync_records');
    localStorage.removeItem('risesync_settings');
    setRecords([]);
    setSettings({ targetTime: '07:00' });
    setActiveTab('dashboard');
  };

  // ストリークの算出
  const streak = useMemo(() => calculateStreak(records), [records]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>
        Loading RiseSync...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* メインコンテナ */}
      <main style={{ flex: 1, padding: '24px 16px', maxWidth: '800px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* アプリヘッダー */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 5px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--primary-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255, 126, 95, 0.3)'
              }}
            >
              <Sun size={22} style={{ color: '#0f1026' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }} className="gradient-text">RiseSync</h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.05em' }}>MORNING HABITS TRACKER</span>
            </div>
          </div>
        </header>

        {/* 現在時刻時計 (常に上部に表示) */}
        <Clock />

        {/* タブナビゲーション */}
        <nav className="nav-tab-container">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Sun size={16} />
              <span>記録</span>
            </div>
          </button>
          
          <button 
            className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <BarChart2 size={16} />
              <span>統計</span>
            </div>
          </button>
          
          <button 
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <History size={16} />
              <span>履歴</span>
            </div>
          </button>
          
          <button 
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <SettingsIcon size={16} />
              <span>設定</span>
            </div>
          </button>
        </nav>

        {/* タブコンテンツ */}
        <div style={{ flex: 1 }}>
          {activeTab === 'dashboard' && (
            <Dashboard 
              records={records}
              onRecordWakeUp={handleRecordWakeUp}
              streak={streak}
            />
          )}

          {activeTab === 'stats' && (
            <Stats 
              records={records}
              targetTime={settings.targetTime}
            />
          )}

          {activeTab === 'history' && (
            <HistoryList 
              records={records}
              onAddRecord={handleAddRecord}
              onDeleteRecord={handleDeleteRecord}
            />
          )}

          {activeTab === 'settings' && (
            <Settings 
              settings={settings}
              records={records}
              onUpdateSettings={saveSettings}
              onImportData={handleImportData}
              onClearAllData={handleClearAllData}
            />
          )}
        </div>

      </main>

      {/* フッター */}
      <footer style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid rgba(255, 255, 255, 0.03)', marginTop: '40px' }}>
        <p>© 2026 RiseSync. Make your morning better.</p>
      </footer>

    </div>
  );
};

export default App;
