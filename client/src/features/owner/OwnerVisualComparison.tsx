import React, { useState, useMemo } from 'react';
import type { Property } from '../../types';
import {
  TrendingUp,
  Sparkles,
  BarChart3,
  Sliders,
  DollarSign,
  Percent,
  ShieldCheck,
  Layers,
  Activity,
  LineChart,
} from 'lucide-react';

interface PropertyMetricsData {
  totalRooms: number;
  occupancyRate: number;
  cleanRooms: number;
  dirtyRooms: number;
  inspectedRooms: number;
  oooRooms: number;
  arrivalsToday: number;
  inHouse: number;
  departuresToday: number;
}

interface OwnerVisualComparisonProps {
  properties: Property[];
  currentProperty: Property | null;
  portfolioMetrics: Record<string, PropertyMetricsData | null>;
  portfolioReservations: Record<string, any[]>;
  onSelectProperty: (property: Property) => void;
}

type ComparisonMetric = 'occupancy' | 'revenue' | 'adr' | 'revpar';
type ChartType = 'column' | 'spline' | 'bars';

interface ThemeColor {
  primary: string;
  secondary: string;
  glow: string;
  lightBg: string;
  textColor: string;
  borderColor: string;
}

const PROPERTY_PALETTES: Record<string, ThemeColor> = {
  prop_birchwood: {
    primary: '#059669',
    secondary: '#10B981',
    glow: 'rgba(5, 150, 105, 0.4)',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
  },
  prop_copperline: {
    primary: '#D97706',
    secondary: '#F59E0B',
    glow: 'rgba(217, 119, 6, 0.4)',
    lightBg: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
  },
  prop_wrenhouse: {
    primary: '#4F46E5',
    secondary: '#6366F1',
    glow: 'rgba(79, 70, 229, 0.4)',
    lightBg: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
  },
  prop_sundowner: {
    primary: '#E11D48',
    secondary: '#F43F5E',
    glow: 'rgba(225, 29, 72, 0.4)',
    lightBg: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
  },
  prop_cedarsalt: {
    primary: '#0D9488',
    secondary: '#14B8A6',
    glow: 'rgba(13, 148, 136, 0.4)',
    lightBg: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
  },
  prop_theledger: {
    primary: '#8C621E',
    secondary: '#C5A059',
    glow: 'rgba(197, 160, 89, 0.4)',
    lightBg: 'bg-amber-50',
    textColor: 'text-[#8C621E]',
    borderColor: 'border-amber-200',
  },
};

