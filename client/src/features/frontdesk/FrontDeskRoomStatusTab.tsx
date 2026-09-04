import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import type { RoomStatus } from '../../types';

interface FrontDeskRoomStatusTabProps {
  rooms: any[];
}

export const FrontDeskRoomStatusTab: React.FC<FrontDeskRoomStatusTabProps> = ({ rooms }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [floorFilter, setFloorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredRooms = rooms.filter((r) => {
    if (floorFilter !== 'all' && r.floor?.toString() !== floorFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = r.roomNumber.toString().includes(q);
      const matchType = (r.roomTypeName || r.roomType?.name || '').toLowerCase().includes(q);
      if (!matchNum && !matchType) return false;
    }
    return true;
  });

  const floors = Array.from(new Set(rooms.map((r) => r.floor || 1))).sort((a: any, b: any) => a - b);

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'clean':
        return { label: 'Clean', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold', dot: 'bg-emerald-600' };
      case 'inspected':
        return { label: 'Inspected', bg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold', dot: 'bg-amber-600' };
      case 'dirty':
        return { label: 'Dirty', bg: 'bg-rose-100 text-rose-800 border-rose-300 font-bold', dot: 'bg-rose-600' };
      case 'out_of_order':
        return { label: 'Out of Order', bg: 'bg-slate-100 text-slate-700 border-slate-300 font-bold', dot: 'bg-slate-500' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-700 border-slate-300 font-bold', dot: 'bg-slate-500' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="editorial-card rounded-xl bg-white border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suite # or room type"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" /> Floor:
          </span>
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            aria-label="Filter suites by floor"
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400"
          >
            <option value="all">All Floors</option>
            {floors.map((fl) => (
              <option key={fl} value={fl.toString()}>
                Floor {fl}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter suites by housekeeping status"
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-400"
          >
            <option value="all">All Statuses</option>
            <option value="inspected">Inspected</option>
            <option value="clean">Clean</option>
            <option value="dirty">Dirty</option>
            <option value="out_of_order">Out of Order</option>
          </select>
        </div>
      </div>

      {/* Horizontal Table Rows */}
      {floors.map((floorNum) => {
        const floorRooms = filteredRooms.filter((r) => (r.floor || 1) === floorNum);
        if (floorRooms.length === 0) return null;

        return (
          <div key={floorNum} className="editorial-card rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-serif text-sm font-semibold text-slate-900">
                Floor {floorNum} ({floorRooms.length} Suites)
              </h3>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[780px] text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Suite #</th>
                    <th className="p-4">Room Type</th>
                    <th className="p-4">Floor & Wing</th>
                    <th className="p-4">Room Status</th>
                    <th className="p-4">Occupancy</th>
                    <th className="p-4">Heritage Features</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {floorRooms.map((room) => {
                    const badge = getStatusBadge(room.status);

                    return (
                      <tr key={room.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-serif text-lg font-bold text-slate-900">
                          #{room.roomNumber}
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">
                            {room.roomTypeName || room.roomType?.name || 'Boutique Suite'}
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {room.roomType?.bedConfiguration || 'Standard Bedding'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">
                          Floor {room.floor || 1} • {room.building || 'Main Lodge'}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            <span>{badge.label}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          {room.isOccupied ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                              <span>Occupied</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>Vacant</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600 max-w-xs truncate text-[11px] font-medium">
                          {room.quirks || 'Standard Boutique Amenities'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FrontDeskRoomStatusTab;
