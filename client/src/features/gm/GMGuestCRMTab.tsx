import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { Guest } from '../../types';

export const GMGuestCRMTab: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/v1/guests')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setGuests(res.data);
      })
      .catch((err) => console.error('Failed to load guests CRM:', err));
  }, []);

  const filtered = guests.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${g.firstName} ${g.lastName}`.toLowerCase();
    return fullName.includes(q) || g.email.toLowerCase().includes(q);
  });

  return (
    <div className="editorial-card rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm space-y-0">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-base font-semibold text-slate-900">Guest Profiles & Loyalty CRM ({filtered.length})</h3>
        <div className="w-64 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guest CRM..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[720px] text-left text-xs border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-4">Guest Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Loyalty Tier</th>
              <th className="p-4">Points</th>
              <th className="p-4">VIP</th>
              <th className="p-4">Preferences & Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((guest) => (
              <tr key={guest.id} className="hover:bg-slate-50/80 transition">
                <td className="p-4 font-semibold text-slate-900">{guest.firstName} {guest.lastName}</td>
                <td className="p-4 text-[11px] text-slate-500 font-medium">{guest.email}</td>
                <td className="p-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-900 border border-amber-300">
                    {guest.loyaltyTier}
                  </span>
                </td>
                <td className="p-4 font-mono font-bold text-slate-900">{guest.loyaltyPoints} pts</td>
                <td className="p-4">
                  {guest.vipStatus ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">VIP</span>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium">Standard</span>
                  )}
                </td>
                <td className="p-4 text-[11px] text-slate-600 max-w-xs truncate font-medium">{guest.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GMGuestCRMTab;
