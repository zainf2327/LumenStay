import React, { useState } from 'react';
import { Flame, Activity } from 'lucide-react';
import { PacingLineChart } from '../../components/charts/PacingLineChart';

export const RevenueForecastTab: React.FC = () => {
  // Horizon Filter (7d, 14d, 30d, 90d)
  const [horizon, setHorizon] = useState<'7d' | '14d' | '30d' | '90d'>('30d');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Horizon Data Definitions
  const horizonData = {
    '7d': {
      bookedNights: 254,
      occupancy: 86,
      forecastRev: 96800,
      pacingDelta: '+9.2%',
      pointsOTB: [72, 76, 82, 88, 94, 91, 84],
      pointsLY: [68, 71, 74, 80, 85, 82, 78],
      pointsForecast: [75, 80, 86, 92, 98, 95, 89],
      labels: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
    },
    '14d': {
      bookedNights: 492,
      occupancy: 83,
      forecastRev: 188400,
      pacingDelta: '+11.8%',
      pointsOTB: [72, 82, 94, 84, 78, 88, 92, 79, 81, 86, 90, 87, 83, 80],
      pointsLY: [68, 74, 85, 78, 70, 80, 84, 72, 75, 79, 82, 80, 76, 73],
      pointsForecast: [75, 86, 98, 89, 82, 92, 96, 84, 85, 91, 94, 91, 87, 84],
      labels: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'D14'],
    },
    '30d': {
      bookedNights: 994,
      occupancy: 79,
      forecastRev: 382600,
      pacingDelta: '+14.5%',
      pointsOTB: [72, 85, 92, 78, 84, 95, 81, 76, 89, 93, 77, 85, 90, 82, 79, 88, 94, 80, 75, 86, 91, 78, 83, 89, 81, 77, 87, 92, 80, 78],
      pointsLY: [65, 76, 84, 70, 75, 86, 74, 69, 80, 84, 70, 77, 82, 74, 71, 79, 85, 73, 68, 78, 83, 70, 75, 81, 73, 69, 78, 83, 72, 70],
      pointsForecast: [76, 89, 96, 82, 88, 98, 85, 80, 93, 97, 81, 89, 94, 86, 83, 92, 97, 84, 79, 90, 95, 82, 87, 93, 85, 81, 91, 96, 84, 82],
      labels: Array.from({ length: 30 }, (_, i) => `D${i + 1}`),
    },
    '90d': {
      bookedNights: 2680,
      occupancy: 72,
      forecastRev: 1042500,
      pacingDelta: '+6.8%',
      pointsOTB: [79, 84, 78, 72, 69, 75, 82, 76, 70, 67, 73, 80, 74, 68, 65, 71, 78, 72],
      pointsLY: [71, 76, 70, 65, 62, 67, 74, 68, 63, 60, 65, 72, 66, 61, 58, 63, 70, 65],
      pointsForecast: [82, 88, 82, 76, 73, 79, 86, 80, 74, 71, 77, 84, 78, 72, 69, 75, 82, 76],
      labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13'],
    },
  };

  const activeData = horizonData[horizon];

  // 30-Day Demand Calendar Compression Grid
  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    const isWeekend = (dayNum % 7 === 5 || dayNum % 7 === 6);
    const isFestival = dayNum === 14 || dayNum === 15 || dayNum === 16;
    
    let occupancy = 65 + (dayNum % 10) * 2;
    if (isWeekend) occupancy += 18;
    if (isFestival) occupancy = 98;
    occupancy = Math.min(99, occupancy);

    let adr = 340 + Math.round(occupancy * 1.5);
    if (isFestival) adr = 540;

    let tier: 'peak' | 'high' | 'moderate' | 'low' = 'moderate';
    if (occupancy >= 90) tier = 'peak';
    else if (occupancy >= 75) tier = 'high';
    else if (occupancy >= 60) tier = 'moderate';
    else tier = 'low';

    return {
      day: dayNum,
      date: `Sept ${dayNum < 10 ? '0' + dayNum : dayNum}, 2026`,
      dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayNum % 7],
      occupancy,
      adr,
      tier,
      event: isFestival ? 'Aspen Film Festival' : isWeekend ? 'Weekend High Demand' : null,
      roomsBooked: Math.round((occupancy / 100) * 42),
    };
  });

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Top Horizon Selector & Executive Overview */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DCD2]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-[#8C621E] bg-[#FAF6EE] border border-[#ECE2CE] mb-1">
            <Activity className="w-3 h-3 text-[#B08D57]" /> Forward Predictive Pacing
          </div>
          <h2 className="text-xl font-serif font-semibold text-[#1C1815]">
            90-Day Pacing Trajectory & Horizon Forecast
          </h2>
          <p className="text-xs text-[#736B63]">
            Comparing on-the-books pickup velocity against historical benchmarks and algorithmic forecasts.
          </p>
        </div>

        {/* Horizon Pill Toggle */}
        <div className="flex items-center gap-1 bg-[#F4EFE6] p-1.5 rounded-xl border border-[#DDD7CD]">
          {(['7d', '14d', '30d', '90d'] as const).map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => {
                setHorizon(h);
                setSelectedDayIndex(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition cursor-pointer ${
                horizon === h
                  ? 'bg-[#1C1815] text-[#F7F4EE] shadow-xs'
                  : 'text-[#736B63] hover:text-[#1C1815] hover:bg-white'
              }`}
            >
              {h === '7d' ? '7 Days' : h === '14d' ? '14 Days' : h === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Horizon Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-1 shadow-xs">
          <span className="text-xs text-[#736B63] uppercase tracking-wider block font-medium">On-The-Books Nights</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1C1815]">{activeData.bookedNights}</span>
            <span className="text-xs text-[#236446] font-medium">{activeData.pacingDelta}</span>
          </div>
          <p className="text-[11px] text-[#736B63]">Pacing Ahead of Last Year</p>
        </div>

        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-1 shadow-xs">
          <span className="text-xs text-[#736B63] uppercase tracking-wider block font-medium">Projected Occupancy</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#8C621E]">{activeData.occupancy}%</span>
            <span className="text-xs text-[#8C621E] font-medium">Peak Cap 96%</span>
          </div>
          <p className="text-[11px] text-[#736B63]">Compression threshold active</p>
        </div>

        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-1 shadow-xs">
          <span className="text-xs text-[#736B63] uppercase tracking-wider block font-medium">Forecast Revenue</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#236446]">${activeData.forecastRev.toLocaleString()}</span>
            <span className="text-xs text-[#236446] font-medium">+12.4%</span>
          </div>
          <p className="text-[11px] text-[#736B63]">Target: ${Math.round(activeData.forecastRev * 0.92).toLocaleString()}</p>
        </div>

        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-1 shadow-xs">
          <span className="text-xs text-[#736B63] uppercase tracking-wider block font-medium">Pickup Velocity</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1C1815]">+18 / day</span>
            <span className="text-xs text-[#236446] font-medium">Rapid</span>
          </div>
          <p className="text-[11px] text-[#736B63]">Direct web conversion 68%</p>
        </div>
      </div>

      {/* 3. Dedicated 90-Day Booking Pacing vs. Last Season Curve */}
      <PacingLineChart />

      {/* 4. Interactive Multi-Series SVG Pacing Curve */}
      <div className="editorial-card rounded-2xl bg-white border border-[#DDD7CD] p-6 lg:p-8 space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-semibold text-[#1C1815] text-lg">
              Occupancy Pacing Wave Curve ({horizon.toUpperCase()})
            </h3>
            <p className="text-xs text-[#736B63]">
              Hover points to inspect exact occupancy percentage, forecast delta, and surge indicators.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#B08D57]" />
              <span className="text-[#4A433D] font-medium">OTB Current Year</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#236446]" />
              <span className="text-[#4A433D] font-medium">AI Optimal Forecast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#A89F91]" />
              <span className="text-[#736B63]">Same Time Last Year</span>
            </div>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="w-full h-64 sm:h-72 relative bg-[#FAF8F5] rounded-xl border border-[#E8E2D8] p-4 flex flex-col justify-end">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
            {/* Grid Horizontal Lines */}
            <line x1="0" y1="40" x2="800" y2="40" stroke="#E8E2D8" strokeDasharray="3 3" />
            <line x1="0" y1="90" x2="800" y2="90" stroke="#E8E2D8" strokeDasharray="3 3" />
            <line x1="0" y1="140" x2="800" y2="140" stroke="#E8E2D8" strokeDasharray="3 3" />

            {/* Area Fill for Forecast */}
            <path
              d={`M 0,200 ${activeData.pointsForecast
                .map((val, idx) => {
                  const x = (idx / (activeData.pointsForecast.length - 1)) * 800;
                  const y = 200 - (val / 100) * 180;
                  return `L ${x},${y}`;
                })
                .join(' ')} L 800,200 Z`}
              fill="url(#goldGradient)"
              opacity="0.15"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B08D57" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#B08D57" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Line 1: Same Time Last Year (Taupe) */}
            <polyline
              fill="none"
              stroke="#A89F91"
              strokeWidth="2"
              strokeDasharray="4 4"
              points={activeData.pointsLY
                .map((val, idx) => {
                  const x = (idx / (activeData.pointsLY.length - 1)) * 800;
                  const y = 200 - (val / 100) * 180;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Line 2: AI Optimal Forecast (Emerald) */}
            <polyline
              fill="none"
              stroke="#236446"
              strokeWidth="2.5"
              points={activeData.pointsForecast
                .map((val, idx) => {
                  const x = (idx / (activeData.pointsForecast.length - 1)) * 800;
                  const y = 200 - (val / 100) * 180;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Line 3: Current OTB (Gold/Amber) */}
            <polyline
              fill="none"
              stroke="#B08D57"
              strokeWidth="3.5"
              points={activeData.pointsOTB
                .map((val, idx) => {
                  const x = (idx / (activeData.pointsOTB.length - 1)) * 800;
                  const y = 200 - (val / 100) * 180;
                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {/* Interactive Data Points */}
            {activeData.pointsOTB.map((val, idx) => {
              const x = (idx / (activeData.pointsOTB.length - 1)) * 800;
              const y = 200 - (val / 100) * 180;
              const isSelected = selectedDayIndex === idx;

              return (
                <g key={idx} className="cursor-pointer" onClick={() => setSelectedDayIndex(idx)}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? '#1C1815' : '#B08D57'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="transition-all hover:r-7"
                  />
                </g>
              );
            })}
          </svg>

          {/* Selected Point Inspection Tooltip */}
          {selectedDayIndex !== null && (
            <div className="absolute top-3 right-4 bg-[#1C1815] text-[#F7F4EE] px-4 py-2.5 rounded-xl shadow-lg border border-[#3D352E] text-xs space-y-1 animate-fade-in">
              <p className="font-semibold text-[#D4AF37]">
                {activeData.labels[selectedDayIndex]} Pacing Breakdown
              </p>
              <div className="flex justify-between gap-4 text-[11px]">
                <span className="text-[#A89F91]">Current OTB:</span>
                <span className="font-bold text-white">{activeData.pointsOTB[selectedDayIndex]}% Occ</span>
              </div>
              <div className="flex justify-between gap-4 text-[11px]">
                <span className="text-[#A89F91]">AI Forecast:</span>
                <span className="font-bold text-[#7FD1AE]">{activeData.pointsForecast[selectedDayIndex]}% Occ</span>
              </div>
              <div className="flex justify-between gap-4 text-[11px]">
                <span className="text-[#A89F91]">Last Year:</span>
                <span className="text-white">{activeData.pointsLY[selectedDayIndex]}% Occ</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. 30-Day Daily Demand Compression Heatmap Calendar */}
      <div className="editorial-card rounded-2xl bg-white border border-[#DDD7CD] p-6 lg:p-8 space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DCD2]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-[#8C621E] bg-[#FAF6EE] border border-[#ECE2CE] mb-1">
              <Flame className="w-3 h-3 text-[#B08D57]" /> Demand Compression Heatmap
            </div>
            <h3 className="text-xl font-serif font-semibold text-[#1C1815]">
              Daily Occupancy & Yield Heatmap (September 2026)
            </h3>
            <p className="text-xs text-[#736B63]">
              Color-coded daily compression tiers with instant rate override access.
            </p>
          </div>

          {/* Tier Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#FAF0ED] border border-[#EACEC8]" />
              <span className="text-[#8C2F22] font-semibold">Peak 90%+</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#FDF6E8] border border-[#F7E5BD]" />
              <span className="text-[#8C621E] font-semibold">High 75-89%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-[#EBF4EF] border border-[#C8E3D4]" />
              <span className="text-[#236446] font-semibold">Healthy 60-74%</span>
            </div>
          </div>
        </div>

        {/* Calendar Heatmap Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {calendarDays.map((d) => {
            let bgClass = 'bg-[#EBF4EF] border-[#C8E3D4] text-[#236446]';
            if (d.tier === 'peak') bgClass = 'bg-[#FAF0ED] border-[#EACEC8] text-[#8C2F22]';
            else if (d.tier === 'high') bgClass = 'bg-[#FDF6E8] border-[#F7E5BD] text-[#8C621E]';

            return (
              <div
                key={d.day}
                className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-2 shadow-xs hover:scale-102 hover:shadow-md cursor-pointer ${bgClass}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{d.dayName}</span>
                    <p className="font-serif font-bold text-lg leading-tight">{d.day}</p>
                  </div>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-white/70 shadow-2xs">
                    {d.occupancy}%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span>ADR:</span>
                    <span>${d.adr}</span>
                  </div>
                  <div className="flex justify-between text-[10px] opacity-75">
                    <span>Rooms:</span>
                    <span>{d.roomsBooked} / 42</span>
                  </div>
                </div>

                {d.event && (
                  <div className="pt-1.5 border-t border-current/15 text-[9px] font-bold uppercase truncate">
                    ★ {d.event}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RevenueForecastTab;
