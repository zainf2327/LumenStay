import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface MaintenanceOOOSuitesTabProps {
  rooms: any[];
  onReturnToService: (roomId: string) => void;
}

export const MaintenanceOOOSuitesTab: React.FC<MaintenanceOOOSuitesTabProps> = ({
  rooms,
  onReturnToService,
}) => {
  const oooRooms = rooms.filter((r) => r.status === 'out_of_order');

  return (
    <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] overflow-hidden shadow-sm">
      <div className="p-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
        <div>
          <h3 className="font-serif text-base font-semibold text-[#1C1815]">Out of Order (OOO) Suites ({oooRooms.length})</h3>
          <p className="text-xs text-[#736B63]">Suites taken offline for plumbing, electrical, carpentry, or HVAC overhauls.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF8F5]/60 border-b border-[#E5E0D8] text-[#736B63] font-medium">
            <tr>
              <th className="p-4">Suite #</th>
              <th className="p-4">Room Type</th>
              <th className="p-4">Floor & Wing</th>
              <th className="p-4">Offline Reason</th>
              <th className="p-4 text-right">Engineering Release</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D8]">
            {oooRooms.map((room) => (
              <tr key={room.id} className="hover:bg-[#FAF8F5] transition">
                <td className="p-4 font-serif text-base font-bold text-[#1C1815]">#{room.roomNumber}</td>
                <td className="p-4 font-medium text-[#1C1815]">{room.roomTypeName || room.roomType?.name || 'Suite'}</td>
                <td className="p-4 text-[#736B63]">Floor {room.floor || 1} • {room.building || 'Main Lodge'}</td>
                <td className="p-4 text-[#8C2F22] font-medium">{room.quirks || 'Maintenance in progress'}</td>
                <td className="p-4 text-right">
                  <button
                    type="button"
                    onClick={() => onReturnToService(room.id)}
                    className="px-3 py-1.5 rounded-md bg-[#EBF4EF] hover:bg-[#D5EADF] text-[#236446] border border-[#C8E3D4] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Return to Service (Clean)</span>
                  </button>
                </td>
              </tr>
            ))}

            {oooRooms.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-xs text-[#736B63]">
                  All suites are in active operational rotation. No rooms currently Out of Order.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MaintenanceOOOSuitesTab;
