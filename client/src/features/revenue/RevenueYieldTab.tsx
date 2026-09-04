import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Sliders,
  Sparkles,
  Zap,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { RevenueAreaChart } from '../../components/charts/RevenueAreaChart';

interface RevenueYieldTabProps {
  metrics: any;
  reservations: any[];
}

export const RevenueYieldTab: React.FC<RevenueYieldTabProps> = ({ metrics, reservations }) => {
  // Base Data
  const baseRevenue = reservations.reduce((acc, r) => acc + (r.totalAmount || 0), 0) || 18450;
  const inHouseCount = metrics?.inHouse || reservations.filter((r) => r.status === 'checked_in').length || 24;
  const baseAdr = inHouseCount > 0 ? Math.round(baseRevenue / inHouseCount) : 380;
  const totalRooms = 42; // Birchwood room inventory

  // Interactive Yield Simulator States
  const [demandMultiplier, setDemandMultiplier] = useState<number>(1.15);
  const [weekendSurge, setWeekendSurge] = useState<number>(25); // percentage
  const [minLos, setMinLos] = useState<number>(2); // nights
  const [compsetAdr, setCompsetAdr] = useState<number>(410); // USD
  const [activePreset, setActivePreset] = useState<string>('balanced');
  const [appliedNotification, setAppliedNotification] = useState<string | null>(null);

  // Strategy Presets
  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    if (presetKey === 'aggressive') {
      setDemandMultiplier(1.35);
      setWeekendSurge(40);
      setMinLos(3);
      setCompsetAdr(460);
    } else if (presetKey === 'balanced') {
      setDemandMultiplier(1.15);
      setWeekendSurge(25);
      setMinLos(2);
      setCompsetAdr(410);
    } else if (presetKey === 'shoulder') {
      setDemandMultiplier(0.95);
      setWeekendSurge(15);
      setMinLos(1);
      setCompsetAdr(350);
    } else if (presetKey === 'peak') {
      setDemandMultiplier(1.5);
      setWeekendSurge(50);
      setMinLos(3);
      setCompsetAdr(520);
    }
  };

  // Live Dynamic Calculations
  const calculated = useMemo(() => {
    const simulatedAdr = Math.round(baseAdr * demandMultiplier * (1 + (weekendSurge * 2) / 700));
    const estimatedOccupancy = Math.min(
      96,
      Math.round(84 - (simulatedAdr - baseAdr) * 0.08 + (minLos > 2 ? -4 : 2))
    );
    const simulatedRevPar = Math.round((simulatedAdr * estimatedOccupancy) / 100);
    const projected30DayRev = simulatedRevPar * totalRooms * 30;
    const base30DayRev = Math.round(((baseAdr * 80) / 100) * totalRooms * 30);
    const revenueDelta = projected30DayRev - base30DayRev;
    const compSetIndex = Math.round((simulatedAdr / compsetAdr) * 100);

    return {
      simulatedAdr,
      estimatedOccupancy,
      simulatedRevPar,
      projected30DayRev,
      revenueDelta,
      compSetIndex,
    };
  }, [baseAdr, demandMultiplier, weekendSurge, minLos, compsetAdr]);

  const handleApplyStrategy = () => {
    setAppliedNotification(
      `Algorithmic Yield Multiplier (${demandMultiplier}x) and rules successfully deployed to PMS engine!`
    );
    setTimeout(() => setAppliedNotification(null), 4000);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Notification Banner */}
      {appliedNotification && (
        <div className="p-4 rounded-xl bg-[#EBF4EF] border border-[#C8E3D4] text-[#236446] flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">{appliedNotification}</p>
        </div>
      )}

      {/* 2. Top-Level Strategic KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-xs hover:border-[#B08D57]/60 transition">
          <div className="flex items-center justify-between text-[#736B63]">
            <span className="text-xs uppercase tracking-wider font-medium">Realized ADR</span>
            <DollarSign className="w-4 h-4 text-[#8C621E]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1C1815]">${baseAdr}</span>
            <span className="text-xs text-[#236446] font-medium">+9.4% YoY</span>
          </div>
          <p className="text-[11px] text-[#736B63]">Target: $365/nt</p>
        </div>

        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-xs hover:border-[#B08D57]/60 transition">
          <div className="flex items-center justify-between text-[#736B63]">
            <span className="text-xs uppercase tracking-wider font-medium">Simulated RevPAR</span>
            <TrendingUp className="w-4 h-4 text-[#236446]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#236446]">${calculated.simulatedRevPar}</span>
            <span className="text-xs text-[#236446] font-medium">{calculated.estimatedOccupancy}% Occ</span>
          </div>
          <p className="text-[11px] text-[#736B63]">CompSet RevPAR: $324</p>
        </div>

        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-xs hover:border-[#B08D57]/60 transition">
          <div className="flex items-center justify-between text-[#736B63]">
            <span className="text-xs uppercase tracking-wider font-medium">Projected 30D Delta</span>
            <Sparkles className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-serif font-bold ${
                calculated.revenueDelta >= 0 ? 'text-[#236446]' : 'text-[#8C2F22]'
              }`}
            >
              {calculated.revenueDelta >= 0 ? '+' : ''}${calculated.revenueDelta.toLocaleString()}
            </span>
            <span className="text-xs text-[#8C621E] font-medium">vs Benchmark</span>
          </div>
          <p className="text-[11px] text-[#736B63]">Total: ${calculated.projected30DayRev.toLocaleString()}</p>
        </div>

        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-xs hover:border-[#B08D57]/60 transition">
          <div className="flex items-center justify-between text-[#736B63]">
            <span className="text-xs uppercase tracking-wider font-medium">CompSet MPI (Price Index)</span>
            <Percent className="w-4 h-4 text-[#8C621E]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-[#1C1815]">{calculated.compSetIndex}</span>
            <span className="text-xs text-[#8C621E] font-medium">Index 100=Fair</span>
          </div>
          <p className="text-[11px] text-[#736B63]">Premium Luxury Positioning</p>
        </div>
      </div>

      {/* 2.5 Interactive Yield Trajectory Chart */}
      <RevenueAreaChart
        baseAdr={baseAdr}
        simulatedAdr={calculated.simulatedAdr}
        simulatedRevPar={calculated.simulatedRevPar}
        estimatedOccupancy={calculated.estimatedOccupancy}
        compsetAdr={compsetAdr}
      />

      {/* 3. Interactive Dynamic Yield Simulator */}
      <div className="editorial-card rounded-2xl bg-white border border-[#DDD7CD] p-6 lg:p-8 space-y-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DCD2]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-[#8C621E] bg-[#FAF6EE] border border-[#ECE2CE] mb-1">
              <Sliders className="w-3 h-3 text-[#B08D57]" /> Algorithmic Simulator
            </div>
            <h2 className="text-xl font-serif font-semibold text-[#1C1815]">
              Real-Time Yield Multiplier & Demand Elasticity Engine
            </h2>
            <p className="text-xs text-[#736B63]">
              Adjust market compression levers to simulate immediate RevPAR, ADR, and revenue velocity impacts.
            </p>
          </div>

          {/* Strategy Presets */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#F4EFE6] p-1.5 rounded-xl border border-[#DDD7CD]">
            <span className="text-[10px] font-medium text-[#736B63] uppercase px-2">Presets:</span>
            {[
              { id: 'aggressive', label: 'Aggressive Harvest' },
              { id: 'balanced', label: 'Balanced Yield' },
              { id: 'shoulder', label: 'Shoulder Defense' },
              { id: 'peak', label: 'Peak Holiday' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  activePreset === p.id
                    ? 'bg-[#1C1815] text-[#F7F4EE] shadow-xs'
                    : 'text-[#4A433D] hover:bg-white hover:text-[#1C1815]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders and Dynamic Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Slider 1: Demand Multiplier */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-[#1C1815] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#B08D57]" /> Base Demand Multiplier
                </label>
                <span className="font-bold text-[#8C621E] px-2 py-0.5 rounded bg-[#FAF6EE] border border-[#ECE2CE]">
                  {demandMultiplier.toFixed(2)}x ({demandMultiplier >= 1 ? `+${Math.round((demandMultiplier - 1) * 100)}%` : `${Math.round((demandMultiplier - 1) * 100)}%`})
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.6"
                step="0.05"
                value={demandMultiplier}
                onChange={(e) => {
                  setDemandMultiplier(parseFloat(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-[#B08D57] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#736B63]">
                <span>0.80x (Discount Drive)</span>
                <span>1.00x (Neutral)</span>
                <span>1.60x (High Compression)</span>
              </div>
            </div>

            {/* Slider 2: Weekend Peak Surge */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-[#1C1815] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#236446]" /> Weekend Peak Surcharge (Fri / Sat)
                </label>
                <span className="font-bold text-[#236446] px-2 py-0.5 rounded bg-[#EBF4EF] border border-[#C8E3D4]">
                  +{weekendSurge}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="5"
                value={weekendSurge}
                onChange={(e) => {
                  setWeekendSurge(parseInt(e.target.value, 10));
                  setActivePreset('custom');
                }}
                className="w-full accent-[#236446] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#736B63]">
                <span>0% (Flat Rate)</span>
                <span>+30% (Standard Surge)</span>
                <span>+60% (Ultra Peak)</span>
              </div>
            </div>

            {/* Slider 3: Min Length of Stay Restriction */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-[#1C1815] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#8C621E]" /> Min Length of Stay (MLOS Restriction)
                </label>
                <span className="font-bold text-[#1C1815] px-2 py-0.5 rounded bg-[#F4EFE6] border border-[#DDD7CD]">
                  {minLos} {minLos === 1 ? 'Night' : 'Nights Minimum'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={minLos}
                onChange={(e) => {
                  setMinLos(parseInt(e.target.value, 10));
                  setActivePreset('custom');
                }}
                className="w-full accent-[#1C1815] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#736B63]">
                <span>1 Night (Open Arrival)</span>
                <span>2 Nights</span>
                <span>3 Nights</span>
                <span>4 Nights (Strict Festival Block)</span>
              </div>
            </div>

            {/* Slider 4: CompSet ADR Benchmark */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-[#1C1815] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#736B63]" /> Local CompSet Benchmark ADR
                </label>
                <span className="font-bold text-[#1C1815] px-2 py-0.5 rounded bg-[#F4EFE6] border border-[#DDD7CD]">
                  ${compsetAdr}/nt
                </span>
              </div>
              <input
                type="range"
                min="300"
                max="600"
                step="10"
                value={compsetAdr}
                onChange={(e) => {
                  setCompsetAdr(parseInt(e.target.value, 10));
                  setActivePreset('custom');
                }}
                className="w-full accent-[#736B63] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#736B63]">
                <span>$300 (Low Season Market)</span>
                <span>$450 (Mid Market)</span>
                <span>$600 (High Peak CompSet)</span>
              </div>
            </div>
          </div>

          {/* Real-Time Impact Summary Card (5 Cols) */}
          <div className="lg:col-span-5 rounded-xl bg-[#1C1815] text-[#F7F4EE] p-6 flex flex-col justify-between space-y-6 shadow-md">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#3D352E]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                  Simulated Output Projection
                </span>
                <span className="text-xs text-[#A89F91]">42 Key Portfolio</span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#A89F91]">Simulated ADR</span>
                  <span className="text-xl font-serif font-bold text-white">${calculated.simulatedAdr}/nt</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#A89F91]">Projected Occupancy</span>
                  <span className="text-sm font-semibold text-white">{calculated.estimatedOccupancy}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#A89F91]">Calculated RevPAR</span>
                  <span className="text-lg font-serif font-bold text-[#C8E3D4]">${calculated.simulatedRevPar}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[#3D352E]">
                  <span className="text-xs text-[#A89F91]">30-Day Revenue Impact</span>
                  <span
                    className={`text-lg font-serif font-bold ${
                      calculated.revenueDelta >= 0 ? 'text-[#7FD1AE]' : 'text-[#EACEC8]'
                    }`}
                  >
                    {calculated.revenueDelta >= 0 ? '+' : ''}${calculated.revenueDelta.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyStrategy}
              className="w-full py-3 rounded-lg bg-[#B08D57] hover:bg-[#9B7B4A] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Deploy Strategy To PMS Engine</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. AI Strategic Rate Recommendations */}
      <div className="editorial-card rounded-2xl bg-white border border-[#DDD7CD] p-6 lg:p-8 space-y-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2DCD2]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B08D57]" />
            <h3 className="font-serif font-semibold text-[#1C1815] text-lg">
              Predictive AI Revenue Opportunities
            </h3>
          </div>
          <span className="text-[10px] uppercase font-semibold text-[#236446] bg-[#EBF4EF] px-2.5 py-1 rounded-full border border-[#C8E3D4]">
            3 Active Signals
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DDD7CD] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C621E] px-2 py-0.5 rounded bg-[#FDF6E8] border border-[#F7E5BD]">
                Weekend Compression
              </span>
              <span className="text-xs font-bold text-[#236446]">+18% Yield</span>
            </div>
            <p className="text-xs text-[#1C1815] font-medium">
              Aspen Film Festival (Oct 12-15) pacing 32% ahead of last year.
            </p>
            <p className="text-[11px] text-[#736B63]">
              Recommended Action: Increase Suite BAR from $480 to $565 and apply 3-night MLOS restriction.
            </p>
            <button
              type="button"
              onClick={handleApplyStrategy}
              className="text-xs font-semibold text-[#B08D57] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Apply Recommended Rates <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DDD7CD] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#236446] px-2 py-0.5 rounded bg-[#EBF4EF] border border-[#C8E3D4]">
                Midweek Optimization
              </span>
              <span className="text-xs font-bold text-[#236446]">+6% Occ</span>
            </div>
            <p className="text-xs text-[#1C1815] font-medium">
              Tuesday-Wednesday occupancy lagging at 54% for next 14 days.
            </p>
            <p className="text-[11px] text-[#736B63]">
              Recommended Action: Open Corporate Heritage rate ($320) and bundle complimentary $50 Spa Credit.
            </p>
            <button
              type="button"
              onClick={handleApplyStrategy}
              className="text-xs font-semibold text-[#B08D57] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Activate Midweek Package <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DDD7CD] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C2F22] px-2 py-0.5 rounded bg-[#FAF0ED] border border-[#EACEC8]">
                OTA Parity Alert
              </span>
              <span className="text-xs font-bold text-[#8C2F22]">-$42 Loss</span>
            </div>
            <p className="text-xs text-[#1C1815] font-medium">
              Booking.com mobile promotional rate undercut direct site by 8%.
            </p>
            <p className="text-[11px] text-[#736B63]">
              Recommended Action: Equalize mobile rate plan and push Direct Exclusive Breakfast incentive.
            </p>
            <button
              type="button"
              onClick={handleApplyStrategy}
              className="text-xs font-semibold text-[#B08D57] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Resolve Parity Discrepancy <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueYieldTab;
