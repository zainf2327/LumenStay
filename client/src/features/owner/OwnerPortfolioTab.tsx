import React, { useState } from 'react';
import {
  ArrowUpRight,
  Sparkles,
  MapPin,
  BedDouble,
  CheckCircle2,
  KeyRound,
  Compass,
} from 'lucide-react';
import type { Property } from '../../types';

interface OwnerPortfolioTabProps {
  properties: Property[];
  currentProperty: Property | null;
  onSelectProperty: (property: Property) => void;
  portfolioMetrics?: Record<string, any>;
  portfolioReservations?: Record<string, any[]>;
}

interface PropertyTheme {
  name: string;
  primary: string;
  secondary: string;
  glow: string;
  badgeBg: string;
  lightBg: string;
  barGradient: string;
  cardGlow: string;
  accentBorder: string;
  ringClass: string;
  tag: string;
  initials: string;
}

const PROPERTY_THEMES: Record<string, PropertyTheme> = {
  prop_birchwood: {
    name: 'Birchwood Hotel',
    primary: '#059669',
    secondary: '#10B981',
    glow: 'rgba(5, 150, 105, 0.4)',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    lightBg: 'bg-emerald-50/70',
    barGradient: 'from-emerald-500 to-teal-500',
    cardGlow: 'rgba(5, 150, 105, 0.15)',
    accentBorder: 'border-emerald-300',
    ringClass: 'ring-emerald-500/40',
    tag: 'Alpine Luxury',
    initials: 'BW',
  },
  prop_copperline: {
    name: 'Copperline Inn',
    primary: '#D97706',
    secondary: '#F59E0B',
    glow: 'rgba(217, 119, 6, 0.4)',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    lightBg: 'bg-amber-50/70',
    barGradient: 'from-amber-500 to-orange-500',
    cardGlow: 'rgba(217, 119, 6, 0.15)',
    accentBorder: 'border-amber-300',
    ringClass: 'ring-amber-500/40',
    tag: 'Ski-In Ski-Out',
    initials: 'CL',
  },
  prop_wrenhouse: {
    name: 'The Wren House',
    primary: '#4F46E5',
    secondary: '#6366F1',
    glow: 'rgba(79, 70, 229, 0.4)',
    badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    lightBg: 'bg-indigo-50/70',
    barGradient: 'from-indigo-500 to-violet-500',
    cardGlow: 'rgba(79, 70, 229, 0.15)',
    accentBorder: 'border-indigo-300',
    ringClass: 'ring-indigo-500/40',
    tag: 'Historic Landmark',
    initials: 'WH',
  },
  prop_sundowner: {
    name: 'Sundowner Lodge',
    primary: '#E11D48',
    secondary: '#F43F5E',
    glow: 'rgba(225, 29, 72, 0.4)',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    lightBg: 'bg-rose-50/70',
    barGradient: 'from-rose-500 to-pink-500',
    cardGlow: 'rgba(225, 29, 72, 0.15)',
    accentBorder: 'border-rose-300',
    ringClass: 'ring-rose-500/40',
    tag: 'Mountain Vista',
    initials: 'SD',
  },
  prop_cedarsalt: {
    name: 'Cedar & Salt',
    primary: '#0D9488',
    secondary: '#14B8A6',
    glow: 'rgba(13, 148, 136, 0.4)',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    lightBg: 'bg-teal-50/70',
    barGradient: 'from-teal-500 to-cyan-500',
    cardGlow: 'rgba(13, 148, 136, 0.15)',
    accentBorder: 'border-teal-300',
    ringClass: 'ring-teal-500/40',
    tag: 'Desert Sanctuary',
    initials: 'CS',
  },
  prop_theledger: {
    name: 'The Ledger Hotel',
    primary: '#8C621E',
    secondary: '#C5A059',
    glow: 'rgba(197, 160, 89, 0.4)',
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
    lightBg: 'bg-amber-50/70',
    barGradient: 'from-[#8C621E] to-[#C5A059]',
    cardGlow: 'rgba(197, 160, 89, 0.15)',
    accentBorder: 'border-[#C5A059]/40',
    ringClass: 'ring-[#C5A059]/40',
    tag: 'Urban Heritage',
    initials: 'LD',
  },
};

const FALLBACK_THEMES: PropertyTheme[] = [
  PROPERTY_THEMES.prop_birchwood,
  PROPERTY_THEMES.prop_copperline,
  PROPERTY_THEMES.prop_wrenhouse,
  PROPERTY_THEMES.prop_sundowner,
  PROPERTY_THEMES.prop_cedarsalt,
  PROPERTY_THEMES.prop_theledger,
];

