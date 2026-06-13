import type { WakeUpRecord } from './types';

// 日付オブジェクトから曜日を取得する日本語配列
const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土'];

// 時刻を "HH:MM" にフォーマット
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// 秒まで含めた "HH:MM:SS" フォーマット
export function formatTimeWithSeconds(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// 日付を "YYYY/MM/DD (曜日)" にフォーマット
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dayOfWeek = DAYS_OF_WEEK[date.getDay()];
  return `${year}/${month}/${day} (${dayOfWeek})`;
}

// 時間帯に基づくタグの判定
export function getWakeUpTag(timestamp: number): { text: string; className: string } {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes < 6 * 60) {
    return { text: 'Early Bird 🌅', className: 'tag-early' };
  } else if (totalMinutes < 8 * 60) {
    return { text: 'Fresh Start ☀️', className: 'tag-fresh' };
  } else {
    return { text: 'Relaxed Morning ☕', className: 'tag-relaxed' };
  }
}

// 2つの日付が同じ日かどうかをチェック
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// 平均起床時間の計算 (HH:MM)
export function calculateAverageTime(records: WakeUpRecord[]): string {
  if (records.length === 0) return '--:--';

  let totalMinutes = 0;
  records.forEach((record) => {
    const date = new Date(record.timestamp);
    totalMinutes += date.getHours() * 60 + date.getMinutes();
  });

  const avgMinutes = Math.round(totalMinutes / records.length);
  const avgHours = Math.floor(avgMinutes / 60);
  const avgMins = avgMinutes % 60;

  return `${String(avgHours).padStart(2, '0')}:${String(avgMins).padStart(2, '0')}`;
}

// 連続起床記録日数（ストリーク）の計算
export function calculateStreak(records: WakeUpRecord[]): number {
  if (records.length === 0) return 0;

  // 日付の降順（新しい順）にソート
  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);

  // 各レコードを日付の文字列（YYYY-MM-DD）にして重複を除外
  const uniqueDates: string[] = [];
  sortedRecords.forEach((r) => {
    const d = new Date(r.timestamp);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!uniqueDates.includes(dateStr)) {
      uniqueDates.push(dateStr);
    }
  });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // 最新の記録が今日でも昨日でもない場合、ストリークは途切れている
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let currentDateToCheck = new Date(uniqueDates[0]);

  for (let i = 0; i < uniqueDates.length; i++) {
    const dateStr = `${currentDateToCheck.getFullYear()}-${String(currentDateToCheck.getMonth() + 1).padStart(2, '0')}-${String(currentDateToCheck.getDate()).padStart(2, '0')}`;
    
    if (uniqueDates.includes(dateStr)) {
      streak++;
      // チェック対象を1日前に戻す
      currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// 目標起床時間の達成率の計算
export function calculateTargetAchievementRate(records: WakeUpRecord[], targetTimeStr: string): number {
  if (records.length === 0) return 0;

  const [targetHours, targetMinutes] = targetTimeStr.split(':').map(Number);
  const targetTotalMinutes = targetHours * 60 + targetMinutes;

  let achievedCount = 0;
  records.forEach((record) => {
    const date = new Date(record.timestamp);
    const totalMinutes = date.getHours() * 60 + date.getMinutes();
    if (totalMinutes <= targetTotalMinutes) {
      achievedCount++;
    }
  });

  return Math.round((achievedCount / records.length) * 100);
}

// 直近7日間の統計データを取得（グラフ用）
export interface ChartDataPoint {
  dateLabel: string;
  timeInMinutes: number; // 0:00からの経過分数
  timeStr: string;       // 表示用時間文字列 (HH:MM)
  rawTimestamp: number;
}

export function getRecentChartData(records: WakeUpRecord[]): ChartDataPoint[] {
  // 直近7日間の日付リストを生成 (今日からさかのぼって7日間)
  const chartData: ChartDataPoint[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    
    // その日のレコードを探す (複数ある場合は最初のもの)
    const recordOnDay = records.find((r) => isSameDay(new Date(r.timestamp), d));

    if (recordOnDay) {
      const recDate = new Date(recordOnDay.timestamp);
      const mins = recDate.getHours() * 60 + recDate.getMinutes();
      chartData.push({
        dateLabel: dateStr,
        timeInMinutes: mins,
        timeStr: formatTime(recordOnDay.timestamp),
        rawTimestamp: recordOnDay.timestamp
      });
    } else {
      // 記録がない日は目標時間（デフォルト7時間 = 420分）やnullではなく、0または平均などを入れるが、
      // グラフ上「データなし」を表現できるように timeInMinutes を 0 (または undefined/null) にする
      chartData.push({
        dateLabel: dateStr,
        timeInMinutes: 0,
        timeStr: '-',
        rawTimestamp: 0
      });
    }
  }

  return chartData;
}
