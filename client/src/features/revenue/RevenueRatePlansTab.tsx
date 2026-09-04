import React, { useState } from 'react';
import {
  Tag,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
  Globe,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { ChannelDonutChart } from '../../components/charts/ChannelDonutChart';

interface RatePlan {
  id: string;
  name: string;
  code: string;
  basePrice: number;
  discountPct: number;
  minStay: number;
  perks: string[];
  active: boolean;
  weekendSurcharge: number;
  cancellationPolicy: string;
}

export const RevenueRatePlansTab: React.FC = () => {
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([
    {
      id: 'rp_bar',
      name: 'Best Available Rate (BAR)',
      code: 'BAR-FLEX',
      basePrice: 420,
      discountPct: 0,
      minStay: 1,
      perks: ['Free Cancellation up to 48h', 'Welcome Heritage Cocktail', 'High-Speed Wi-Fi'],
      active: true,
      weekendSurcharge: 45,
      cancellationPolicy: 'Flexible 48h',
    },
    {
      id: 'rp_nonref',
      name: 'Advance Purchase Saver',
      code: 'ADV-NONREF',
      basePrice: 355,
      discountPct: 15,
      minStay: 1,
      perks: ['15% Non-Refundable Savings', 'Complimentary Valet Parking', 'Lumen Elite Points'],
      active: true,
      weekendSurcharge: 30,
      cancellationPolicy: 'Non-Refundable',
    },
    {
      id: 'rp_corp',
      name: 'Heritage Corporate Executive',
      code: 'CORP-EXEC',
      basePrice: 330,
      discountPct: 20,
      minStay: 1,
      perks: ['Guaranteed 2PM Late Checkout', 'High-Speed Boardroom Access', 'Breakfast Included'],
      active: true,
      weekendSurcharge: 0,
      cancellationPolicy: 'Same-day 6PM',
    },
    {
      id: 'rp_extended',
      name: 'Extended Luxury Sanctuary (3+ Nts)',
      code: 'EXT-STAY',
      basePrice: 310,
      discountPct: 25,
      minStay: 3,
      perks: ['$75 Spa & Wellness Credit', 'Daily Gourmet Breakfast', 'Complimentary Laundry Prep'],
      active: true,
      weekendSurcharge: 20,
      cancellationPolicy: '7 Days Prior',
    },
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const handleAdjustPrice = (id: string, delta: number) => {
    setRatePlans((prev) =>
      prev.map((rp) => (rp.id === id ? { ...rp, basePrice: Math.max(150, rp.basePrice + delta) } : rp))
    );
  };

  const handleToggleActive = (id: string) => {
    setRatePlans((prev) =>
      prev.map((rp) => (rp.id === id ? { ...rp, active: !rp.active } : rp))
    );
  };

  const handleSyncParity = () => {
    setNotification('Channel Distribution Parity Sync deployed across Direct, Booking.com, and Expedia!');
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Notification Banner */}
      {notification && (
        <div className="p-4 rounded-xl bg-[#EBF4EF] border border-[#C8E3D4] text-[#236446] flex items-center gap-3 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">{notification}</p>
        </div>
      )}

      {/* 1. Header & Quick Sync */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DCD2]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-[#8C621E] bg-[#FAF6EE] border border-[#ECE2CE] mb-1">
            <Tag className="w-3 h-3 text-[#B08D57]" /> Dynamic Rate Architecture
          </div>
          <h2 className="text-xl font-serif font-semibold text-[#1C1815]">
            Rate Plans, Yield Rules & Channel Distribution
          </h2>
          <p className="text-xs text-[#736B63]">
            Manage published base rates, direct perks, and cross-channel OTA rate parity integrity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSyncParity}
          className="px-4 py-2.5 rounded-lg bg-[#1C1815] hover:bg-[#3D352E] text-[#F7F4EE] text-xs font-semibold uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Sync Channel Parity</span>
        </button>
      </div>

      {/* 2. Channel Distribution & Margin Analysis Donut */}
      <ChannelDonutChart />

      {/* 3. Interactive Rate Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ratePlans.map((plan) => (
          <div
            key={plan.id}
            className={`editorial-card rounded-2xl bg-white border p-6 space-y-5 transition shadow-xs ${
              plan.active ? 'border-[#DDD7CD]' : 'border-[#DDD7CD]/50 opacity-60'
            }`}
          >
            {/* Top Info */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C621E] px-2 py-0.5 rounded bg-[#FAF6EE] border border-[#ECE2CE]">
                  {plan.code}
                </span>
                <h3 className="text-lg font-serif font-semibold text-[#1C1815] mt-1.5">{plan.name}</h3>
                <p className="text-xs text-[#736B63]">{plan.cancellationPolicy}</p>
              </div>

              {/* Status Toggle */}
              <button
                type="button"
                onClick={() => handleToggleActive(plan.id)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition ${
                  plan.active
                    ? 'bg-[#EBF4EF] text-[#236446] border border-[#C8E3D4]'
                    : 'bg-[#F0EFEF] text-[#736B63] border border-[#DDDCDA]'
                }`}
              >
                {plan.active ? 'Active on Web' : 'Paused'}
              </button>
            </div>

            {/* Price & Adjuster */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#736B63]">Base Nightly Rate</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-serif font-bold text-[#1C1815]">${plan.basePrice}</span>
                  <span className="text-xs text-[#736B63]">/ night</span>
                </div>
                <span className="text-[10px] text-[#236446] font-medium">
                  +${plan.weekendSurcharge} weekend surcharge
                </span>
              </div>

              {/* Quick Stepper */}
              <div className="flex items-center gap-1.5 bg-white border border-[#DDD7CD] rounded-lg p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleAdjustPrice(plan.id, -10)}
                  className="p-1.5 rounded-md hover:bg-[#F4EFE6] text-[#736B63] hover:text-[#1C1815] transition cursor-pointer"
                  title="Decrease rate by $10"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-[#1C1815] px-2 min-w-8 text-center">
                  ${plan.basePrice}
                </span>
                <button
                  type="button"
                  onClick={() => handleAdjustPrice(plan.id, 10)}
                  className="p-1.5 rounded-md hover:bg-[#F4EFE6] text-[#736B63] hover:text-[#1C1815] transition cursor-pointer"
                  title="Increase rate by $10"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Included Direct Perks */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#1C1815] uppercase tracking-wider block">
                Direct Guest Perks
              </span>
              <div className="space-y-1.5">
                {plan.perks.map((perk, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#4A433D]">
                    <Sparkles className="w-3.5 h-3.5 text-[#B08D57] shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Live Channel Parity & Distribution Margin Audit */}
      <div className="editorial-card rounded-2xl bg-white border border-slate-200 p-6 lg:p-8 space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 mb-1">
              <Globe className="w-3 h-3 text-emerald-700" /> 98% Parity Health
            </div>
            <h3 className="text-xl font-serif font-semibold text-slate-900">
              Cross-Channel Distribution & Margin Audit
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Real-time net margin comparison across direct booking and global travel distribution channels.
            </p>
          </div>
        </div>

        {/* Channels Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[720px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Published BAR</th>
                <th className="py-3 px-4">Channel Commission</th>
                <th className="py-3 px-4">Net Realized ADR</th>
                <th className="py-3 px-4">Parity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-slate-50/50 font-medium">
                <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C5A059]" /> Direct LumenStay Site
                </td>
                <td className="py-3.5 px-4 font-serif font-bold text-slate-900">$420</td>
                <td className="py-3.5 px-4 text-emerald-700 font-bold">0% ($0 fee)</td>
                <td className="py-3.5 px-4 font-serif font-bold text-emerald-700">$420 / nt (100% Margin)</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Benchmark Best
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 text-slate-800 font-medium">Booking.com</td>
                <td className="py-3.5 px-4 font-serif text-slate-900 font-semibold">$420</td>
                <td className="py-3.5 px-4 text-rose-600 font-semibold">15% ($63 fee)</td>
                <td className="py-3.5 px-4 font-serif font-bold text-slate-900">$357 / nt</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Matched Parity
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 text-slate-800 font-medium">Expedia Partner Solutions</td>
                <td className="py-3.5 px-4 font-serif text-slate-900 font-semibold">$420</td>
                <td className="py-3.5 px-4 text-rose-600 font-semibold">18% ($75.60 fee)</td>
                <td className="py-3.5 px-4 font-serif font-bold text-slate-900">$344.40 / nt</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Matched Parity
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 text-slate-800 font-medium">Luxury Escapes / GDS Global</td>
                <td className="py-3.5 px-4 font-serif text-slate-900 font-semibold">$450 (Package)</td>
                <td className="py-3.5 px-4 text-rose-600 font-semibold">20% ($90 fee)</td>
                <td className="py-3.5 px-4 font-serif font-bold text-slate-900">$360 / nt</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                    Opaque Bundled
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueRatePlansTab;
