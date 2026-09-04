import React from 'react';
import { Receipt } from 'lucide-react';

interface OwnerLedgerAuditTabProps {
  reservations: any[];
  onOpenFolio: (resId: string) => void;
}

export const OwnerLedgerAuditTab: React.FC<OwnerLedgerAuditTabProps> = ({
  reservations,
  onOpenFolio,
}) => {
  return (
    <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] overflow-hidden shadow-sm">
      <div className="p-4 bg-[#FAF8F5] border-b border-[#E5E0D8]">
        <h3 className="font-serif text-base font-semibold text-[#1C1815]">Financial Folio & Revenue Ledger ({reservations.length})</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF8F5]/60 border-b border-[#E5E0D8] text-[#736B63] font-medium">
            <tr>
              <th className="p-4">Guest Profile</th>
              <th className="p-4">Confirmation</th>
              <th className="p-4">Stay Dates</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Payment Status</th>
              <th className="p-4 text-right">Audit Ledger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D8]">
            {reservations.map((res) => {
              const gName = res.guestName || (res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : 'Guest');

              return (
                <tr key={res.id} className="hover:bg-[#FAF8F5] transition">
                  <td className="p-4 font-semibold text-[#1C1815]">{gName}</td>
                  <td className="p-4 font-mono text-[#1C1815]">{res.confirmationCode}</td>
                  <td className="p-4 font-mono text-[#4A433D]">{res.checkInDate} → {res.checkOutDate}</td>
                  <td className="p-4 font-mono font-bold text-[#1C1815]">${(res.totalAmount || 0).toFixed(2)}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#EBF4EF] text-[#236446] border border-[#C8E3D4]">
                      {res.paymentStatus || 'Authorized'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenFolio(res.id)}
                      className="px-3 py-1.5 rounded-md bg-[#FAF8F5] hover:bg-white text-[#1C1815] border border-[#DDD7CD] text-xs font-medium inline-flex items-center gap-1.5 transition"
                    >
                      <Receipt className="w-3.5 h-3.5 text-[#B08D57]" />
                      <span>Audit Folio</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OwnerLedgerAuditTab;
