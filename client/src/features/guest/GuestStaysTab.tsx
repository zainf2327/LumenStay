import React from 'react';
import { Key, MapPin, CheckCircle2 } from 'lucide-react';

interface GuestStaysTabProps {
  onOpenMobileKey: () => void;
}

export const GuestStaysTab: React.FC<GuestStaysTabProps> = ({ onOpenMobileKey }) => {
  return (
    <div className="space-y-6">
      {/* Active In-House Stay Card */}
      <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-6 space-y-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E0D8]">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EBF4EF] text-[#236446] border border-[#C8E3D4]">
              Active In-House Reservation
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#1C1815] mt-1">Birchwood Heritage Suite #204</h3>
            <p className="text-xs text-[#736B63] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#B08D57]" /> Birchwood Manor & Lodge • Floor 2, East Wing
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenMobileKey}
            className="px-5 py-2.5 rounded-lg bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] text-xs font-semibold inline-flex items-center gap-2 transition cursor-pointer shadow-sm"
          >
            <Key className="w-4 h-4 text-[#B08D57]" />
            <span>Open Salto Digital Key</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[#736B63] block">Confirmation</span>
            <span className="font-mono font-bold text-[#1C1815] text-sm">BW-782914</span>
          </div>
          <div>
            <span className="text-[#736B63] block">Dates</span>
            <span className="font-mono text-[#1C1815]">Today → Sunday</span>
          </div>
          <div>
            <span className="text-[#736B63] block">Guests</span>
            <span className="text-[#1C1815] font-medium">2 Adults</span>
          </div>
          <div>
            <span className="text-[#736B63] block">Key Status</span>
            <span className="text-[#236446] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> BLE Key Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestStaysTab;
