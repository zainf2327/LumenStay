import React from 'react';
import type { RoomStatus } from '../../types';

interface GMRoomHealthTabProps {
  rooms: any[];
}

export const GMRoomHealthTab: React.FC<GMRoomHealthTabProps> = ({ rooms }) => {
  const inspected = rooms.filter((r) => r.status === 'inspected').length;
  const clean = rooms.filter((r) => r.status === 'clean').length;
  const dirty = rooms.filter((r) => r.status === 'dirty').length;
  const ooo = rooms.filter((r) => r.status === 'out_of_order').length;

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
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="editorial-card rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">Inspected</span>
          <span className="text-3xl font-serif font-bold text-amber-600">{inspected}</span>
        </div>
        <div className="editorial-card rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">Clean (Pending Review)</span>
          <span className="text-3xl font-serif font-bold text-emerald-700">{clean}</span>
        </div>
        <div className="editorial-card rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">Dirty (Turnover)</span>
          <span className="text-3xl font-serif font-bold text-rose-600">{dirty}</span>
        </div>
        <div className="editorial-card rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
          <span className="text-xs text-slate-500 uppercase tracking-wider block font-semibold">Out of Order</span>
          <span className="text-3xl font-serif font-bold text-slate-700">{ooo}</span>
        </div>
      </div>

      {/* Overview Table */}
      <div className="editorial-card rounded-xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="font-serif text-base font-semibold text-slate-900">Full Property Room Health Matrix ({rooms.length} Suites)</h3>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[760px] text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Suite #</th>
                <th className="p-4">Room Type</th>
                <th className="p-4">Floor</th>
                <th className="p-4">Status</th>
                <th className="p-4">Occupancy</th>
                <th className="p-4">Condition Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((room) => {
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
                    <td className="p-4 text-[11px] text-slate-600 truncate max-w-xs font-medium">{room.quirks || 'Standard'}</td>
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

export default GMRoomHealthTab;
