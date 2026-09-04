import React from 'react';
import { Key } from 'lucide-react';

interface FrontDeskArrivalsTabProps {
  reservations: any[];
  onCheckIn: (reservation: any) => void;
}

export const FrontDeskArrivalsTab: React.FC<FrontDeskArrivalsTabProps> = ({
  reservations,
  onCheckIn,
}) => {
  const arrivals = reservations.filter((r) => r.status === 'confirmed');

  const formatStayDates = (inDate?: string, outDate?: string): { inStr: string; outStr: string } => {
    if (!inDate) return { inStr: '—', outStr: '' };
    try {
      const dIn = new Date(inDate + 'T12:00:00');
      const dOut = outDate ? new Date(outDate + 'T12:00:00') : null;
      const inStr = dIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const outStr = dOut ? dOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      return { inStr, outStr };
    } catch {
      return { inStr: inDate, outStr: outDate || '' };
    }
  };


  return (
    <div className="editorial-card rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="font-serif font-semibold text-lg text-slate-900">
            Today's Incoming Arrivals ({arrivals.length})
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Verify guest identification, confirm credit card authorizations, and issue digital BLE Salto mobile keys.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="min-w-[900px] w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-4 whitespace-nowrap">Guest Name</th>
              <th className="p-4 whitespace-nowrap">Confirmation</th>
              <th className="p-4 whitespace-nowrap">Assigned Suite</th>
              <th className="p-4 whitespace-nowrap">Stay Dates</th>
              <th className="p-4 whitespace-nowrap">Total Amount</th>
              <th className="p-4 whitespace-nowrap">Digital Key</th>
              <th className="p-4 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {arrivals.map((res) => {
              const gName = res.guestName || (res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : 'Valued Guest');
              const gEmail = res.guestEmail || res.guest?.email || 'Direct Guest';
              const rNumber = res.assignedRoomNumber || res.assignedRoom?.roomNumber || res.roomNumber;
              const rType = res.roomTypeName || res.roomType?.name || 'Boutique Suite';
              const dates = formatStayDates(res.checkInDate, res.checkOutDate);

              return (
                <tr key={res.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 text-sm">{gName}</div>
                    <span className="text-[11px] text-slate-500 font-medium block">{gEmail}</span>
                  </td>
                  <td className="p-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                    {res.confirmationCode}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{rNumber ? `Suite #${rNumber}` : 'Unassigned'}</div>
                    <span className="text-[11px] text-slate-500 font-medium block">{rType}</span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800">
                      <span>{dates.inStr}</span>
                      <span className="text-[#C5A059]">→</span>
                      <span>{dates.outStr}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block font-sans mt-0.5 font-medium">
                      {res.totalNights} night{res.totalNights > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                    ${(res.totalAmount || 0).toFixed(2)}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="inline-flex items-center text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 whitespace-nowrap">
                      Pending Arrival
                    </span>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onCheckIn(res)}
                      className="px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-98 shrink-0 whitespace-nowrap"
                    >
                      <Key className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Check-In</span>
                    </button>
                  </td>
                </tr>
              );
            })}

            {arrivals.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-xs text-slate-500 font-medium">
                  No incoming arrivals remaining for today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FrontDeskArrivalsTab;

