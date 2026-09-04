import React from 'react';
import { DollarSign, TrendingUp, Briefcase, Building2, ArrowUpRight } from 'lucide-react';

interface GMExecutiveKPIsTabProps {
  metrics: any;
  reservations: any[];
  totalRooms: number;
}

export const GMExecutiveKPIsTab: React.FC<GMExecutiveKPIsTabProps> = ({
  metrics,
  reservations,
  totalRooms,
}) => {
  const inHouseCount = metrics?.inHouse ?? reservations.filter((r) => r.status === 'checked_in').length;
  const occupancyRate = metrics?.occupancyRate || Math.round((inHouseCount / Math.max(1, totalRooms)) * 100);
  const grossRevenue = reservations.reduce((acc, r) => acc + (r.totalAmount || 0), 0) || inHouseCount * 395;
  const adr = inHouseCount > 0 ? Math.round(grossRevenue / inHouseCount) : 385;
  const revpar = Math.round(grossRevenue / Math.max(1, totalRooms));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#736B63]">
            <span className="font-medium uppercase tracking-wider">Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-[#236446]" />
          </div>
          <span className="text-3xl font-serif font-bold text-[#236446]">
            ${grossRevenue.toLocaleString()}
          </span>
          <p className="text-[11px] text-[#236446] flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Live booking ledger
          </p>
        </div>

        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#736B63]">
            <span className="font-medium uppercase tracking-wider">Average Daily Rate (ADR)</span>
            <TrendingUp className="w-4 h-4 text-[#8C621E]" />
          </div>
          <span className="text-3xl font-serif font-bold text-[#8C621E]">${adr}</span>
          <p className="text-[11px] text-[#736B63]">Per occupied suite</p>
        </div>

        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#736B63]">
            <span className="font-medium uppercase tracking-wider">RevPAR (Yield)</span>
            <Briefcase className="w-4 h-4 text-[#B08D57]" />
          </div>
          <span className="text-3xl font-serif font-bold text-[#1C1815]">${revpar}</span>
          <p className="text-[11px] text-[#736B63]">Across {totalRooms} total keys</p>
        </div>

        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#736B63]">
            <span className="font-medium uppercase tracking-wider">Occupancy</span>
            <Building2 className="w-4 h-4 text-[#1C1815]" />
          </div>
          <span className="text-3xl font-serif font-bold text-[#1C1815]">{occupancyRate}%</span>
          <div className="w-full h-1.5 bg-[#F4EFE6] rounded-full overflow-hidden mt-2">
            <div className="h-full bg-[#B08D57] rounded-full" style={{ width: `${Math.min(100, occupancyRate)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GMExecutiveKPIsTab;
