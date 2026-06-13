export interface WakeUpRecord {
  id: string;
  timestamp: number; // ミリ秒単位のタイムスタンプ
  note?: string;     // メモ（任意）
}

export interface AppSettings {
  targetTime: string; // "HH:MM" 形式、例: "07:00"
}
