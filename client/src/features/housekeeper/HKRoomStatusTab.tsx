import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { RoomStatus } from '../../types';

interface HKRoomStatusTabProps {
  rooms: any[];
}

export const HKRoomStatusTab: React.FC<HKRoomStatusTabProps> = ({ rooms }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState('all');

  const filteredRooms = rooms.filter((r) => {
    if (floorFilter !== 'all' && r.floor?.toString() !== floorFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!r.roomNumber.toString().includes(q)) return false;
    }
    return true;
  });

  const floors = Array.from(new Set(rooms.map((r) => r.floor || 1))).sort((a: any, b: any) => a - b);

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'clean':
        return { label: 'Clean', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' };
      case 'inspected':
        return { label: 'Inspected', bg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold' };
      case 'dirty':
        return { label: 'Dirty', bg: 'bg-rose-100 text-rose-800 border-rose-300 font-bold' };
      case 'out_of_order':
        return { label: 'Out of Order', bg: 'bg-slate-100 text-slate-700 border-slate-300 font-bold' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-300 font-bold' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="editorial-card rounded-xl bg-white border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suite #"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition"
          />
        </div>

        <select
          value={floorFilter}
          onChange={(e) => setFloorFilter(e.target.value)}
          aria-label="Filter by floor"
          className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400"
        >
          <option value="all">All Floors</option>
          {floors.map((fl) => (
            <option key={fl} value={fl.toString()}>Floor {fl}</option>
          ))}
        </select>
      </div>

      {/* Horizontal Table Rows */}
      <div className="editorial-card rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[720px] text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Suite #</th>
                <th className="p-4">Room Type</th>
                <th className="p-4">Floor</th>
                <th className="p-4">Status</th>
                <th className="p-4">Occupancy</th>
                <th className="p-4">Attendant Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRooms.map((room) => {
                const badge = getStatusBadge(room.status);
                return (
                  <tr key={room.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-serif text-base font-bold text-slate-900">#{room.roomNumber}</td>
                    <td className="p-4 font-semibold text-slate-900">{room.roomTypeName || room.roomType?.name || 'Suite'}</td>
                    <td className="p-4 text-slate-600 font-medium">Floor {room.floor || 1}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4">
                      {room.isOccupied ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300">Occupied</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">Vacant</span>
                      )}
                    </td>
                    <td className="p-4 text-[11px] text-slate-600 truncate max-w-xs font-medium">{room.quirks || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HKRoomStatusTab;
