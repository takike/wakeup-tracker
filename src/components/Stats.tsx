import React, { useMemo } from 'react';
import { BarChart2, Activity, Calendar, Percent } from 'lucide-react';
import type { WakeUpRecord } from '../types';
import { 
  calculateAverageTime, 
  calculateStreak, 
  calculateTargetAchievementRate, 
  getRecentChartData
} from '../utils';

interface StatsProps {
  records: WakeUpRecord[];
  targetTime: string;
}

export const Stats: React.FC<StatsProps> = ({ records, targetTime }) => {
  const avgTime = useMemo(() => calculateAverageTime(records), [records]);
  const streak = useMemo(() => calculateStreak(records), [records]);
  const achievementRate = useMemo(() => calculateTargetAchievementRate(records, targetTime), [records, targetTime]);
  const chartData = useMemo(() => getRecentChartData(records), [records]);

  // SVGグラフの座標計算
  const svgWidth = 600;
  const svgHeight = 250;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const graphWidth = svgWidth - paddingLeft - paddingRight;
  const graphHeight = svgHeight - paddingTop - paddingBottom;

  // 縦軸（起床時刻）のスケール決定
  // デフォルトは 04:00 (240分) 〜 10:00 (600分) とするが、データによっては自動拡張する
  const scaleBounds = useMemo(() => {
    const activeData = chartData.filter(d => d.timeInMinutes > 0);
    let minVal = 4 * 60; // 04:00
    let maxVal = 10 * 60; // 10:00

    if (activeData.length > 0) {
      const dataMins = activeData.map(d => d.timeInMinutes);
      const actualMin = Math.min(...dataMins);
      const actualMax = Math.max(...dataMins);

      // マージンを持たせて最小・最大を設定
      minVal = Math.min(minVal, Math.floor(actualMin / 60) * 60);
      maxVal = Math.max(maxVal, Math.ceil(actualMax / 60) * 60);
    }

    // もし差がない（例：毎日同じ時間）の場合は、範囲を広げる
    if (maxVal === minVal) {
      minVal -= 60;
      maxVal += 60;
    }

    return { min: minVal, max: maxVal };
  }, [chartData]);

  // 縦軸の目盛り値 (例えば2時間刻み)
  const yAxisTicks = useMemo(() => {
    const ticks: number[] = [];
    const interval = 60; // 1時間刻み
    
    // スケール範囲内で1時間ごとに線を引く
    for (let m = scaleBounds.min; m <= scaleBounds.max; m += interval) {
      ticks.push(m);
    }
    return ticks;
  }, [scaleBounds]);

  // 分の値をY座標にマッピングする関数
  const getX = (index: number) => {
    return paddingLeft + (index * graphWidth) / 6;
  };

  const getY = (timeInMinutes: number) => {
    if (timeInMinutes === 0) return 0;
    const ratio = (timeInMinutes - scaleBounds.min) / (scaleBounds.max - scaleBounds.min);
    // Y座標は上が0で下がsvgHeightなので、反転させる
    return svgHeight - paddingBottom - ratio * graphHeight;
  };

  // グラフ用パスデータ作成
  const { pathD, areaD, points } = useMemo(() => {
    const validPoints = chartData
      .map((d, index) => ({
        x: getX(index),
        y: getY(d.timeInMinutes),
        data: d,
        isValid: d.timeInMinutes > 0
      }))
      .filter(p => p.isValid);

    if (validPoints.length === 0) {
      return { pathD: '', areaD: '', points: [] };
    }

    // 折れ線用パスの組み立て
    let pD = `M ${validPoints[0].x} ${validPoints[0].y}`;
    for (let i = 1; i < validPoints.length; i++) {
      pD += ` L ${validPoints[i].x} ${validPoints[i].y}`;
    }

    // 塗りつぶしエリア用パスの組み立て (下部に閉じる)
    let aD = `M ${validPoints[0].x} ${svgHeight - paddingBottom}`;
    validPoints.forEach((p) => {
      aD += ` L ${p.x} ${p.y}`;
    });
    aD += ` L ${validPoints[validPoints.length - 1].x} ${svgHeight - paddingBottom} Z`;

    return { pathD: pD, areaD: aD, points: validPoints };
  }, [chartData, scaleBounds, graphHeight]);

  const formatMinutesToTimeStr = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 統計概要カードグリッド */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}
      >
        {/* 平均起床時間 */}
        <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>平均起床時間</span>
            <Activity size={18} style={{ color: '#feb47b' }} />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit' }} className="gradient-text">
            {avgTime}
          </span>
        </div>

        {/* 連続日数 */}
        <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px', animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>現在のストリーク</span>
            <Calendar size={18} style={{ color: '#ff7e5f' }} />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit' }}>
            {streak}日
          </span>
        </div>

        {/* 目標達成率 */}
        <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px', animationDelay: '0.2s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>目標達成率</span>
            <Percent size={18} style={{ color: '#a580ff' }} />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit' }}>
            {achievementRate}%
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            目標: {targetTime} 以前
          </span>
        </div>
      </div>

      {/* 折れ線グラフカード */}
      <div className="glass-card animate-fade-in" style={{ padding: '20px', animationDelay: '0.3s' }}>
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '20px',
            color: 'var(--text-secondary)'
          }}
        >
          <BarChart2 size={18} style={{ color: '#ff7e5f' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>直近7日間の推移</h3>
        </div>

        {records.length === 0 ? (
          <div 
            style={{ 
              height: `${svgHeight}px`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--text-muted)',
              fontSize: '0.95rem'
            }}
          >
            データがありません。記録を開始してください。
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <div style={{ minWidth: '550px', position: 'relative' }}>
              <svg 
                viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                style={{ width: '100%', height: 'auto', overflow: 'visible' }}
              >
                <defs>
                  {/* 線用のグラデーション */}
                  <linearGradient id="chart-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ff7e5f" />
                    <stop offset="100%" stopColor="#feb47b" />
                  </linearGradient>

                  {/* 塗りつぶしエリア用のグラデーション */}
                  <linearGradient id="chart-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff7e5f" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ff7e5f" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* 縦軸の目盛り線・補助線 */}
                {yAxisTicks.map((tickValue) => {
                  const y = getY(tickValue);
                  return (
                    <g key={tickValue}>
                      <line 
                        x1={paddingLeft} 
                        y1={y} 
                        x2={svgWidth - paddingRight} 
                        y2={y} 
                        className="chart-grid-line"
                      />
                      <text 
                        x={paddingLeft - 10} 
                        y={y + 4} 
                        fill="var(--text-muted)" 
                        fontSize="10" 
                        textAnchor="end"
                        fontFamily="'Inter', sans-serif"
                      >
                        {formatMinutesToTimeStr(tickValue)}
                      </text>
                    </g>
                  );
                })}

                {/* 横軸（日付ラベル） */}
                {chartData.map((d, index) => {
                  const x = getX(index);
                  return (
                    <text 
                      key={index}
                      x={x} 
                      y={svgHeight - 15} 
                      fill="var(--text-secondary)" 
                      fontSize="11" 
                      textAnchor="middle"
                      fontFamily="'Outfit', sans-serif"
                      fontWeight={500}
                    >
                      {d.dateLabel}
                    </text>
                  );
                })}

                {/* グラフの塗りつぶしエリア */}
                {areaD && (
                  <path d={areaD} className="chart-area" />
                )}

                {/* グラフの折れ線 */}
                {pathD && (
                  <path d={pathD} className="chart-line" fill="none" />
                )}

                {/* データポイントのドットとツールチップ表示用エリア */}
                {points.map((p, index) => (
                  <g key={index}>
                    {/* ドットの背景（ホバーしやすくするための広めのインジケータ） */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="12" 
                      fill="transparent" 
                      style={{ cursor: 'pointer' }}
                    />
                    
                    {/* 実際のドット */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="5" 
                      className="chart-point" 
                    />

                    {/* データラベル */}
                    <text 
                      x={p.x} 
                      y={p.y - 12} 
                      fill="white" 
                      fontSize="10" 
                      fontWeight="600"
                      textAnchor="middle"
                      fontFamily="'Outfit', sans-serif"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                    >
                      {p.data.timeStr}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '24px', 
                marginTop: '15px', 
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff7e5f, #feb47b)', display: 'inline-block' }} />
                <span>起床時刻</span>
              </div>
              <div>
                <span>※グラフは直近7日間のデータがある日のみをプロットしています。</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
