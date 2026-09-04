import React, { useState } from 'react';
import { Wrench, AlertTriangle } from 'lucide-react';

interface HKReportDefectTabProps {
  rooms: any[];
  onOpenReportModal: (room: any) => void;
}

export const HKReportDefectTab: React.FC<HKReportDefectTabProps> = ({
  rooms,
  onOpenReportModal,
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-8 max-w-xl mx-auto space-y-6 text-center shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-[#FAF0ED] border border-[#EACEC8] text-[#8C2F22] mx-auto flex items-center justify-center">
        <Wrench className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-2xl font-normal text-[#1C1815]">
          Report Suite Defect or Issue
        </h3>
        <p className="text-xs text-[#736B63]">
          Flag plumbing leaks, broken fixtures, HVAC problems, or damaged furniture to immediately dispatch engineering and optionally mark the suite Out of Order.
        </p>
      </div>

      <div className="space-y-4 text-left">
        <div>
          <label className="block text-xs font-semibold text-[#1C1815] uppercase tracking-wider mb-1">
            Select Suite
          </label>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-[#FAF8F5] border border-[#DDD7CD] text-xs font-medium text-[#1C1815] focus:outline-none focus:border-[#B08D57]"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Suite #{r.roomNumber} ({r.roomTypeName || r.roomType?.name || 'Suite'}) — Floor {r.floor}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => selectedRoom && onOpenReportModal(selectedRoom)}
          className="w-full py-3 rounded-lg bg-[#8C2F22] hover:bg-[#722318] text-[#F7F4EE] font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
        >
          <AlertTriangle className="w-4 h-4 text-[#F7E5BD]" />
          <span>Open Defect Report Form</span>
        </button>
      </div>
    </div>
  );
};

export default HKReportDefectTab;
