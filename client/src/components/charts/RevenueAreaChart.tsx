import React, { useState, useMemo, useRef } from 'react';
import { Info } from 'lucide-react';

interface RevenueAreaChartProps {
  baseAdr: number;
  simulatedAdr: number;
  simulatedRevPar: number;
  estimatedOccupancy: number;
  compsetAdr: number;
}

interface DataPoint {
  day: number;
  dateStr: string;
  isWeekend: boolean;
  adr: number;
  revPar: number;
  occupancy: number;
}

export const RevenueAreaChart: React.FC<RevenueAreaChartProps> = ({
  baseAdr,
  simulatedAdr,
  simulatedRevPar,
  estimatedOccupancy,
  compsetAdr,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [activeSeries, setActiveSeries] = useState<'both' | 'adr' | 'revpar'>('both');

  // Generate a realistic 30-day curve modeling ski-season peaks (weekends & holidays)
  const data: DataPoint[] = useMemo(() => {
    const points: DataPoint[] = [];
    const now = new Date();

    for (let i = 1; i <= 30; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Fri / Sat

      // Weekend surge factor & natural ski-season variance
      const weekendFactor = isWeekend ? 1.18 : 0.94;
      const wave = Math.sin((i / 30) * Math.PI * 2) * 0.08;
      const pointAdr = Math.round(simulatedAdr * (weekendFactor + wave));
      const pointOcc = Math.min(98, Math.max(55, Math.round(estimatedOccupancy * (isWeekend ? 1.14 : 0.92))));
      const pointRevPar = Math.round((pointAdr * pointOcc) / 100);

      points.push({
        day: i,
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isWeekend,
        adr: pointAdr,
        revPar: pointRevPar,
        occupancy: pointOcc,
      });
    }
    return points;
  }, [simulatedAdr, estimatedOccupancy]);

  // Chart dimensions & scaling
  const width = 800;
  const height = 280;
  const padding = { top: 30, right: 30, bottom: 40, left: 55 };

  const minVal = useMemo(() => {
    const minRev = Math.min(...data.map((d) => d.revPar));
    return Math.max(0, Math.floor(minRev * 0.75 / 50) * 50);
  }, [data]);

  const maxVal = useMemo(() => {
    const maxAdr = Math.max(...data.map((d) => d.adr), compsetAdr);
    return Math.ceil((maxAdr * 1.15) / 50) * 50;
  }, [data, compsetAdr]);

  const getX = (index: number) => {
    const step = (width - padding.left - padding.right) / (data.length - 1);
    return padding.left + index * step;
  };

  const getY = (val: number) => {
    const plotHeight = height - padding.top - padding.bottom;
    const pct = (val - minVal) / (maxVal - minVal);
    return height - padding.bottom - pct * plotHeight;
  };

  // Build SVG path strings with smooth curves
  const adrLinePath = useMemo(() => {
    return data.reduce((acc, pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.adr);
      return idx === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, '');
  }, [data, minVal, maxVal]);

  const revParLinePath = useMemo(() => {
    return data.reduce((acc, pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.revPar);
      return idx === 0 ? `M ${x},${y}` : `${acc} L ${x},${y}`;
    }, '');
  }, [data, minVal, maxVal]);

  const revParAreaPath = useMemo(() => {
    if (data.length === 0) return '';
    const startX = getX(0);
    const endX = getX(data.length - 1);
    const bottomY = height - padding.bottom;
    return `${revParLinePath} L ${endX},${bottomY} L ${startX},${bottomY} Z`;
  }, [revParLinePath, data]);

  // Handle Mouse Move for Hover Tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    
    if (mouseX < padding.left || mouseX > width - padding.right) {
      setHoveredPoint(null);
      setHoverX(null);
      return;
    }

    const plotWidth = width - padding.left - padding.right;
    const fraction = (mouseX - padding.left) / plotWidth;
    const index = Math.round(fraction * (data.length - 1));

    if (data[index]) {
      setHoveredPoint(data[index]);
      setHoverX(getX(index));
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverX(null);
  };

  // Horizontal Grid Lines
  const yTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    const step = (maxVal - minVal) / count;
    for (let i = 0; i <= count; i++) {
      const val = Math.round(minVal + i * step);
      ticks.push({ val, y: getY(val) });
    }
    return ticks;
  }, [minVal, maxVal]);

  return (
    <div className="bg-white rounded-2xl border border-[#E2DCD2] p-6 shadow-sm space-y-4" ref={containerRef}>
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EAE4D8]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-medium text-[#1C1815]">
              30-Day Rate &amp; RevPAR Yield Trajectory
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#EBF4EF] text-[#236446] border border-[#C8E3D4]">
              Simulated Forecast
            </span>
          </div>
          <p className="text-xs text-[#736B63] mt-0.5">
            Base ADR: <strong className="text-[#1C1815] font-semibold">${baseAdr}</strong> • Target RevPAR: <strong className="text-[#236446] font-semibold">${simulatedRevPar}</strong> • Weekend surge &amp; comp-set pricing.
          </p>
        </div>

        {/* Series Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#FAF8F5] border border-[#EAE4D8] text-xs">
          <button
            type="button"
            onClick={() => setActiveSeries('both')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium ${
              activeSeries === 'both'
                ? 'bg-[#1C1815] text-[#F7F4EE] shadow-xs'
                : 'text-[#736B63] hover:text-[#1C1815]'
            }`}
          >
            All Curves
          </button>
          <button
            type="button"
            onClick={() => setActiveSeries('adr')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium flex items-center gap-1 ${
              activeSeries === 'adr'
                ? 'bg-[#B08D57] text-white shadow-xs'
                : 'text-[#736B63] hover:text-[#1C1815]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#B08D57]" />
            ADR Only
          </button>
          <button
            type="button"
            onClick={() => setActiveSeries('revpar')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium flex items-center gap-1 ${
              activeSeries === 'revpar'
                ? 'bg-[#236446] text-white shadow-xs'
                : 'text-[#736B63] hover:text-[#1C1815]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#236446]" />
            RevPAR Area
          </button>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* RevPAR Emerald Gradient */}
            <linearGradient id="revparGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#236446" stopOpacity="0.28" />
              <stop offset="70%" stopColor="#236446" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#236446" stopOpacity="0.0" />
            </linearGradient>

            {/* Subtle Horizontal Grid Stroke */}
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F4EFE6" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Grid Background Lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="#EFEBE4"
                strokeWidth="1"
                strokeDasharray={i === 0 ? undefined : '3 3'}
              />
              <text
                x={padding.left - 10}
                y={tick.y + 3.5}
                fill="#8C847B"
                fontSize="10"
                textAnchor="end"
                fontFamily="sans-serif"
              >
                ${tick.val}
              </text>
            </g>
          ))}

          {/* Competitor Set Benchmark Line */}
          <line
            x1={padding.left}
            y1={getY(compsetAdr)}
            x2={width - padding.right}
            y2={getY(compsetAdr)}
            stroke="#C25442"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            opacity="0.75"
          />
          <text
            x={width - padding.right}
            y={getY(compsetAdr) - 6}
            fill="#8C2F22"
            fontSize="9.5"
            fontWeight="600"
            textAnchor="end"
          >
            Aspen Luxury Comp-Set (${compsetAdr})
          </text>

          {/* RevPAR Gradient Area */}
          {(activeSeries === 'both' || activeSeries === 'revpar') && (
            <>
              <path d={revParAreaPath} fill="url(#revparGradient)" />
              <path
                d={revParLinePath}
                fill="none"
                stroke="#236446"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* ADR Trend Line */}
          {(activeSeries === 'both' || activeSeries === 'adr') && (
            <path
              d={adrLinePath}
              fill="none"
              stroke="#B08D57"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X-Axis Date Labels */}
          {data.map((pt, i) => {
            if (i % 5 !== 0 && i !== data.length - 1) return null;
            const x = getX(i);
            return (
              <text
                key={i}
                x={x}
                y={height - 15}
                fill="#736B63"
                fontSize="10"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {pt.dateStr}
              </text>
            );
          })}

          {/* Interactive Hover Guide Line & Dots */}
          {hoveredPoint && hoverX !== null && (
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

              {/* ADR Point Circle */}
              {(activeSeries === 'both' || activeSeries === 'adr') && (
                <circle
                  cx={hoverX}
                  cy={getY(hoveredPoint.adr)}
                  r="5"
                  fill="#B08D57"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              )}

              {/* RevPAR Point Circle */}
              {(activeSeries === 'both' || activeSeries === 'revpar') && (
                <circle
                  cx={hoverX}
                  cy={getY(hoveredPoint.revPar)}
                  r="5"
                  fill="#236446"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              )}
            </g>
          )}
        </svg>

        {/* Floating Tooltip Callout Box */}
        {hoveredPoint && hoverX !== null && (
          <div
            className="absolute top-2 pointer-events-none transition-all duration-75 bg-[#1C1815] text-[#F7F4EE] rounded-xl px-3.5 py-2.5 shadow-xl border border-[#4A433D] text-xs space-y-1 z-20"
            style={{
              left: `${Math.min(75, Math.max(15, (hoverX / width) * 100))}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#3A332C] pb-1">
              <span className="font-semibold text-white">
                {hoveredPoint.dateStr} {hoveredPoint.isWeekend ? '• Weekend Surge' : '• Weekday'}
              </span>
              <span className="text-[10px] text-[#B08D57] font-mono">Day {hoveredPoint.day}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-0.5">
              <div>
                <div className="text-[10px] text-[#A69E95]">Simulated ADR</div>
                <div className="text-sm font-bold text-[#E5C388]">${hoveredPoint.adr}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#A69E95]">Yield RevPAR</div>
                <div className="text-sm font-bold text-[#4ADE80]">${hoveredPoint.revPar}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#A69E95]">Est. Occupancy</div>
                <div className="text-sm font-bold text-white">{hoveredPoint.occupancy}%</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Visual Legend */}
      <div className="pt-3 border-t border-[#EAE4D8] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 bg-[#B08D57] rounded-full" />
            <span className="text-[#1C1815] font-medium">Dynamic ADR Strategy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-2 bg-[#236446]/40 border border-[#236446] rounded-xs" />
            <span className="text-[#1C1815] font-medium">Realized RevPAR Curve</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#C25442]" />
            <span className="text-[#736B63]">Local Comp-Set Ceiling</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[#736B63]">
          <Info className="w-3.5 h-3.5 text-[#B08D57]" />
          <span>Move the sliders below to see live curve transformations</span>
        </div>
      </div>
    </div>
  );
};
