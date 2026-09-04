import React from 'react';
import { LogOut, Receipt } from 'lucide-react';

interface FrontDeskDeparturesTabProps {
  reservations: any[];
  onCheckOut: (resId: string) => void;
  onOpenFolio: (resId: string) => void;
}

export const FrontDeskDeparturesTab: React.FC<FrontDeskDeparturesTabProps> = ({
  reservations,
  onCheckOut,
  onOpenFolio,
}) => {
  const departures = reservations.filter((r) => r.status === 'checked_in');

  return (
    <div className="editorial-card rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="font-serif font-semibold text-lg text-slate-900">
            Departures & Settle Bill ({departures.length})
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Settle guest balances, deactivate mobile digital keys, and dispatch housekeeping turnover.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="min-w-[880px] w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-4 whitespace-nowrap">Guest Profile</th>
              <th className="p-4 whitespace-nowrap">Suite #</th>
              <th className="p-4 whitespace-nowrap">Confirmation</th>
              <th className="p-4 whitespace-nowrap">Departure Date</th>
              <th className="p-4 whitespace-nowrap">Balance Status</th>
              <th className="p-4 text-right whitespace-nowrap">Departure Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departures.map((res) => {
              const gName = res.guestName || (res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : 'Guest');
              const rNumber = res.assignedRoomNumber || res.assignedRoom?.roomNumber || res.roomNumber;

              return (
                <tr key={res.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 text-sm">{gName}</div>
                    <span className="text-[11px] text-slate-500 font-medium block">{res.guestEmail || 'Direct'}</span>
                  </td>
                  <td className="p-4 font-semibold text-slate-900 whitespace-nowrap">Suite #{rNumber || '—'}</td>
                  <td className="p-4 font-mono font-medium text-slate-900 whitespace-nowrap">{res.confirmationCode}</td>
                  <td className="p-4 font-mono text-slate-600 font-medium whitespace-nowrap">{res.checkOutDate}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ${(res.totalAmount || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenFolio(res.id)}
                        className="px-3 py-1.5 rounded-lg bg-white text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shadow-xs"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-500" /> Folio
                      </button>
                      <button
                        type="button"
                        onClick={() => onCheckOut(res.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition whitespace-nowrap shadow-xs active:scale-98"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Complete Check-Out
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {departures.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-xs text-slate-500 font-medium">
                  No pending departures remaining.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FrontDeskDeparturesTab;