const FALLBACK_PALETTES: ThemeColor[] = [
  { primary: '#059669', secondary: '#10B981', glow: 'rgba(5, 150, 105, 0.4)', lightBg: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
  { primary: '#D97706', secondary: '#F59E0B', glow: 'rgba(217, 119, 6, 0.4)', lightBg: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  { primary: '#4F46E5', secondary: '#6366F1', glow: 'rgba(79, 70, 229, 0.4)', lightBg: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200' },
  { primary: '#E11D48', secondary: '#F43F5E', glow: 'rgba(225, 29, 72, 0.4)', lightBg: 'bg-rose-50', textColor: 'text-rose-700', borderColor: 'border-rose-200' },
  { primary: '#0D9488', secondary: '#14B8A6', glow: 'rgba(13, 148, 136, 0.4)', lightBg: 'bg-teal-50', textColor: 'text-teal-700', borderColor: 'border-teal-200' },
  { primary: '#8C621E', secondary: '#C5A059', glow: 'rgba(197, 160, 89, 0.4)', lightBg: 'bg-amber-50', textColor: 'text-[#8C621E]', borderColor: 'border-amber-200' },
];

export const OwnerVisualComparison: React.FC<OwnerVisualComparisonProps> = ({
  properties,
  currentProperty,
  portfolioMetrics,
  portfolioReservations,
  onSelectProperty,
}) => {
  const [activeMetric, setActiveMetric] = useState<ComparisonMetric>('adr');
  const [chartType, setChartType] = useState<ChartType>('column');
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);

  // Interactive What-If Simulation State
  const [simAdrDelta, setSimAdrDelta] = useState<number>(0);
  const [simOccDelta, setSimOccDelta] = useState<number>(0);

  // Compute stats per property with guaranteed unique colors
  const propertyStats = useMemo(() => {
    return properties.map((prop, idx) => {
      const pMetrics = portfolioMetrics[prop.id];
      const pReservations = portfolioReservations[prop.id] || [];

      const totalRooms = prop.totalRooms || 30;
      const inHouse = pMetrics?.inHouse ?? pReservations.filter((r) => r.status === 'checked_in').length;
      const occupancy = pMetrics?.occupancyRate ?? (totalRooms > 0 ? Math.round((inHouse / totalRooms) * 100) : 0);

      const totalRevenue = pReservations.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0) || inHouse * 395;
      const adr = inHouse > 0 ? Math.round(totalRevenue / inHouse) : 385;
      const revpar = Math.round(totalRevenue / Math.max(1, totalRooms));

      const cleanCount = (pMetrics?.cleanRooms || 0) + (pMetrics?.inspectedRooms || 0);
      const readinessRate = totalRooms > 0 ? Math.round((cleanCount / totalRooms) * 100) : 85;

      const theme =
        PROPERTY_PALETTES[prop.id] ||
        PROPERTY_PALETTES[prop.id.replace(/-/g, '_')] ||
        FALLBACK_PALETTES[idx % FALLBACK_PALETTES.length];

      return {
        property: prop,
        totalRooms,
        inHouse,
        occupancy,
        totalRevenue,
        adr,
        revpar,
        readinessRate,
        theme,
        reservationsCount: pReservations.length,
      };
    });
  }, [properties, portfolioMetrics, portfolioReservations]);

  // Aggregate Portfolio Benchmark Averages
  const portfolioBenchmark = useMemo(() => {
    if (propertyStats.length === 0) return { avgOcc: 0, avgAdr: 0, avgRevpar: 0, totalRev: 0, totalRooms: 0, avgReadiness: 0, totalInHouse: 0 };
    const totalRooms = propertyStats.reduce((sum, p) => sum + p.totalRooms, 0);
    const totalRev = propertyStats.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalInHouse = propertyStats.reduce((sum, p) => sum + p.inHouse, 0);
    const avgOcc = totalRooms > 0 ? Math.round((totalInHouse / totalRooms) * 100) : 0;
    const avgAdr = totalInHouse > 0 ? Math.round(totalRev / totalInHouse) : 385;
    const avgRevpar = totalRooms > 0 ? Math.round(totalRev / totalRooms) : 0;
    const avgReadiness = Math.round(propertyStats.reduce((sum, p) => sum + p.readinessRate, 0) / propertyStats.length);

    return { avgOcc, avgAdr, avgRevpar, totalRev, totalRooms, avgReadiness, totalInHouse };
  }, [propertyStats]);

  // Current metric value getter
  const getMetricValue = (item: typeof propertyStats[0], metric: ComparisonMetric) => {
    switch (metric) {
      case 'occupancy':
        return item.occupancy;
      case 'revenue':
        return item.totalRevenue;
      case 'adr':
        return item.adr;
      case 'revpar':
        return item.revpar;
    }
  };

  // Benchmark value for active metric
  const currentBenchmarkValue = useMemo(() => {
    switch (activeMetric) {
      case 'occupancy':
        return portfolioBenchmark.avgOcc;
      case 'revenue':
        return Math.round(portfolioBenchmark.totalRev / (propertyStats.length || 1));
      case 'adr':
        return portfolioBenchmark.avgAdr;
      case 'revpar':
        return portfolioBenchmark.avgRevpar;
    }
  }, [activeMetric, portfolioBenchmark, propertyStats.length]);

  // Max value for scale with headroom
  const maxMetricValue = useMemo(() => {
    const vals = propertyStats.map((p) => getMetricValue(p, activeMetric));
    const highest = Math.max(...vals, currentBenchmarkValue, 10);
    return Math.ceil(highest * 1.25);
  }, [activeMetric, propertyStats, currentBenchmarkValue]);

  // Format value display based on metric
  const formatValue = (val: number, metric: ComparisonMetric) => {
    switch (metric) {
      case 'occupancy':
        return `${val}%`;
      case 'revenue':
        return `$${val.toLocaleString()}`;
      case 'adr':
        return `$${val}/nt`;
      case 'revpar':
        return `$${val}`;
    }
  };

  // Channel breakdown
  const channelBreakdown = useMemo(() => {
    let direct = 0;
    let otas = 0;
    let directRevenue = 0;
    let otaRevenue = 0;

    Object.values(portfolioReservations).forEach((resList) => {
      resList.forEach((r) => {
        const amt = Number(r.totalAmount) || 0;
        if (r.source === 'direct') {
          direct += 1;
          directRevenue += amt;
        } else {
          otas += 1;
          otaRevenue += amt;
        }
      });
    });

    const total = direct + otas || 1;
    const directPct = Math.round((direct / total) * 100);
    const otaPct = 100 - directPct;
    const otaCommissionSaved = Math.round(directRevenue * 0.18);

    return { direct, otas, directPct, otaPct, directRevenue, otaRevenue, otaCommissionSaved };
  }, [portfolioReservations]);

  // What-If Simulation Calculation
  const simulatedYield = useMemo(() => {
    const baseOcc = portfolioBenchmark.avgOcc || 78;
    const baseAdr = portfolioBenchmark.avgAdr || 420;
    const keys = portfolioBenchmark.totalRooms || 197;

    const newOcc = Math.min(100, Math.max(10, baseOcc + simOccDelta));
    const newAdr = Math.max(100, baseAdr + simAdrDelta);

    const projectedMonthly = Math.round(keys * (newOcc / 100) * newAdr * 30);
    const baseMonthly = Math.round(keys * (baseOcc / 100) * baseAdr * 30);
    const deltaMonthly = projectedMonthly - baseMonthly;
    const projectedAnnual = deltaMonthly * 12;

    return { newOcc, newAdr, projectedMonthly, deltaMonthly, projectedAnnual };
  }, [portfolioBenchmark, simAdrDelta, simOccDelta]);

  // Chart Dimensions for SVG
  const chartHeight = 260;
  const chartWidth = 760;
  const paddingX = 60;
  const paddingY = 35;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingY * 2;

  const benchmarkY = paddingY + plotHeight - (currentBenchmarkValue / maxMetricValue) * plotHeight;

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Main Luminous Performance Arena — Styled as Clean White Luxury Card */}
      <div className="editorial-card rounded-3xl bg-white border border-[#E5E7EB] p-6 sm:p-8 shadow-sm space-y-6 text-[#0F172A] relative">
        {/* Top Header & Interactive Metric Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-[#E5E7EB]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-[#8C621E] bg-[#FAF6EE] border border-[#ECE2CE] mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Multi-Property Performance Graph</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-[#0F172A]">
              LumenStay Property Comparison Arena
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-xl">
              Real-time multi-property comparative visualizer across all 6 sanctuaries ({portfolioBenchmark.totalRooms} total keys).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Chart Type Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0]">
              <button
                onClick={() => setChartType('column')}
                title="Column Chart View"
                className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  chartType === 'column' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Columns</span>
              </button>
              <button
                onClick={() => setChartType('spline')}
                title="Trend Curve View"
                className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  chartType === 'spline' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <LineChart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trend Curve</span>
              </button>
              <button
                onClick={() => setChartType('bars')}
                title="Horizontal Rows View"
                className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
                  chartType === 'bars' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rows</span>
              </button>
            </div>

            {/* Metric Selector Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#F8F9FA] border border-[#E2E8F0]">
              <button
                onClick={() => setActiveMetric('adr')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer flex items-center gap-1 ${
                  activeMetric === 'adr'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>ADR</span>
              </button>

              <button
                onClick={() => setActiveMetric('revenue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer flex items-center gap-1 ${
                  activeMetric === 'revenue'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Gross Yield</span>
              </button>

              <button
                onClick={() => setActiveMetric('occupancy')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer flex items-center gap-1 ${
                  activeMetric === 'occupancy'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Occupancy</span>
              </button>

              <button
                onClick={() => setActiveMetric('revpar')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer flex items-center gap-1 ${
                  activeMetric === 'revpar'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>RevPAR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Legend & Portfolio Average Benchmark Ribbon */}
        <div className="flex flex-wrap items-center justify-between text-xs gap-3 bg-[#F8F9FA] px-4 py-2.5 rounded-2xl border border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
              Active Metric:
            </span>
            <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-white text-[#0F172A] border border-[#E2E8F0] uppercase">
              {activeMetric}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#C5A059] inline-block border-t-2 border-dashed border-[#C5A059]" />
              <span className="text-[#8C621E] font-semibold">
                Portfolio Benchmark Average: <strong>{formatValue(currentBenchmarkValue, activeMetric)}</strong>
              </span>
            </div>
            <span className="text-[#CBD5E1] hidden sm:inline">•</span>
            <span className="text-[#64748B] text-[11px] hidden sm:inline">
              Click any column to switch active lodge
            </span>
          </div>
        </div>

        {/* 2A. Visual Mode 1: Interactive SVG Column Graph */}
        {chartType === 'column' && (
          <div className="relative w-full overflow-x-auto pt-2 pb-2">
            <div className="min-w-[680px]">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto overflow-visible select-none"
              >
                <defs>
                  {propertyStats.map((item) => (
                    <linearGradient
                      key={`grad_${item.property.id}`}
                      id={`colGrad_${item.property.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={item.theme.secondary} stopOpacity="1" />
                      <stop offset="100%" stopColor={item.theme.primary} stopOpacity="0.85" />
                    </linearGradient>
                  ))}
                  <filter id="columnGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.25" />
                  </filter>
                </defs>

                {/* Y-Axis Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = paddingY + plotHeight * (1 - ratio);
                  const val = Math.round(maxMetricValue * ratio);
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#F1F5F9"
                        strokeWidth="1.5"
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#94A3B8"
                        fontWeight="600"
                      >
                        {formatValue(val, activeMetric)}
                      </text>
                    </g>
                  );
                })}

                {/* Portfolio Benchmark Dotted Line */}
                <g>
                  <line
                    x1={paddingX}
                    y1={benchmarkY}
                    x2={chartWidth - paddingX}
                    y2={benchmarkY}
                    stroke="#C5A059"
                    strokeWidth="2"
                    strokeDasharray="5,4"
                  />
                  <rect
                    x={chartWidth - paddingX - 120}
                    y={benchmarkY - 11}
                    width="120"
                    height="20"
                    rx="6"
                    fill="#FAF6EE"
                    stroke="#ECE2CE"
                    strokeWidth="1"
                  />
                  <text
                    x={chartWidth - paddingX - 60}
                    y={benchmarkY + 3}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="#8C621E"
                    fontWeight="700"
                  >
                    Avg: {formatValue(currentBenchmarkValue, activeMetric)}
                  </text>
                </g>

                {/* Property Columns */}
                {propertyStats.map((item, idx) => {
                  const colWidth = 58;
                  const totalCols = propertyStats.length;
                  const colSpacing = plotWidth / totalCols;
                  const x = paddingX + idx * colSpacing + (colSpacing - colWidth) / 2;

                  const currentVal = getMetricValue(item, activeMetric);
                  const colHeight = Math.max(12, (currentVal / maxMetricValue) * plotHeight);
                  const y = paddingY + plotHeight - colHeight;

                  const isSelected = item.property.id === currentProperty?.id;
                  const isHovered = hoveredPropertyId === item.property.id;
                  const isAbove = currentVal >= currentBenchmarkValue;

                  return (
                    <g
                      key={item.property.id}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredPropertyId(item.property.id)}
                      onMouseLeave={() => setHoveredPropertyId(null)}
                      onClick={() => onSelectProperty(item.property)}
                    >
                      {/* Column background hover highlight */}
                      <rect
                        x={x - 8}
                        y={paddingY}
                        width={colWidth + 16}
                        height={plotHeight + 35}
                        rx="12"
                        fill={isHovered ? item.theme.glow.replace('0.4', '0.08') : 'transparent'}
                        className="transition-colors"
                      />

                      {/* Active property aura outline */}
                      {isSelected && (
                        <rect
                          x={x - 4}
                          y={y - 4}
                          width={colWidth + 8}
                          height={colHeight + 8}
                          rx="12"
                          fill="none"
                          stroke={item.theme.primary}
                          strokeWidth="2.5"
                          strokeDasharray="4,3"
                          opacity="0.75"
                        />
                      )}

                      {/* Main Vibrant Gradient Column */}
                      <rect
                        x={x}
                        y={y}
                        width={colWidth}
                        height={colHeight}
                        rx="9"
                        fill={`url(#colGrad_${item.property.id})`}
                        style={{
                          filter: isHovered || isSelected ? `drop-shadow(0 6px 14px ${item.theme.glow})` : 'none',
                          transform: isHovered ? 'scaleY(1.02)' : 'none',
                          transformOrigin: `${x}px ${paddingY + plotHeight}px`,
                          transition: 'transform 0.2s ease-out, filter 0.2s ease-out',
                        }}
                      />

                      {/* Top Column Glow Edge */}
                      <rect
                        x={x + 3}
                        y={y + 1}
                        width={colWidth - 6}
                        height="3"
                        rx="2"
                        fill="#FFFFFF"
                        opacity="0.6"
                      />

                      {/* Value Pill on Top of Column */}
                      <rect
                        x={x - 6}
                        y={y - 24}
                        width={colWidth + 12}
                        height="19"
                        rx="6"
                        fill={isHovered ? item.theme.primary : '#0F172A'}
                        className="transition-colors"
                      />
                      <text
                        x={x + colWidth / 2}
                        y={y - 11}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#FFFFFF"
                        fontWeight="800"
                      >
                        {formatValue(currentVal, activeMetric)}
                      </text>

                      {/* X-Axis Label: Property Name */}
                      <text
                        x={x + colWidth / 2}
                        y={paddingY + plotHeight + 18}
                        textAnchor="middle"
                        fontSize="11"
                        fill={isSelected ? '#0F172A' : '#334155'}
                        fontWeight={isSelected ? '800' : '600'}
                      >
                        {item.property.name.replace('The ', '')}
                      </text>

                      {/* X-Axis Sub-label: City & Above/Below indicator */}
                      <text
                        x={x + colWidth / 2}
                        y={paddingY + plotHeight + 30}
                        textAnchor="middle"
                        fontSize="9"
                        fill={isAbove ? '#059669' : '#D97706'}
                        fontWeight="700"
                      >
                        {isAbove ? '▲ Above Avg' : '▼ Opportunity'}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* 2B. Visual Mode 2: Interactive Spline Trend Wave */}
        {chartType === 'spline' && (
          <div className="relative w-full overflow-x-auto pt-2 pb-2">
            <div className="min-w-[680px]">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto overflow-visible select-none"
              >
                <defs>
                  <linearGradient id="splineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C5A059" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#C5A059" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = paddingY + plotHeight * (1 - ratio);
                  const val = Math.round(maxMetricValue * ratio);
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#F1F5F9"
                        strokeWidth="1.5"
                      />
                      <text
                        x={paddingX - 10}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#94A3B8"
                        fontWeight="600"
                      >
                        {formatValue(val, activeMetric)}
                      </text>
                    </g>
                  );
                })}

                {/* Benchmark Line */}
                <line
                  x1={paddingX}
                  y1={benchmarkY}
                  x2={chartWidth - paddingX}
                  y2={benchmarkY}
                  stroke="#C5A059"
                  strokeWidth="2"
                  strokeDasharray="5,4"
                />

                {/* Draw Smooth Curve through Property Points */}
                {(() => {
                  const totalCols = propertyStats.length;
                  const colSpacing = plotWidth / (totalCols - 1 || 1);

                  const points = propertyStats.map((item, idx) => {
                    const x = paddingX + idx * colSpacing;
                    const val = getMetricValue(item, activeMetric);
                    const y = paddingY + plotHeight - (val / maxMetricValue) * plotHeight;
                    return { x, y, item };
                  });

                  // Build SVG path string with smooth beziers
                  let pathD = `M ${points[0].x} ${points[0].y}`;
                  for (let i = 0; i < points.length - 1; i++) {
                    const curr = points[i];
                    const next = points[i + 1];
                    const cpx1 = curr.x + (next.x - curr.x) / 2;
                    const cpy1 = curr.y;
                    const cpx2 = curr.x + (next.x - curr.x) / 2;
                    const cpy2 = next.y;
                    pathD += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${next.x} ${next.y}`;
                  }

                  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingY + plotHeight} L ${points[0].x} ${paddingY + plotHeight} Z`;

                  return (
                    <g>
                      <path d={areaD} fill="url(#splineAreaGrad)" />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#0F172A"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Nodes */}
                      {points.map(({ x, y, item }) => {
                        const isSelected = item.property.id === currentProperty?.id;
                        const isHovered = hoveredPropertyId === item.property.id;
                        const currentVal = getMetricValue(item, activeMetric);

                        return (
                          <g
                            key={item.property.id}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPropertyId(item.property.id)}
                            onMouseLeave={() => setHoveredPropertyId(null)}
                            onClick={() => onSelectProperty(item.property)}
                          >
                            <circle
                              cx={x}
                              cy={y}
                              r={isHovered || isSelected ? 8 : 6}
                              fill={item.theme.primary}
                              stroke="#FFFFFF"
                              strokeWidth="3"
                              className="transition-all"
                            />

                            {/* Node Value Label */}
                            <rect
                              x={x - 28}
                              y={y - 25}
                              width="56"
                              height="18"
                              rx="5"
                              fill="#0F172A"
                            />
                            <text
                              x={x}
                              y={y - 13}
                              textAnchor="middle"
                              fontSize="9.5"
                              fill="#FFFFFF"
                              fontWeight="800"
                            >
                              {formatValue(currentVal, activeMetric)}
                            </text>

                            {/* Bottom Label */}
                            <text
                              x={x}
                              y={paddingY + plotHeight + 18}
                              textAnchor="middle"
                              fontSize="11"
                              fill={isSelected ? '#0F172A' : '#64748B'}
                              fontWeight={isSelected ? '800' : '600'}
                            >
                              {item.property.name.replace('The ', '')}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>
        )}

        {/* 2C. Visual Mode 3: Horizontal Comparative Rows */}
        {chartType === 'bars' && (
          <div className="space-y-3 pt-2">
            {propertyStats.map((item, idx) => {
              const currentVal = getMetricValue(item, activeMetric);
              const fillPercent = Math.min(100, Math.max(8, (currentVal / maxMetricValue) * 100));
              const isAbove = currentVal >= currentBenchmarkValue;
              const isSelected = item.property.id === currentProperty?.id;

              return (
                <div
                  key={item.property.id}
                  onClick={() => onSelectProperty(item.property)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/40 border-[#C5A059] ring-1 ring-[#C5A059]/50 shadow-xs'
                      : 'bg-[#F8F9FA] border-[#E5E7EB] hover:bg-white hover:border-[#C5A059]/40 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-white text-[10px] shrink-0"
                        style={{ backgroundColor: item.theme.primary }}
                      >
                        #{idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-heading text-[#0F172A]">
                            {item.property.name}
                          </strong>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#0F172A] text-white">
                              Active Context
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#64748B]">
                          {item.property.city}, {item.property.state} • {item.totalRooms} Keys • {item.inHouse} In-House
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-heading font-extrabold text-[#0F172A] block">
                        {formatValue(currentVal, activeMetric)}
                      </span>
                      <span className={`text-[10px] font-bold ${isAbove ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {isAbove ? '▲ Above Average' : '▼ Opportunity'}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${fillPercent}%`,
                        backgroundColor: item.theme.primary,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Colorful Property Performance Cards with Live Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {propertyStats.map((item) => {
          const isSelected = item.property.id === currentProperty?.id;
          const strokeCircumference = 2 * Math.PI * 34;
          const strokeOffset = strokeCircumference - (item.occupancy / 100) * strokeCircumference;

          return (
            <div
              key={item.property.id}
              onClick={() => onSelectProperty(item.property)}
              className={`editorial-card rounded-3xl p-6 bg-white border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 ${
                isSelected
                  ? 'border-[#C5A059] ring-2 ring-[#C5A059]/40 shadow-md bg-gradient-to-b from-amber-50/20 to-white'
                  : 'border-[#E5E7EB] hover:border-[#C5A059]/60 hover:shadow-sm'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.theme.primary }}
                      />
                      <h3 className="font-heading font-bold text-base text-[#0F172A]">
                        {item.property.name}
                      </h3>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {item.property.city}, {item.property.state} • {item.totalRooms} Keys
                    </p>
                  </div>

                  {isSelected ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#0F172A] text-white shrink-0">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#64748B] bg-[#F8F9FA] border border-[#E5E7EB] shrink-0">
                      Select
                    </span>
                  )}
                </div>
              </div>

              {/* Middle: Circular Radial Occupancy Gauge & Core Financials */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB]/80">
                {/* SVG Radial Gauge */}
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="transparent"
                      stroke="#E2E8F0"
                      strokeWidth="6"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="transparent"
                      stroke={item.theme.primary}
                      strokeWidth="6"
                      strokeDasharray={strokeCircumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="font-heading font-extrabold text-sm text-[#0F172A] leading-none">
                      {item.occupancy}%
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-[#64748B] mt-0.5">
                      Occ
                    </span>
                  </div>
                </div>

                {/* Financial Summary Breakdown */}
                <div className="flex-1 space-y-2 text-right">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block">
                      Gross Yield
                    </span>
                    <span className="font-heading font-extrabold text-lg text-[#0F172A]">
                      ${item.totalRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-3 text-xs">
                    <div>
                      <span className="text-[9px] uppercase text-[#64748B] block">RevPAR</span>
                      <strong className="text-[#0F172A]">${item.revpar}</strong>
                    </div>
                    <div className="border-l border-[#CBD5E1] pl-3">
                      <span className="text-[9px] uppercase text-[#64748B] block">ADR</span>
                      <strong className="text-[#C5A059]">${item.adr}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Readiness Indicator */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E5E7EB]">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{item.readinessRate}% Ready & Inspected</span>
                </span>
                <span className="text-[#0F172A] font-semibold">
                  {item.inHouse} Active Guests
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Real Channel Distribution & Interactive Yield Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Direct LumenStay Site vs OTA Booking Distribution */}
        <div className="editorial-card rounded-3xl p-6 sm:p-8 bg-white border border-[#E5E7EB] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C5A059]">
                Channel Yield Intelligence
              </span>
              <h3 className="text-xl font-heading font-bold text-[#0F172A] mt-0.5">
                Direct vs OTA Share
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                Real portfolio booking origin breakdown and OTA fee savings.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 font-heading font-extrabold text-base border border-emerald-200">
              +{channelBreakdown.directPct}% Direct
            </div>
          </div>

          {/* Segmented Channel Visual Bar */}
          <div className="space-y-2">
            <div className="h-4 rounded-full bg-[#F1F5F9] overflow-hidden flex p-0.5 gap-0.5 shadow-inner">
              <div
                style={{ width: `${Math.max(10, channelBreakdown.directPct)}%` }}
                className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-l-full relative group transition-all"
                title={`Direct LumenStay: ${channelBreakdown.directPct}%`}
              />
              <div
                style={{ width: `${Math.max(10, channelBreakdown.otaPct)}%` }}
                className="bg-gradient-to-r from-amber-400 to-[#C5A059] rounded-r-full relative group transition-all"
                title={`OTAs (Expedia, Booking, Airbnb): ${channelBreakdown.otaPct}%`}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F172A]" />
                Direct LumenStay Site ({channelBreakdown.directPct}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
                OTAs / Third-Party ({channelBreakdown.otaPct}%)
              </span>
            </div>
          </div>

          {/* Real Savings Highlight Tile */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Estimated OTA Commissions Saved
              </span>
              <span className="text-2xl sm:text-3xl font-heading font-black text-emerald-800">
                ${channelBreakdown.otaCommissionSaved.toLocaleString()}
              </span>
              <p className="text-[11px] text-emerald-600">
                Based on 18% standard OTA commission rates preserved through direct guest bookings.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Right: Interactive "What-If" Yield Simulation Sandbox */}
        <div className="editorial-card rounded-3xl p-6 sm:p-8 bg-white border border-[#E5E7EB] shadow-sm space-y-6 text-[#0F172A]">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#8C621E] bg-[#FAF6EE] border border-[#ECE2CE] mb-1">
                <Sliders className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Executive Scenario Sandbox</span>
              </div>
              <h3 className="text-xl font-heading font-bold text-[#0F172A]">
                Portfolio Yield Simulator
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Adjust target ADR and occupancy benchmarks to project portfolio revenue uplift.
              </p>
            </div>
          </div>

          {/* Interactive Sliders */}
          <div className="space-y-5 bg-[#F8F9FA] p-5 rounded-2xl border border-[#E5E7EB]">
            {/* Slider 1: ADR Delta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#334155] font-semibold">ADR Target Adjustment:</span>
                <strong className="text-[#8C621E] font-mono text-sm">
                  {simAdrDelta >= 0 ? `+$${simAdrDelta}` : `-$${Math.abs(simAdrDelta)}`} / night
                </strong>
              </div>
              <input
                type="range"
                min="-100"
                max="150"
                step="5"
                value={simAdrDelta}
                onChange={(e) => setSimAdrDelta(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
              />
              <div className="flex justify-between text-[10px] text-[#64748B]">
                <span>-$100</span>
                <span>Baseline (${portfolioBenchmark.avgAdr})</span>
                <span>+$150</span>
              </div>
            </div>

            {/* Slider 2: Occupancy Delta */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#334155] font-semibold">Occupancy Target Shift:</span>
                <strong className="text-[#0284C7] font-mono text-sm">
                  {simOccDelta >= 0 ? `+${simOccDelta}%` : `${simOccDelta}%`}
                </strong>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={simOccDelta}
                onChange={(e) => setSimOccDelta(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
              />
              <div className="flex justify-between text-[10px] text-[#64748B]">
                <span>-20%</span>
                <span>Baseline ({portfolioBenchmark.avgOcc}%)</span>
                <span>+20%</span>
              </div>
            </div>
          </div>

          {/* Real-Time Impact Projection Callout */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block tracking-wider">
                Monthly Net EBITDA Impact
              </span>
              <span className={`text-xl sm:text-2xl font-heading font-black block mt-1 ${simYieldColor(simulatedYield.deltaMonthly)}`}>
                {simulatedYield.deltaMonthly >= 0 ? `+$${simulatedYield.deltaMonthly.toLocaleString()}` : `-$${Math.abs(simulatedYield.deltaMonthly).toLocaleString()}`}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#ECE2CE]">
              <span className="text-[10px] uppercase font-bold text-[#8C621E] block tracking-wider">
                Annual Projected Uplift
              </span>
              <span className="text-xl sm:text-2xl font-heading font-black text-[#8C621E] block mt-1">
                {simulatedYield.projectedAnnual >= 0 ? `+$${simulatedYield.projectedAnnual.toLocaleString()}` : `-$${Math.abs(simulatedYield.projectedAnnual).toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function simYieldColor(val: number): string {
  if (val > 0) return 'text-emerald-600';
  if (val < 0) return 'text-rose-600';
  return 'text-[#0F172A]';
}

export default OwnerVisualComparison;
