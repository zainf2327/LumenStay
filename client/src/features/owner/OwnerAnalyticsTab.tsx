import React from 'react';

interface OwnerAnalyticsTabProps {
  metrics: any;
  reservations: any[];
  totalRooms: number;
}

export const OwnerAnalyticsTab: React.FC<OwnerAnalyticsTabProps> = ({
  metrics,
  reservations,
  totalRooms,
}) => {
  const inHouse = metrics?.inHouse ?? reservations.filter((r) => r.status === 'checked_in').length;
  const occupancy = metrics?.occupancyRate || Math.round((inHouse / Math.max(1, totalRooms)) * 100);
  const revenue = reservations.reduce((acc, r) => acc + (r.totalAmount || 0), 0) || inHouse * 395;
  const adr = inHouse > 0 ? Math.round(revenue / inHouse) : 385;
  const revpar = Math.round(revenue / Math.max(1, totalRooms));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
          <span className="text-xs text-[#736B63] uppercase tracking-wider block font-medium">Active Gross Yield</span>
          <span className="text-3xl font-serif font-bold text-[#236446]">${revenue.toLocaleString()}</span>
        </div>
        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
          <span className="text-xs text-[#736B63] uppercase tracking-wider block font-medium">ADR Benchmark</span>
          <span className="text-3xl font-serif font-bold text-[#8C621E]">${adr}/nt</span>
        </div>
        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
          <span className="text-xs text-[#736B63] uppercase tracking-wider block font-medium">RevPAR Yield</span>
          <span className="text-3xl font-serif font-bold text-[#1C1815]">${revpar}</span>
        </div>
        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
          <span className="text-xs text-[#736B63] uppercase tracking-wider block font-medium">Portfolio Occupancy</span>
          <span className="text-3xl font-serif font-bold text-[#1C1815]">{occupancy}%</span>
        </div>
      </div>
    </div>
  );
};

export default OwnerAnalyticsTab;
