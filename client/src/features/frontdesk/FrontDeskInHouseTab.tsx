import React from 'react';
import { Receipt, PlusCircle, LogOut, Key } from 'lucide-react';

interface FrontDeskInHouseTabProps {
  reservations: any[];
  onOpenFolio: (resId: string) => void;
  onAddCharge: (chargeData: any) => void;
  onCheckOut: (resId: string) => void;
}

export const FrontDeskInHouseTab: React.FC<FrontDeskInHouseTabProps> = ({
  reservations,
  onOpenFolio,
  onAddCharge,
  onCheckOut,
}) => {
  const inHouse = reservations.filter((r) => r.status === 'checked_in');

  return (
    <div className="editorial-card rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="font-serif font-semibold text-lg text-slate-900">
            In-House Active Guests ({inHouse.length})
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage live guest folios, post dining and incidental charges, and handle departure turnovers.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="min-w-[950px] w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-4 whitespace-nowrap">Guest Profile</th>
              <th className="p-4 whitespace-nowrap">Suite #</th>
              <th className="p-4 whitespace-nowrap">Confirmation</th>
              <th className="p-4 whitespace-nowrap">Departure Date</th>
              <th className="p-4 whitespace-nowrap">Folio Status</th>
              <th className="p-4 whitespace-nowrap">Mobile Key</th>
              <th className="p-4 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inHouse.map((res) => {
              const gName = res.guestName || (res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : 'Valued Guest');
              const gEmail = res.guestEmail || res.guest?.email || 'Direct';
              const rNumber = res.assignedRoomNumber || res.assignedRoom?.roomNumber || res.roomNumber;
              const rType = res.roomTypeName || res.roomType?.name || 'Suite';

              return (
                <tr key={res.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 text-sm">{gName}</div>
                    <span className="text-[11px] text-slate-500 font-medium block">{gEmail}</span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">Suite #{rNumber || '—'}</div>
                    <span className="text-[11px] text-slate-500 font-medium block">{rType}</span>
                  </td>
                  <td className="p-4 font-mono font-semibold text-slate-900 whitespace-nowrap">{res.confirmationCode}</td>
                  <td className="p-4 font-mono text-slate-600 font-medium whitespace-nowrap">{res.checkOutDate}</td>
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${
                        res.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {res.paymentStatus || 'Authorized'}
                    </span>
                    <span className="text-xs font-mono text-slate-900 font-bold block mt-1">
                      ${(res.totalAmount || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 whitespace-nowrap">
                      <Key className="w-3 h-3 text-emerald-600" /> Active BLE
                    </span>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenFolio(res.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 transition cursor-pointer inline-flex items-center gap-1 text-xs font-semibold shadow-xs"
                        title="View Folio Ledger"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        <span>Folio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onAddCharge({
                            id: res.id,
                            roomNumber: rNumber,
                            guestName: gName,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 text-amber-900 hover:text-amber-950 border border-amber-300 transition cursor-pointer inline-flex items-center gap-1 text-xs font-semibold shadow-xs"
                        title="Post Incidental Charge"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Add Charge</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onCheckOut(res.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-98 whitespace-nowrap"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Check-Out</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {inHouse.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-xs text-slate-500 font-medium">
                  No active in-house guests currently checked in.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FrontDeskInHouseTab;
