import React from 'react';
import { ShieldCheck, XCircle, Sparkles } from 'lucide-react';

interface SupervisorInspectionTabProps {
  rooms: any[];
  onApprove: (roomId: string) => void;
  onReject: (room: any) => void;
}

export const SupervisorInspectionTab: React.FC<SupervisorInspectionTabProps> = ({
  rooms,
  onApprove,
  onReject,
}) => {
  const cleanRooms = rooms.filter((r) => r.status === 'clean');

  return (
    <div className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-[#E5E7EB] bg-white flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-heading font-bold text-lg sm:text-xl text-[#0F172A]">
              Suites Awaiting Quality Inspection
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-2xs">
              {cleanRooms.length} Ready
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Verify linen quality, bathroom amenities, mini-bar restocking, and sign off for guest check-in.
          </p>
        </div>
      </div>

      {cleanRooms.length === 0 ? (
        <div className="p-12 text-center text-sm font-semibold text-[#64748B]">
          🎉 All clean suites have been inspected and verified for guest check-in!
        </div>
      ) : (
        <>
          {/* Desktop Single-Row Table (lg:block) */}
          <div className="hidden lg:block w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[#334155] font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-20">Suite</th>
                  <th className="py-3.5 px-4">Room Type</th>
                  <th className="py-3.5 px-4">Floor & Wing</th>
                  <th className="py-3.5 px-4">Condition</th>
                  <th className="py-3.5 px-4">Heritage Notes</th>
                  <th className="py-3.5 px-4 text-right whitespace-nowrap">Supervisor Sign-Off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {cleanRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-[#F8F9FA]/80 transition group">
                    <td className="py-3.5 px-4 font-heading font-extrabold text-base text-[#0F172A] whitespace-nowrap">
                      {room.roomNumber}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-sm text-[#0F172A]">
                        {room.roomTypeName || room.roomType?.name || 'Suite'}
                      </div>
                      <span className="text-[11px] text-[#475569] font-medium">
                        {room.roomType?.bedConfiguration || 'Standard King'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#F1F5F9] text-[#334155] font-semibold text-xs border border-[#E2E8F0]">
                        Floor {room.floor || 1} • {room.building || 'Historic Lodge'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Clean</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#475569] font-medium max-w-xs truncate">
                      {room.quirks || 'Standard room turnover'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onApprove(room.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-white" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(room)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 hover:border-rose-300 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Reclean</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View (lg:hidden) */}
          <div className="lg:hidden p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/50">
            {cleanRooms.map((room) => (
              <div
                key={room.id}
                className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-xs flex flex-col justify-between gap-3.5 hover:shadow-sm transition"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-extrabold text-xl text-[#0F172A]">
                        {room.roomNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <Sparkles className="w-3 h-3 text-emerald-600" /> Clean
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                      Floor {room.floor || 1}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[#0F172A]">
                      {room.roomTypeName || room.roomType?.name || 'Suite'}
                    </h4>
                    <p className="text-[11px] text-[#64748B] font-medium">
                      {room.roomType?.bedConfiguration || 'Standard King'} • {room.building || 'Historic Lodge'}
                    </p>
                  </div>

                  {room.quirks && (
                    <p className="text-xs text-[#475569] bg-[#F8F9FA] p-2 rounded-lg border border-[#E2E8F0]">
                      {room.quirks}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F1F5F9]">
                  <button
                    type="button"
                    onClick={() => onApprove(room.id)}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(room)}
                    className="w-full py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Reclean</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SupervisorInspectionTab;
