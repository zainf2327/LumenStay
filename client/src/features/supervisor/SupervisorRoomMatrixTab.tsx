import React, { useState } from 'react';
import { Search, ShieldCheck, XCircle, Brush, RotateCcw, CheckCircle, Wrench, Info } from 'lucide-react';
import type { RoomStatus } from '../../types';

interface SupervisorRoomMatrixTabProps {
  rooms: any[];
  onUpdateStatus: (roomId: string, newStatus: RoomStatus) => void;
  onRejectInspection: (room: any) => void;
  onOpenChecklist: (room: any) => void;
  onOpenMaintenance: (room: any) => void;
}

export const SupervisorRoomMatrixTab: React.FC<SupervisorRoomMatrixTabProps> = ({
  rooms,
  onUpdateStatus,
  onRejectInspection,
  onOpenChecklist,
  onOpenMaintenance,
}) => {
  const [layoutMode, setLayoutMode] = useState<'rows' | 'grid'>('rows');
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
        return { label: 'Clean', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs', dot: 'bg-emerald-600' };
      case 'inspected':
        return { label: 'Inspected', bg: 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs', dot: 'bg-amber-600' };
      case 'dirty':
        return { label: 'Dirty', bg: 'bg-rose-100 text-rose-800 border-rose-300 shadow-2xs', dot: 'bg-rose-600' };
      case 'out_of_order':
        return { label: 'Out of Order', bg: 'bg-slate-200 text-slate-800 border-slate-300 shadow-2xs', dot: 'bg-slate-600' };
      default:
        return { label: status, bg: 'bg-slate-100 text-slate-800 border-slate-200', dot: 'bg-slate-500' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Layout Control */}
      <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-[#736B63] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suite # or room type"
            className="w-full pl-10 pr-4 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#1C1815] focus:outline-none focus:border-[#B08D57]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            aria-label="Filter by floor"
            className="px-3 py-1.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#1C1815] focus:outline-none focus:border-[#B08D57]"
          >
            <option value="all">All Floors</option>
            {floors.map((fl) => (
              <option key={fl} value={fl.toString()}>Floor {fl}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="px-3 py-1.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#1C1815] focus:outline-none focus:border-[#B08D57]"
          >
            <option value="all">All Statuses</option>
            <option value="inspected">Inspected</option>
            <option value="clean">Clean</option>
            <option value="dirty">Dirty</option>
            <option value="out_of_order">Out of Order</option>
          </select>

          <div className="p-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] flex gap-1">
            <button
              type="button"
              onClick={() => setLayoutMode('rows')}
              className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
                layoutMode === 'rows' ? 'bg-white text-[#1C1815] shadow-xs font-semibold' : 'text-[#736B63]'
              }`}
            >
              Rows
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
                layoutMode === 'grid' ? 'bg-white text-[#1C1815] shadow-xs font-semibold' : 'text-[#736B63]'
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Rows View */}
      {layoutMode === 'rows' ? (
        <div className="space-y-6">
          {floors.map((floorNum) => {
            const floorRooms = filteredRooms.filter((r) => (r.floor || 1) === floorNum);
            if (floorRooms.length === 0) return null;

            return (
              <div key={floorNum} className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden shadow-xs">
                <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-[#E5E7EB] flex items-center justify-between">
                  <h3 className="font-heading text-sm font-bold text-[#0F172A]">Floor {floorNum} ({floorRooms.length} Suites)</h3>
                </div>

                {/* Desktop Single-Row Table (hidden below lg) */}
                <div className="hidden lg:block w-full overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[#334155] font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4 w-16">Suite</th>
                        <th className="py-3 px-4">Room Type</th>
                        <th className="py-3 px-4">Floor & Wing</th>
                        <th className="py-3 px-4">Room Status</th>
                        <th className="py-3 px-4">Occupancy</th>
                        <th className="py-3 px-4">Features</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {floorRooms.map((room) => {
                        const badge = getStatusBadge(room.status);
                        const isClean = room.status === 'clean';
                        const isInspected = room.status === 'inspected';
                        const isDirty = room.status === 'dirty';
                        const isOOO = room.status === 'out_of_order';

                        return (
                          <tr key={room.id} className="hover:bg-[#F8F9FA]/80 transition group">
                            <td className="py-3 px-4 font-heading font-extrabold text-base text-[#0F172A] whitespace-nowrap">
                              {room.roomNumber}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="font-bold text-sm text-[#0F172A]">
                                {room.roomTypeName || room.roomType?.name || 'Suite'}
                              </div>
                              <span className="text-[11px] text-[#475569] font-medium">
                                {room.roomType?.bedConfiguration || 'Standard'}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#F1F5F9] text-[#334155] font-semibold text-xs border border-[#E2E8F0]">
                                Floor {room.floor || 1} • {room.building || 'Historic Lodge'}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                <span>{badge.label}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {room.isOccupied ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                                  <span>Occupied</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                  <span>Vacant</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs text-[#475569] font-medium max-w-[180px] truncate">
                              {room.quirks || 'Standard'}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5 shrink-0">
                                {isClean && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onUpdateStatus(room.id, 'inspected')}
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs transition cursor-pointer"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" /> Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onRejectInspection(room)}
                                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <XCircle className="w-3.5 h-3.5" /> Reclean
                                    </button>
                                  </>
                                )}
                                {isDirty && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenChecklist(room)}
                                    className="px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                                  >
                                    <Brush className="w-3.5 h-3.5 text-[#C5A059]" /> Clean
                                  </button>
                                )}
                                {isInspected && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateStatus(room.id, 'dirty')}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3 inline mr-0.5" /> Reset
                                  </button>
                                )}
                                {isOOO && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateStatus(room.id, 'clean')}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs transition cursor-pointer"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" /> Return Clean
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onOpenMaintenance(room)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                                  title="Report Defect"
                                >
                                  <Wrench className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile & Tablet Card View (lg:hidden) */}
                <div className="lg:hidden p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/50">
                  {floorRooms.map((room) => {
                    const badge = getStatusBadge(room.status);
                    const isClean = room.status === 'clean';
                    const isInspected = room.status === 'inspected';
                    const isDirty = room.status === 'dirty';
                    const isOOO = room.status === 'out_of_order';

                    return (
                      <div
                        key={room.id}
                        className="bg-white rounded-xl p-4 border border-[#E5E7EB] shadow-xs flex flex-col justify-between gap-3 hover:shadow-sm transition"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-heading font-extrabold text-xl text-[#0F172A]">
                                {room.roomNumber}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                <span>{badge.label}</span>
                              </span>
                            </div>
                            {room.isOccupied ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300">
                                Occupied
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                                Vacant
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="font-bold text-sm text-[#0F172A]">
                              {room.roomTypeName || room.roomType?.name || 'Suite'}
                            </h4>
                            <p className="text-[11px] text-[#64748B] font-medium">
                              Floor {room.floor || 1} • {room.building || 'Historic Lodge'} • {room.roomType?.bedConfiguration || 'Standard'}
                            </p>
                          </div>

                          {room.quirks && (
                            <p className="text-xs text-[#475569] bg-[#F8F9FA] p-2 rounded-lg border border-[#E2E8F0]">
                              {room.quirks}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                          <div className="flex-1 flex items-center gap-1.5">
                            {isClean && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onUpdateStatus(room.id, 'inspected')}
                                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs inline-flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRejectInspection(room)}
                                  className="flex-1 py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 font-bold text-xs inline-flex items-center justify-center gap-1 transition cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reclean
                                </button>
                              </>
                            )}
                            {isDirty && (
                              <button
                                type="button"
                                onClick={() => onOpenChecklist(room)}
                                className="w-full py-2 px-3 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] active:scale-95 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                              >
                                <Brush className="w-3.5 h-3.5 text-[#C5A059]" /> Clean
                              </button>
                            )}
                            {isInspected && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(room.id, 'dirty')}
                                className="w-full py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs inline-flex items-center justify-center gap-1 transition cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3 inline mr-0.5" /> Reset to Dirty
                              </button>
                            )}
                            {isOOO && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(room.id, 'clean')}
                                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Return Clean
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenMaintenance(room)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer shrink-0"
                            title="Report Defect"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid Mode */
        <div className="space-y-6">
          {floors.map((floorNum) => {
            const floorRooms = filteredRooms.filter((r) => (r.floor || 1) === floorNum);
            if (floorRooms.length === 0) return null;

            return (
              <div key={floorNum} className="space-y-3">
                <h3 className="font-heading text-base sm:text-lg font-bold text-[#0F172A]">Floor {floorNum} ({floorRooms.length} Suites)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {floorRooms.map((room) => {
                    const badge = getStatusBadge(room.status);
                    const isClean = room.status === 'clean';
                    const isInspected = room.status === 'inspected';
                    const isDirty = room.status === 'dirty';
                    const isOOO = room.status === 'out_of_order';

                    return (
                      <div key={room.id} className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-4 sm:p-5 space-y-3.5 shadow-xs hover:shadow-md transition">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-heading text-xl sm:text-2xl font-extrabold text-[#0F172A]">{room.roomNumber}</span>
                            <span className="text-xs text-[#475569] font-semibold block mt-0.5">{room.roomTypeName || 'Suite'}</span>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            <span>{badge.label}</span>
                          </span>
                        </div>

                        {room.quirks && (
                          <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E2E8F0] text-xs text-[#334155] flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 text-[#C5A059] shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{room.quirks}</span>
                          </div>
                        )}

                        <div className="pt-1 flex items-center justify-between text-xs">
                          <span className="text-xs text-[#64748B] font-medium">Occupancy:</span>
                          {room.isOccupied ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-300 shadow-2xs">Occupied</span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">Vacant</span>
                          )}
                        </div>

                        <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between gap-1.5 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isClean && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onUpdateStatus(room.id, 'inspected')}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRejectInspection(room)}
                                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs cursor-pointer"
                                >
                                  Reclean
                                </button>
                              </>
                            )}
                            {isDirty && (
                              <button
                                type="button"
                                onClick={() => onOpenChecklist(room)}
                                className="px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold text-xs shadow-xs cursor-pointer"
                              >
                                Clean
                              </button>
                            )}
                            {isInspected && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(room.id, 'dirty')}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                            {isOOO && (
                              <button
                                type="button"
                                onClick={() => onUpdateStatus(room.id, 'clean')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                              >
                                Return Clean
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => onOpenMaintenance(room)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
                            title="Report Defect"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SupervisorRoomMatrixTab;