function getTheme(propId: string, idx: number): PropertyTheme {
  const normalized = propId.replace(/-/g, '_').toLowerCase();
  for (const key of Object.keys(PROPERTY_THEMES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return PROPERTY_THEMES[key];
    }
  }
  return FALLBACK_THEMES[idx % FALLBACK_THEMES.length];
}

export const OwnerPortfolioTab: React.FC<OwnerPortfolioTabProps> = ({
  properties,
  currentProperty,
  onSelectProperty,
  portfolioMetrics = {},
  portfolioReservations = {},
}) => {
  const [filterState, setFilterState] = useState<string>('all');

  const totalKeys = properties.reduce((acc, p) => acc + (p.totalRooms || 0), 0);
  const totalInHouse = Object.values(portfolioMetrics).reduce(
    (acc: number, m: any) => acc + (m?.inHouse || 0),
    0
  );
  const avgPortfolioOcc =
    totalKeys > 0 ? Math.round((totalInHouse / totalKeys) * 100) : 0;

  const states = Array.from(new Set(properties.map((p) => p.state).filter(Boolean)));

  const filteredProps = properties.filter((p) => {
    if (filterState === 'all') return true;
    return p.state?.toLowerCase() === filterState.toLowerCase();
  });

  return (
    <div className="space-y-6 font-sans">
      {/* 1. High-Contrast, Colorful Portfolio Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A0F1D] text-white p-6 sm:p-7 shadow-xl border border-slate-700/60">
        {/* Luminous background ambient lights */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#C5A059]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-12 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-[#FDE68A] bg-white/10 border border-[#FDE68A]/30 shadow-xs">
                <Sparkles className="w-3 h-3 text-[#FDE68A] animate-pulse" />
                <span>Multi-Property Sanctuary Network</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-0.5" />
                Salto BLE Live Across {totalKeys} Keys
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight leading-snug drop-shadow-sm">
              6 Boutique Lodges Across the American West
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Real-time multi-lodge telemetry. Click any sanctuary card to inspect live key availability, room night rates, guest folios, and direct operational controls.
            </p>
          </div>

          {/* Glowing Metric Summary Counter Chips */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {/* Properties Counter */}
            <div className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[100px] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">
                Properties
              </span>
              <span className="text-2xl font-heading font-black text-white">
                {properties.length}
              </span>
              <span className="text-[10px] text-amber-300 font-medium block">
                {states.length} States
              </span>
            </div>

            {/* Total Keys Counter */}
            <div className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[100px] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">
                Total Keys
              </span>
              <span className="text-2xl font-heading font-black text-[#FDE68A]">
                {totalKeys}
              </span>
              <span className="text-[10px] text-emerald-300 font-medium block">
                {totalInHouse} In-House
              </span>
            </div>

            {/* Portfolio Occupancy */}
            <div className="flex-1 sm:flex-initial px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center min-w-[100px] shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">
                Portfolio Occ
              </span>
              <span className="text-2xl font-heading font-black text-emerald-400">
                {avgPortfolioOcc}%
              </span>
              <span className="text-[10px] text-slate-300 font-medium block">
                Aggregated
              </span>
            </div>
          </div>
        </div>

        {/* State Filter Buttons Strip */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-white/10">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Compass className="w-3.5 h-3.5 text-[#FDE68A]" /> Region:
          </span>
          <button
            type="button"
            onClick={() => setFilterState('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterState === 'all'
                ? 'bg-white text-[#0F172A] shadow-sm'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            All Sanctuaries ({properties.length})
          </button>
          {states.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterState(st)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterState === st
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              {st} ({properties.filter((p) => p.state === st).length})
            </button>
          ))}
        </div>
      </div>

      {/* 2. Colorful, Glowing Property Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProps.map((prop, idx) => {
          const isSelected = prop.id === currentProperty?.id;
          const theme = getTheme(prop.id, idx);
          const pMetrics = portfolioMetrics[prop.id];
          const pReservations = portfolioReservations[prop.id] || [];

          const totalRooms = prop.totalRooms || 30;
          const inHouse =
            pMetrics?.inHouse ??
            pReservations.filter((r) => r.status === 'checked_in').length;
          const occupancy =
            pMetrics?.occupancyRate ??
            (totalRooms > 0 ? Math.round((inHouse / totalRooms) * 100) : 0);

          const totalRevenue =
            pReservations.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0) ||
            inHouse * 395;
          const adr = inHouse > 0 ? Math.round(totalRevenue / inHouse) : 385;
          const revpar = Math.round(totalRevenue / Math.max(1, totalRooms));

          // Circular gauge calculations
          const radius = 22;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset =
            circumference - (Math.min(100, Math.max(0, occupancy)) / 100) * circumference;

          return (
            <div
              key={prop.id}
              onClick={() => onSelectProperty(prop)}
              style={{
                boxShadow: isSelected
                  ? `0 12px 30px ${theme.glow}, 0 4px 12px rgba(0,0,0,0.06)`
                  : undefined,
              }}
              className={`group relative rounded-3xl p-6 bg-white border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-5 overflow-hidden hover:-translate-y-1 ${
                isSelected
                  ? `border-2 ${theme.accentBorder} shadow-lg ring-2 ${theme.ringClass} bg-gradient-to-b from-white via-white to-[#FAF8F5]`
                  : 'border-[#E5E7EB] hover:border-slate-300 hover:shadow-xl'
              }`}
            >
              {/* Vibrant Top Ambient Glow Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r transition-all"
                style={{
                  background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                }}
              />
              <div
                className="absolute top-0 right-0 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-40 transition-opacity group-hover:opacity-70"
                style={{ backgroundColor: theme.primary }}
              />

              {/* Card Header */}
              <div className="relative z-10 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Lodge Monogram with Glowing Shadow */}
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-heading font-black text-sm border shadow-xs shrink-0 transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${theme.primary}15`,
                        color: theme.primary,
                        borderColor: `${theme.primary}35`,
                        boxShadow: `0 4px 12px ${theme.glow}`,
                      }}
                    >
                      {theme.initials}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-heading font-black text-lg text-[#0F172A] group-hover:text-[#C5A059] transition-colors leading-tight">
                          {prop.name}
                        </h3>
                      </div>
                      <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#C5A059] shrink-0" />
                        <span>
                          {prop.city}, {prop.state}
                        </span>
                        <span className="mx-1 text-[#CBD5E1]">•</span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded"
                          style={{
                            backgroundColor: `${theme.primary}12`,
                            color: theme.primary,
                          }}
                        >
                          {theme.tag}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Active / Select Badge */}
                  {isSelected ? (
                    <span
                      className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1 shadow-xs shrink-0"
                      style={{
                        background: `linear-gradient(135deg, #0F172A, #1E293B)`,
                      }}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Active
                    </span>
                  ) : (
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors shrink-0"
                      style={{
                        borderColor: `${theme.primary}35`,
                        color: theme.primary,
                        backgroundColor: `${theme.primary}08`,
                      }}
                    >
                      Select
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                  {prop.description}
                </p>
              </div>

              {/* Real Performance Metrics with Mini Circular Radial Gauge */}
              <div className="relative z-10 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E5E7EB] flex items-center justify-between gap-2 shadow-2xs">
                {/* Mini SVG Radial Occupancy Gauge */}
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 52 52">
                      <circle
                        cx="26"
                        cy="26"
                        r={radius}
                        className="stroke-[#E2E8F0]"
                        strokeWidth="4.5"
                        fill="transparent"
                      />
                      <circle
                        cx="26"
                        cy="26"
                        r={radius}
                        stroke={theme.primary}
                        strokeWidth="4.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <span className="absolute text-[11px] font-heading font-black text-[#0F172A]">
                      {occupancy}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#64748B] block tracking-wider">
                      Occupancy
                    </span>
                    <span className="text-xs font-bold text-[#0F172A]">
                      {inHouse} / {totalRooms} Keys
                    </span>
                  </div>
                </div>

                {/* ADR Pill */}
                <div className="text-right border-l border-[#E2E8F0] pl-3">
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block tracking-wider">
                    ADR
                  </span>
                  <span className="font-heading font-black text-sm text-[#C5A059] block">
                    ${adr}
                  </span>
                  <span className="text-[10px] text-[#64748B]">
                    RevPAR: ${revpar}
                  </span>
                </div>
              </div>

              {/* Mini Key Distribution Bar */}
              <div className="relative z-10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B] font-semibold flex items-center gap-1">
                    <KeyRound className="w-3 h-3" style={{ color: theme.primary }} />
                    Live Key Distribution
                  </span>
                  <span className="font-bold text-[#0F172A]">
                    {inHouse} In-House ({totalRooms - inHouse} Available)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden flex shadow-inner">
                  <div
                    style={{
                      width: `${Math.max(6, Math.min(100, occupancy))}%`,
                      background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})`,
                    }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Card Footer: Keys & Security */}
              <div className="relative z-10 pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                <span className="text-[#0F172A] font-semibold flex items-center gap-1.5">
                  <BedDouble className="w-3.5 h-3.5 text-[#64748B]" />
                  <span>{prop.totalRooms} Total Suites</span>
                </span>

                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold text-[10.5px] flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Salto BLE
                  </span>
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-transform group-hover:translate-x-0.5"
                    style={{
                      backgroundColor: `${theme.primary}15`,
                      color: theme.primary,
                    }}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OwnerPortfolioTab;
