import React from 'react';
import { Brush, Clock } from 'lucide-react';

interface HKCleaningQueueTabProps {
  rooms: any[];
  onStartCleaning: (room: any) => void;
}

export const HKCleaningQueueTab: React.FC<HKCleaningQueueTabProps> = ({
  rooms,
  onStartCleaning,
}) => {
  const dirtyRooms = rooms.filter((r) => r.status === 'dirty');

  return (
    <div className="space-y-4">
      <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#E5E0D8] flex items-center justify-between">
          <div>
            <h3 className="font-serif font-normal text-lg text-[#1C1815]">
              My Turnover Cleaning Queue ({dirtyRooms.length})
            </h3>
            <p className="text-xs text-[#736B63]">
              Tap a room to open the mobile cleaning & disinfection checklist and mark clean for supervisor inspection.
            </p>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dirtyRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onStartCleaning(room)}
              className="p-5 rounded-xl bg-white border border-[#EACEC8] hover:border-[#8C2F22] hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-serif text-3xl font-bold text-[#1C1815]">#{room.roomNumber}</span>
                    <span className="text-xs text-[#736B63] block font-medium mt-0.5">
                      {room.roomTypeName || room.roomType?.name || 'Deluxe Suite'}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FAF0ED] text-[#8C2F22] border border-[#EACEC8] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Turnover
                  </span>
                </div>

                <div className="text-xs text-[#736B63] bg-[#FAF8F5] p-2.5 rounded-lg border border-[#E5E0D8]">
                  <span className="font-semibold text-[#1C1815]">Section:</span> Floor {room.floor || 1} • {room.building || 'Main Lodge'}
                  {room.quirks && (
                    <span className="block mt-1 text-[11px] text-[#8C621E] italic">Note: {room.quirks}</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="w-full py-2.5 rounded-lg bg-[#1C1815] group-hover:bg-[#236446] text-[#F7F4EE] font-medium text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Brush className="w-3.5 h-3.5 text-[#B08D57]" />
                <span>Start Cleaning Checklist</span>
              </button>
            </div>
          ))}

          {dirtyRooms.length === 0 && (
            <div className="col-span-full p-12 text-center text-xs text-[#736B63]">
              🎉 Great job! All assigned rooms have been cleaned and submitted for inspection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HKCleaningQueueTab;
