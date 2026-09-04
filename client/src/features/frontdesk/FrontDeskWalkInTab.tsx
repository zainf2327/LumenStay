import React from 'react';
import { UserPlus } from 'lucide-react';

interface FrontDeskWalkInTabProps {
  onOpenWalkInModal: () => void;
  metrics: any;
}

export const FrontDeskWalkInTab: React.FC<FrontDeskWalkInTabProps> = ({
  onOpenWalkInModal,
  metrics,
}) => {
  const readyCount = (metrics?.cleanRooms || 0) + (metrics?.inspectedRooms || 0);

  return (
    <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-8 text-center max-w-2xl mx-auto space-y-6 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-[#FAF6EE] border border-[#ECE2CE] text-[#8C621E] mx-auto flex items-center justify-center">
        <UserPlus className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-2xl font-normal text-[#1C1815]">
          Walk-In Guest Registration & Instant Allocation
        </h3>
        <p className="text-xs text-[#736B63] max-w-md mx-auto">
          Reserve available suites for immediate arrival, collect ID credentials, capture payment or authorisations, and issue mobile digital keys.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
        <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
          <span className="text-[10px] text-[#736B63] uppercase tracking-wider block font-medium">Ready Inventory</span>
          <span className="text-xl font-serif font-bold text-[#1C1815]">{readyCount} Suites</span>
          <span className="text-[10px] text-[#236446] block mt-0.5">Clean & inspected</span>
        </div>

        <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
          <span className="text-[10px] text-[#736B63] uppercase tracking-wider block font-medium">Salto Lock Protocol</span>
          <span className="text-xl font-serif font-bold text-[#8C621E]">Live BLE</span>
          <span className="text-[10px] text-[#736B63] block mt-0.5">Instant key provision</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenWalkInModal}
        className="px-6 py-3 rounded-lg bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] font-medium text-xs inline-flex items-center gap-2 transition cursor-pointer shadow-md"
      >
        <UserPlus className="w-4 h-4 text-[#B08D57]" />
        <span>Launch Walk-In Registration Flow</span>
      </button>
    </div>
  );
};

export default FrontDeskWalkInTab;
