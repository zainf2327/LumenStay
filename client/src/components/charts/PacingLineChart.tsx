import React, { useState, useMemo } from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';

interface PacingWeek {
  week: number;
  label: string;
  currentOtb: number; // On The Books Room Nights
  lastYearOtb: number;
  peakEvent?: string;
  currentAdr: number;
  lastYearAdr: number;
}

const PACING_DATA: PacingWeek[] = [
  { week: 1, label: 'Nov 15', currentOtb: 120, lastYearOtb: 110, currentAdr: 320, lastYearAdr: 295 },
  { week: 2, label: 'Nov 22', currentOtb: 185, lastYearOtb: 160, currentAdr: 340, lastYearAdr: 310, peakEvent: 'Thanksgiving' },
  { week: 3, label: 'Nov 29', currentOtb: 210, lastYearOtb: 195, currentAdr: 345, lastYearAdr: 315 },
  { week: 4, label: 'Dec 06', currentOtb: 310, lastYearOtb: 280, currentAdr: 380, lastYearAdr: 350 },
  { week: 5, label: 'Dec 13', currentOtb: 440, lastYearOtb: 390, currentAdr: 420, lastYearAdr: 380 },
  { week: 6, label: 'Dec 20', currentOtb: 720, lastYearOtb: 640, currentAdr: 580, lastYearAdr: 510, peakEvent: 'Christmas Peak' },
  { week: 7, label: 'Dec 27', currentOtb: 890, lastYearOtb: 790, currentAdr: 640, lastYearAdr: 560, peakEvent: 'New Year Rush' },
  { week: 8, label: 'Jan 03', currentOtb: 530, lastYearOtb: 480, currentAdr: 410, lastYearAdr: 380 },
  { week: 9, label: 'Jan 10', currentOtb: 610, lastYearOtb: 540, currentAdr: 440, lastYearAdr: 395 },
  { week: 10, label: 'Jan 17', currentOtb: 780, lastYearOtb: 690, currentAdr: 520, lastYearAdr: 460, peakEvent: 'MLK Weekend' },
  { week: 11, label: 'Jan 24', currentOtb: 590, lastYearOtb: 550, currentAdr: 430, lastYearAdr: 400 },
  { week: 12, label: 'Jan 31', currentOtb: 640, lastYearOtb: 590, currentAdr: 460, lastYearAdr: 415 },
  { week: 13, label: 'Feb 07', currentOtb: 710, lastYearOtb: 620, currentAdr: 490, lastYearAdr: 440 },
  { week: 14, label: 'Feb 14', currentOtb: 860, lastYearOtb: 740, currentAdr: 590, lastYearAdr: 520, peakEvent: 'Presidents Day' },
  { week: 15, label: 'Feb 21', currentOtb: 680, lastYearOtb: 610, currentAdr: 480, lastYearAdr: 430 },
];

