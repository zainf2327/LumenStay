import React, { useState } from 'react';
import { ShieldCheck, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface ChannelItem {
  id: string;
  name: string;
  share: number; // percentage
  commissionPct: number;
  grossRevenue: number;
  color: string;
  badge: string;
}

const DEFAULT_CHANNELS: ChannelItem[] = [
  {
    id: 'direct',
    name: 'Direct Web (LumenStay Engine)',
    share: 48,
    commissionPct: 0,
    grossRevenue: 142800,
    color: '#236446',
    badge: '0% Commission • Highest Margin',
  },
  {
    id: 'expedia',
    name: 'Expedia & Hotels.com',
    share: 22,
    commissionPct: 18,
    grossRevenue: 65450,
    color: '#1E293B',
    badge: '18% OTA Fee • Corporate/Package',
  },
  {
    id: 'booking',
    name: 'Booking.com Global',
    share: 16,
    commissionPct: 15,
    grossRevenue: 47600,
    color: '#B08D57',
    badge: '15% OTA Fee • International Travel',
  },
  {
    id: 'airbnb',
    name: 'Airbnb Boutique Feed',
    share: 8,
    commissionPct: 14,
    grossRevenue: 23800,
    color: '#C25442',
    badge: '14% Fee • Leisure & Extended Stays',
  },
  {
    id: 'groups',
    name: 'Wedding & Group Blocks',
    share: 6,
    commissionPct: 0,
    grossRevenue: 17850,
    color: '#64748B',
    badge: 'Direct Contract • 0% Fee',
  },
];

export const ChannelDonutChart: React.FC = () => {
  const [selectedChannelId, setSelectedChannelId] = useState<string>('direct');
  const [hoveredChannelId, setHoveredChannelId] = useState<string | null>(null);

  const activeId = hoveredChannelId || selectedChannelId;
  const activeChannel = DEFAULT_CHANNELS.find((c) => c.id === activeId) || DEFAULT_CHANNELS[0];

  const directSavings = Math.round((DEFAULT_CHANNELS[0].grossRevenue * 0.18)); // Savings vs 18% OTA baseline

  // Donut geometry parameters
  const size = 260;
  const strokeWidth = 36;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute SVG dash arrays and offsets
  let cumulativePercent = 0;
  const slices = DEFAULT_CHANNELS.map((ch) => {
    const strokeDasharray = `${(ch.share / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercent / 100) * circumference);
    cumulativePercent += ch.share;
    return {
      ...ch,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-[#E2DCD2] p-6 shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#EAE4D8]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-medium text-[#1C1815]">
              Channel Share &amp; Commission Drag Analysis
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FAF6EE] text-[#8C621E] border border-[#ECE2CE]">
              Portfolio Distribution
            </span>
          </div>
          <p className="text-xs text-[#736B63] mt-0.5">
            Breakdown of direct web conversions vs. third-party OTA commission fees.
          </p>
        </div>

        {/* Annual Direct Savings Callout */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EBF4EF] border border-[#C8E3D4] text-xs">
          <ShieldCheck className="w-4 h-4 text-[#236446]" />
          <div>
            <span className="text-[#236446] font-semibold">${directSavings.toLocaleString()}</span>
            <span className="text-[#236446]/80 text-[11px] ml-1">Direct Commission Retained</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Donut on Left, Channel Breakdown Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: SVG Donut Ring with Live Center Readout */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-[260px] h-[260px]">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90"
            >
              {/* Background Ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#F4EFE6"
                strokeWidth={strokeWidth}
              />

              {/* Slices */}
              {slices.map((slice) => {
                const isCurrent = slice.id === activeId;
                return (
                  <circle
                    key={slice.id}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isCurrent ? strokeWidth + 6 : strokeWidth}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredChannelId(slice.id)}
                    onMouseLeave={() => setHoveredChannelId(null)}
                    onClick={() => setSelectedChannelId(slice.id)}
                    style={{
                      filter: isCurrent ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : undefined,
                    }}
                  />
                );
              })}
            </svg>

            {/* Center Content Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#736B63]">
                {activeChannel.name.split(' ')[0]} Share
              </span>
              <span className="text-3xl font-serif font-bold text-[#1C1815] my-0.5">
                {activeChannel.share}%
              </span>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 text-white"
                style={{ backgroundColor: activeChannel.color }}
              >
                ${activeChannel.grossRevenue.toLocaleString()}
              </span>
              <span className="text-[10px] text-[#8C2F22] mt-1 font-medium">
                {activeChannel.commissionPct > 0
                  ? `-$${Math.round((activeChannel.grossRevenue * activeChannel.commissionPct) / 100).toLocaleString()} Fee`
                  : 'Zero Commission'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[#736B63] mt-3 italic text-center">
            Click or hover over slices to inspect channel economics
          </p>
        </div>

        {/* Right: Detailed Channel Matrix */}
        <div className="lg:col-span-7 space-y-3">
          {DEFAULT_CHANNELS.map((ch) => {
            const isSelected = ch.id === activeId;
            const feeCost = Math.round((ch.grossRevenue * ch.commissionPct) / 100);
            const netRevenue = ch.grossRevenue - feeCost;

            return (
              <div
                key={ch.id}
                onClick={() => setSelectedChannelId(ch.id)}
                onMouseEnter={() => setHoveredChannelId(ch.id)}
                onMouseLeave={() => setHoveredChannelId(null)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FAF8F5] border-[#B08D57] shadow-xs ring-1 ring-[#B08D57]/30'
                    : 'bg-white border-[#EAE4D8] hover:bg-[#FAF8F5]/60 hover:border-[#DDD7CD]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: ch.color }}
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#1C1815] block">
                        {ch.name}
                      </span>
                      <span className="text-[10px] text-[#736B63]">{ch.badge}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-[#1C1815]">
                      ${ch.grossRevenue.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[#736B63]">{ch.share}% of bookings</div>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="w-full h-1.5 bg-[#EAE4D8] rounded-full mt-2.5 overflow-hidden flex">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${ch.share}%`,
                      backgroundColor: ch.color,
                    }}
                  />
                </div>

                {/* Financial Takeaway Row */}
                <div className="flex items-center justify-between text-[11px] pt-2 mt-1 border-t border-[#F0EBE1]">
                  <span className="text-[#736B63]">
                    Net Retained: <strong className="text-[#1C1815] font-semibold">${netRevenue.toLocaleString()}</strong>
                  </span>
                  {feeCost > 0 ? (
                    <span className="text-[#8C2F22] flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3" /> -${feeCost.toLocaleString()} ({ch.commissionPct}%)
                    </span>
                  ) : (
                    <span className="text-[#236446] font-semibold flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> 100% Margin Kept
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