export const PacingLineChart: React.FC = () => {
  const [hoveredWeek, setHoveredWeek] = useState<PacingWeek | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const totalCurrentOtb = PACING_DATA.reduce((acc, p) => acc + p.currentOtb, 0);
  const totalLastYearOtb = PACING_DATA.reduce((acc, p) => acc + p.lastYearOtb, 0);
  const pacingDelta = totalCurrentOtb - totalLastYearOtb;
  const pacingPct = Math.round((pacingDelta / totalLastYearOtb) * 100);

  // SVG Coordinates & Scaling
  const width = 800;
  const height = 300;
  const padding = { top: 35, right: 30, bottom: 45, left: 55 };

  const maxVal = 1000;
  const minVal = 0;

  const getX = (index: number) => {
    const step = (width - padding.left - padding.right) / (PACING_DATA.length - 1);
    return padding.left + index * step;
  };

  const getY = (val: number) => {
    const plotHeight = height - padding.top - padding.bottom;
    const pct = (val - minVal) / (maxVal - minVal);
    return height - padding.bottom - pct * plotHeight;
  };

  // Build Paths
  const currentLinePath = useMemo(() => {
    return PACING_DATA.reduce((acc, pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.currentOtb);
      return idx === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, '');
  }, []);

  const lastYearLinePath = useMemo(() => {
    return PACING_DATA.reduce((acc, pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.lastYearOtb);
      return idx === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, '');
  }, []);

  const currentAreaPath = useMemo(() => {
    const startX = getX(0);
    const endX = getX(PACING_DATA.length - 1);
    const bottomY = height - padding.bottom;
    return `${currentLinePath} L ${endX},${bottomY} L ${startX},${bottomY} Z`;
  }, [currentLinePath]);

  // Handle Mouse Hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;

    if (mouseX < padding.left || mouseX > width - padding.right) {
      setHoveredWeek(null);
      setHoverX(null);
      return;
    }

    const plotWidth = width - padding.left - padding.right;
    const fraction = (mouseX - padding.left) / plotWidth;
    const index = Math.round(fraction * (PACING_DATA.length - 1));

    if (PACING_DATA[index]) {
      setHoveredWeek(PACING_DATA[index]);
      setHoverX(getX(index));
    }
  };

  const handleMouseLeave = () => {
    setHoveredWeek(null);
    setHoverX(null);
  };

  const yTicks = [0, 250, 500, 750, 1000];

  return (
    <div className="bg-white rounded-2xl border border-[#E2DCD2] p-6 shadow-sm space-y-6">
      {/* Top Header & Pacing KPI Pills */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EAE4D8]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-medium text-[#1C1815]">
              90-Day Booking Pacing vs. Last Ski Season
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#EBF4EF] text-[#236446] border border-[#C8E3D4] flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +{pacingPct}% Ahead of Pace
            </span>
          </div>
          <p className="text-xs text-[#736B63] mt-0.5">
            Compares room nights on-the-books (OTB) for the upcoming winter against identical dates last year.
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE4D8] text-right">
            <div className="text-[10px] uppercase font-semibold text-[#736B63]">Total OTB Nights</div>
            <div className="text-sm font-serif font-bold text-[#1C1815]">
              {totalCurrentOtb.toLocaleString()} <span className="text-[#236446] text-xs font-sans">(+{pacingDelta})</span>
            </div>
          </div>
          <div className="px-3.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE4D8] text-right">
            <div className="text-[10px] uppercase font-semibold text-[#736B63]">Pace Growth</div>
            <div className="text-sm font-serif font-bold text-[#236446] flex items-center justify-end gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +{pacingPct}% YoY
            </div>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="pacingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#236446" stopOpacity="0.22" />
              <stop offset="80%" stopColor="#236446" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#236446" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {yTicks.map((val) => (
            <g key={val}>
              <line
                x1={padding.left}
                y1={getY(val)}
                x2={width - padding.right}
                y2={getY(val)}
                stroke="#EFEBE4"
                strokeWidth="1"
                strokeDasharray={val === 0 ? undefined : '3 3'}
              />
              <text
                x={padding.left - 10}
                y={getY(val) + 3.5}
                fill="#8C847B"
                fontSize="10"
                textAnchor="end"
                fontFamily="sans-serif"
              >
                {val}
              </text>
            </g>
          ))}

          {/* Peak Holiday Background Bands */}
          {PACING_DATA.map((p, idx) => {
            if (!p.peakEvent) return null;
            const x = getX(idx);
            return (
              <g key={idx}>
                <rect
                  x={x - 22}
                  y={padding.top}
                  width="44"
                  height={height - padding.top - padding.bottom}
                  fill="#B08D57"
                  opacity="0.08"
                  rx="4"
                />
                <text
                  x={x}
                  y={padding.top - 8}
                  fill="#8C621E"
                  fontSize="9"
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {p.peakEvent}
                </text>
              </g>
            );
          })}

          {/* Last Year Baseline (Dashed) */}
          <path
            d={lastYearLinePath}
            fill="none"
            stroke="#8C847B"
            strokeWidth="2"
            strokeDasharray="4 3"
          />

          {/* Current Year Area & Line */}
          <path d={currentAreaPath} fill="url(#pacingGradient)" />
          <path
            d={currentLinePath}
            fill="none"
            stroke="#236446"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Current Data Points */}
          {PACING_DATA.map((p, idx) => {
            const x = getX(idx);
            const y = getY(p.currentOtb);
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3.5"
                fill="#236446"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            );
          })}

          {/* X Axis Labels */}
          {PACING_DATA.map((p, idx) => {
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={height - 18}
                fill="#736B63"
                fontSize="9.5"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {p.label}
              </text>
            );
          })}

          {/* Hover Guide */}
          {hoveredWeek && hoverX !== null && (
            <g>
              <line
                x1={hoverX}
                y1={padding.top}
                x2={hoverX}
                y2={height - padding.bottom}
                stroke="#1C1815"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />
              <circle
                cx={hoverX}
                cy={getY(hoveredWeek.currentOtb)}
                r="5.5"
                fill="#236446"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <circle
                cx={hoverX}
                cy={getY(hoveredWeek.lastYearOtb)}
                r="4.5"
                fill="#8C847B"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {hoveredWeek && hoverX !== null && (
          <div
            className="absolute top-2 pointer-events-none transition-all duration-75 bg-[#1C1815] text-[#F7F4EE] rounded-xl px-4 py-3 shadow-xl border border-[#4A433D] text-xs space-y-1.5 z-20"
            style={{
              left: `${Math.min(75, Math.max(20, (hoverX / width) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#3A332C] pb-1">
              <span className="font-semibold text-white">
                Week of {hoveredWeek.label} {hoveredWeek.peakEvent ? `• ${hoveredWeek.peakEvent}` : ''}
              </span>
              <span className="text-[10px] text-[#B08D57] font-mono">Week {hoveredWeek.week}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-0.5">
              <div>
                <div className="text-[10px] text-[#A69E95]">2026/27 OTB</div>
                <div className="text-base font-bold text-[#4ADE80]">
                  {hoveredWeek.currentOtb} <span className="text-[10px] font-normal text-white">nights</span>
                </div>
                <div className="text-[10px] text-[#E5C388] mt-0.5">ADR: ${hoveredWeek.currentAdr}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#A69E95]">Last Year Actual</div>
                <div className="text-base font-bold text-[#D4CFC9]">
                  {hoveredWeek.lastYearOtb} <span className="text-[10px] font-normal text-[#A69E95]">nights</span>
                </div>
                <div className="text-[10px] text-[#A69E95] mt-0.5">ADR: ${hoveredWeek.lastYearAdr}</div>
              </div>
            </div>
            <div className="pt-1 border-t border-[#3A332C] flex items-center justify-between text-[10px]">
              <span className="text-[#A69E95]">Variance:</span>
              <span className="text-[#4ADE80] font-bold">
                +{hoveredWeek.currentOtb - hoveredWeek.lastYearOtb} Nights (+{Math.round(((hoveredWeek.currentOtb - hoveredWeek.lastYearOtb) / hoveredWeek.lastYearOtb) * 100)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Legend */}
      <div className="pt-3 border-t border-[#EAE4D8] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-[#236446] rounded-full" />
            <span className="text-[#1C1815] font-medium">2026/27 Season Pace (OTB)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#8C847B]" />
            <span className="text-[#736B63]">2025/26 Historical Actuals</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-[#B08D57]/20 border border-[#B08D57]/40" />
            <span className="text-[#8C621E]">Holiday Surge Windows</span>
          </div>
        </div>

        <div className="text-[11px] text-[#736B63]">
          Hover points to compare room pickup &amp; ADR variances week-by-week
        </div>
      </div>
    </div>
  );
};
