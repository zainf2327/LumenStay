import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { HousekeepingChecklistModal } from '../components/HousekeepingChecklistModal';
import { ReportMaintenanceModal } from '../components/ReportMaintenanceModal';
import {
  Brush,
  CheckCircle,
  Layers,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  Wrench,
  Loader2,
  Info,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import type { RoomStatus } from '../types';

export const SupervisorRoomBoard: React.FC = () => {
  const { currentProperty, currentUser } = useAuth();
  const { subscribe } = useWebSocket();
  const toast = useToast();
  const { confirm } = useConfirm();

  const isFrontDesk = currentUser?.role === 'front_desk';
  const canInspect =
    currentUser?.role === 'housekeeping_supervisor' ||
    currentUser?.role === 'gm' ||
    currentUser?.role === 'owner';

  const [rooms, setRooms] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Layout View Switcher (Front Desk is always clean horizontal rows)
  const [layoutView, setLayoutView] = useState<'rows' | 'grid'>(isFrontDesk ? 'rows' : 'grid');

  // Filters
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [activeChecklistRoom, setActiveChecklistRoom] = useState<any | null>(null);
  const [activeMaintenanceRoom, setActiveMaintenanceRoom] = useState<any | null>(null);

  const fetchRoomData = useCallback(async () => {
    if (!currentProperty?.id) return;
    try {
      setLoading(true);
      const [roomsRes, metricsRes] = await Promise.all([
        fetch(`/api/v1/rooms?propertyId=${currentProperty.id}`).then((r) => r.json()),
        fetch(`/api/v1/rooms/dashboard?propertyId=${currentProperty.id}`).then((r) => r.json()),
      ]);

      if (roomsRes.success && Array.isArray(roomsRes.data)) {
        setRooms(roomsRes.data);
      }
      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data.metrics || metricsRes.data);
      }
    } catch (err) {
      console.error('Failed to load room board data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id]);

  useEffect(() => {
    fetchRoomData();
  }, [fetchRoomData]);

  // Live WebSocket Listeners
  useEffect(() => {
    const handleLiveEvent = () => {
      fetchRoomData();
    };

    const unsubStatus = subscribe('ROOM_STATUS_CHANGED', handleLiveEvent);
    const unsubCheckIn = subscribe('RESERVATION_CHECKED_IN', handleLiveEvent);
    const unsubGuestOut = subscribe('GUEST_CHECKED_OUT', handleLiveEvent);

    return () => {
      unsubStatus();
      unsubCheckIn();
      unsubGuestOut();
    };
  }, [subscribe, fetchRoomData]);

  // Status Change API
  const handleUpdateRoomStatus = async (roomId: string, newStatus: RoomStatus, notes?: string) => {
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes }),
      }).then((r) => r.json());

      if (res.success) {
        toast.success(
          `Suite status updated to ${newStatus.replace('_', ' ').toUpperCase()}`,
          'Room Status Updated'
        );
        fetchRoomData();
      } else {
        toast.error(res.error || 'Failed to update room status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update room status');
    }
  };

  // Reject / Re-clean Action
  const handleRejectInspection = async (room: any) => {
    const isConfirmed = await confirm({
      title: `Reject Inspection for Suite #${room.roomNumber}`,
      message:
        'Fail this room inspection and return it to Dirty (Turnover Pending)? The room attendant will be dispatched for re-cleaning.',
      confirmText: 'Reject & Require Re-Clean',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!isConfirmed) return;
    handleUpdateRoomStatus(room.id, 'dirty', 'Supervisor failed quality inspection: re-cleaning required.');
  };

  // Filter Rooms
  const filteredRooms = rooms.filter((r) => {
    if (floorFilter !== 'all' && r.floor?.toString() !== floorFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = r.roomNumber.toString().includes(q);
      const matchType = (r.roomTypeName || r.roomType?.name || '').toLowerCase().includes(q);
      const matchGuest = (r.currentReservation?.guestName || r.currentGuestName || '').toLowerCase().includes(q);
      if (!matchNumber && !matchType && !matchGuest) return false;
    }
    return true;
  });

  // Group Rooms by Floor
  const floors = Array.from(new Set(rooms.map((r) => r.floor || 1))).sort((a: any, b: any) => a - b);

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'clean':
        return {
          label: 'Clean',
          bg: 'bg-[#EBF4EF] text-[#236446] border-[#C8E3D4]',
          dot: 'bg-[#236446]',
        };
      case 'inspected':
        return {
          label: 'Inspected',
          bg: 'bg-[#FDF6E8] text-[#8C621E] border-[#F7E5BD]',
          dot: 'bg-[#8C621E]',
        };
      case 'dirty':
        return {
          label: 'Dirty',
          bg: 'bg-[#FAF0ED] text-[#8C2F22] border-[#EACEC8]',
          dot: 'bg-[#8C2F22]',
        };
      case 'out_of_order':
        return {
          label: 'Out of Order',
          bg: 'bg-[#F0EFEF] text-[#5C5855] border-[#DDDCDA]',
          dot: 'bg-[#5C5855]',
        };
      default:
        return {
          label: status,
          bg: 'bg-[#F0EFEF] text-[#5C5855] border-[#DDDCDA]',
          dot: 'bg-[#5C5855]',
        };
    }
  };

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-[#1C1815] bg-[#F7F4EE] font-sans selection:bg-[#B08D57]/20 selection:text-[#1C1815]">
      {/* 1. Header Command Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DCD2]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-medium tracking-wider uppercase text-[#8C621E] bg-[#FAF6EE] border border-[#ECE2CE]">
            <span>
              {isFrontDesk
                ? 'Front Desk Suite Status Directory'
                : 'Housekeeping Inspection & Room Board'}
            </span>
            <span>•</span>
            {loading ? (
              <span className="flex items-center gap-1 text-[#8C621E]">
                <Loader2 className="w-3 h-3 animate-spin" /> Live Syncing...
              </span>
            ) : (
              <span>Live Room State Active</span>
            )}
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#1C1815] tracking-tight mt-1.5">
            {currentProperty?.name}{' '}
            {isFrontDesk ? 'Room Status Directory' : 'Suite Condition Board'}
          </h1>
          <p className="text-xs text-[#736B63] mt-1">
            {isFrontDesk
              ? 'Real-time room status directory, floor distribution, and ready inventory (View-Only).'
              : 'Supervisor quality inspection, turnover auditing, and real-time maintenance condition board.'}
          </p>
        </div>

        {/* View Switcher for Supervisors / Info Badge for Front Desk */}
        <div className="flex items-center gap-2">
          {canInspect && (
            <div className="p-1 rounded-md bg-white border border-[#DDD7CD] flex gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => setLayoutView('rows')}
                className={`px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wider transition cursor-pointer ${
                  layoutView === 'rows'
                    ? 'bg-[#F4EFE6] text-[#1C1815] font-semibold'
                    : 'text-[#736B63] hover:text-[#1C1815]'
                }`}
              >
                Rows
              </button>
              <button
                type="button"
                onClick={() => setLayoutView('grid')}
                className={`px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wider transition cursor-pointer ${
                  layoutView === 'grid'
                    ? 'bg-[#F4EFE6] text-[#1C1815] font-semibold'
                    : 'text-[#736B63] hover:text-[#1C1815]'
                }`}
              >
                Grid
              </button>
            </div>
          )}

          <div className="px-3.5 py-2 rounded-md bg-white border border-[#DDD7CD] text-xs font-semibold text-[#1C1815] flex items-center gap-2 shadow-xs">
            <Layers className="w-4 h-4 text-[#B08D57]" />
            <span>{rooms.length} Suites in Inventory</span>
          </div>
        </div>
      </div>

      {/* 2. Room State Summary KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Inspected Ready */}
          <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#736B63]">
              <span className="font-medium uppercase tracking-wider">Inspected & Verified</span>
              <ShieldCheck className="w-4 h-4 text-[#8C621E]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#8C621E]">
                {metrics.inspectedRooms || 0}
              </span>
              <span className="text-xs text-[#736B63]">Ready for Check-In</span>
            </div>
            <p className="text-[11px] text-[#736B63]">Passed quality inspection</p>
          </div>

          {/* Clean Awaiting Inspection */}
          <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#736B63]">
              <span className="font-medium uppercase tracking-wider">Clean • Needs Inspection</span>
              <Sparkles className="w-4 h-4 text-[#236446]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#236446]">
                {metrics.cleanRooms || 0}
              </span>
              <span className="text-xs text-[#736B63]">Suites Cleaned</span>
            </div>
            <p className="text-[11px] text-[#236446]">Ready for supervisor sign-off</p>
          </div>

          {/* Dirty Turnover */}
          <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#736B63]">
              <span className="font-medium uppercase tracking-wider">Turnover Pending</span>
              <Brush className="w-4 h-4 text-[#8C2F22]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#8C2F22]">
                {metrics.dirtyRooms || 0}
              </span>
              <span className="text-xs text-[#736B63]">Rooms Dirty</span>
            </div>
            <p className="text-[11px] text-[#8C2F22]">Attendants assigned</p>
          </div>

          {/* Out of Order */}
          <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#736B63]">
              <span className="font-medium uppercase tracking-wider">Out of Order / Defect</span>
              <Wrench className="w-4 h-4 text-[#5C5855]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#5C5855]">
                {metrics.outOfOrderRooms || 0}
              </span>
              <span className="text-xs text-[#736B63]">Offline Suites</span>
            </div>
            <p className="text-[11px] text-[#5C5855]">Engineering work active</p>
          </div>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-[#736B63] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suite # (e.g. 104), room type, or guest name"
            className="w-full pl-10 pr-4 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#1C1815] placeholder-[#A69E95] focus:outline-none focus:border-[#B08D57] focus:bg-white transition"
          />
        </div>

        {/* Floor Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#736B63] font-medium uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Floor:
          </span>
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            aria-label="Filter suites by floor"
            className="px-3 py-1.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#1C1815] focus:outline-none focus:border-[#B08D57]"
          >
            <option value="all">All Floors</option>
            {floors.map((fl) => (
              <option key={fl} value={fl.toString()}>
                Floor {fl}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[#736B63] font-medium uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter suites by housekeeping status"
            className="px-3 py-1.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#1C1815] focus:outline-none focus:border-[#B08D57]"
          >
            <option value="all">All Statuses</option>
            <option value="inspected">Inspected Ready</option>
            <option value="clean">Clean (Needs Inspection)</option>
            <option value="dirty">Dirty (Turnover)</option>
            <option value="out_of_order">Out of Order</option>
          </select>
        </div>
      </div>

      {/* 4. Room Condition View: Horizontal Rows (For Front Desk & Row Mode) or Grid Matrix */}
      {layoutView === 'rows' ? (
        <div className="space-y-6">
          {floors.map((floorNum) => {
            const floorRooms = filteredRooms.filter((r) => (r.floor || 1) === floorNum);
            if (floorRooms.length === 0) return null;

            return (
              <div key={floorNum} className="editorial-card rounded-xl bg-white border border-[#DDD7CD] overflow-hidden shadow-sm">
                <div className="p-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
                  <h3 className="font-serif text-base font-medium text-[#1C1815] flex items-center gap-2">
                    <span>Floor {floorNum}</span>
                    <span className="text-xs font-sans text-[#736B63] font-normal">
                      ({floorRooms.length} Suites)
                    </span>
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5]/60 border-b border-[#E5E0D8] text-[#736B63] font-medium">
                      <tr>
                        <th className="p-4">Suite #</th>
                        <th className="p-4">Room Type</th>
                        <th className="p-4">Floor & Wing</th>
                        <th className="p-4">Room Status</th>
                        <th className="p-4">Occupancy</th>
                        <th className="p-4">Heritage Features / Quirks</th>
                        {canInspect && <th className="p-4 text-right">Inspection Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E0D8]">
                      {floorRooms.map((room) => {
                        const badge = getStatusBadge(room.status);
                        const isClean = room.status === 'clean';
                        const isInspected = room.status === 'inspected';
                        const isDirty = room.status === 'dirty';
                        const isOOO = room.status === 'out_of_order';

                        return (
                          <tr key={room.id} className="hover:bg-[#FAF8F5] transition">
                            {/* Suite Number */}
                            <td className="p-4 font-serif text-lg font-bold text-[#1C1815]">
                              #{room.roomNumber}
                            </td>

                            {/* Room Type */}
                            <td className="p-4">
                              <div className="font-semibold text-[#1C1815]">
                                {room.roomTypeName || room.roomType?.name || 'Boutique Suite'}
                              </div>
                              <span className="text-[11px] text-[#736B63]">
                                {room.roomType?.bedConfiguration || 'Standard King/Queen'}
                              </span>
                            </td>

                            {/* Floor */}
                            <td className="p-4 text-[#736B63]">
                              Floor {room.floor || 1} • {room.building || 'Main Lodge'}
                            </td>

                            {/* Room Status Pill (One Word) */}
                            <td className="p-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                <span>{badge.label}</span>
                              </span>
                            </td>

                            {/* Occupancy Condition (One Word) */}
                            <td className="p-4">
                              {room.isOccupied ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FAF6EE] text-[#8C621E] border border-[#ECE2CE]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#8C621E]" />
                                  <span>Occupied</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FAF8F5] text-[#736B63] border border-[#E5E0D8]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#A69E95]" />
                                  <span>Vacant</span>
                                </span>
                              )}
                            </td>

                            {/* Heritage Features / Notes */}
                            <td className="p-4 text-[11px] text-[#736B63] max-w-xs truncate">
                              {room.quirks || 'Standard room specifications'}
                            </td>

                            {/* Supervisor Actions (Only for Supervisors/GMs, hidden for Front Desk) */}
                            {canInspect && (
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isClean && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateRoomStatus(room.id, 'inspected')}
                                        className="px-2.5 py-1 rounded bg-[#FDF6E8] hover:bg-[#F9ECCF] text-[#8C621E] border border-[#F7E5BD] font-medium text-xs flex items-center gap-1 transition cursor-pointer"
                                      >
                                        <ShieldCheck className="w-3.5 h-3.5" /> Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleRejectInspection(room)}
                                        className="px-2 py-1 rounded hover:bg-[#FAF0ED] text-[#8C2F22] border border-transparent hover:border-[#EACEC8] font-medium text-xs flex items-center gap-1 transition cursor-pointer"
                                      >
                                        <XCircle className="w-3.5 h-3.5" /> Reject
                                      </button>
                                    </>
                                  )}

                                  {isDirty && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveChecklistRoom(room)}
                                      className="px-2.5 py-1 rounded bg-[#EBF4EF] hover:bg-[#D5EADF] text-[#236446] border border-[#C8E3D4] font-medium text-xs flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <Brush className="w-3.5 h-3.5" /> Clean
                                    </button>
                                  )}

                                  {isInspected && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRoomStatus(room.id, 'dirty')}
                                      className="px-2 py-1 rounded hover:bg-[#FAF0ED] text-[#8C2F22] text-xs transition cursor-pointer"
                                    >
                                      <RotateCcw className="w-3 h-3 inline mr-1" /> Reset
                                    </button>
                                  )}

                                  {isOOO && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRoomStatus(room.id, 'clean')}
                                      className="px-2.5 py-1 rounded bg-[#EBF4EF] text-[#236446] border border-[#C8E3D4] font-medium text-xs flex items-center gap-1 transition cursor-pointer"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" /> Return Clean
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setActiveMaintenanceRoom(room)}
                                    className="p-1 rounded hover:bg-white text-[#736B63] hover:text-[#1C1815] border border-transparent hover:border-[#DDD7CD] transition cursor-pointer"
                                    title="Report Defect"
                                  >
                                    <Wrench className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
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
      ) : (
        /* Grid Matrix View */
        <div className="space-y-6">
          {floors.map((floorNum) => {
            const floorRooms = filteredRooms.filter((r) => (r.floor || 1) === floorNum);
            if (floorRooms.length === 0) return null;

            return (
              <div key={floorNum} className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#E2DCD2]">
                  <h3 className="font-serif text-lg font-medium text-[#1C1815] flex items-center gap-2">
                    <span>Floor {floorNum}</span>
                    <span className="text-xs font-sans text-[#736B63] font-normal">
                      ({floorRooms.length} Suites)
                    </span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {floorRooms.map((room) => {
                    const badge = getStatusBadge(room.status);
                    const isClean = room.status === 'clean';
                    const isInspected = room.status === 'inspected';
                    const isDirty = room.status === 'dirty';
                    const isOOO = room.status === 'out_of_order';

                    return (
                      <div
                        key={room.id}
                        className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-4 flex flex-col justify-between space-y-3 shadow-xs hover:border-[#B08D57] transition"
                      >
                        {/* Room Header */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="font-serif text-2xl font-bold text-[#1C1815]">
                                  #{room.roomNumber}
                                </span>
                                <span className="text-[11px] text-[#736B63] truncate">
                                  {room.roomTypeName || room.roomType?.name || 'Suite'}
                                </span>
                              </div>
                            </div>

                            {/* Status Pill */}
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badge.bg}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              <span>{badge.label}</span>
                            </span>
                          </div>

                          {/* Room Heritage Notes / Quirks */}
                          {room.quirks && (
                            <div className="p-2 rounded bg-[#FAF8F5] border border-[#EFEAE2] text-[11px] text-[#736B63] flex items-start gap-1.5">
                              <Info className="w-3.5 h-3.5 text-[#8C621E] shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{room.quirks}</span>
                            </div>
                          )}

                          {/* Occupancy Indicator */}
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[11px] text-[#736B63]">Occupancy:</span>
                            {room.isOccupied ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FAF6EE] text-[#8C621E] border border-[#ECE2CE]">
                                Occupied
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FAF8F5] text-[#736B63] border border-[#E5E0D8]">
                                Vacant
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Supervisor Action Bar */}
                        {canInspect && (
                          <div className="pt-2 border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              {isClean && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRoomStatus(room.id, 'inspected')}
                                    className="px-2.5 py-1 rounded bg-[#FDF6E8] hover:bg-[#F9ECCF] text-[#8C621E] border border-[#F7E5BD] font-medium flex items-center gap-1 transition cursor-pointer"
                                    title="Approve room quality and verify for arrival"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectInspection(room)}
                                    className="px-2 py-1 rounded hover:bg-[#FAF0ED] text-[#8C2F22] border border-transparent hover:border-[#EACEC8] font-medium flex items-center gap-1 transition cursor-pointer"
                                    title="Reject room inspection and dispatch for re-cleaning"
                                  >
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </>
                              )}

                              {isDirty && (
                                <button
                                  type="button"
                                  onClick={() => setActiveChecklistRoom(room)}
                                  className="px-2.5 py-1 rounded bg-[#EBF4EF] hover:bg-[#D5EADF] text-[#236446] border border-[#C8E3D4] font-medium flex items-center gap-1 transition cursor-pointer"
                                >
                                  <Brush className="w-3.5 h-3.5" /> Cleaning
                                </button>
                              )}

                              {isInspected && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRoomStatus(room.id, 'dirty')}
                                  className="px-2 py-1 rounded hover:bg-[#FAF0ED] text-[#8C2F22] text-[11px] transition cursor-pointer"
                                  title="Reset status for next guest turnover"
                                >
                                  <RotateCcw className="w-3 h-3 inline mr-1" /> Reset
                                </button>
                              )}

                              {isOOO && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRoomStatus(room.id, 'clean')}
                                  className="px-2.5 py-1 rounded bg-[#EBF4EF] text-[#236446] border border-[#C8E3D4] font-medium flex items-center gap-1 transition cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Return Clean
                                </button>
                              )}
                            </div>

                            {/* Maintenance Defect Trigger */}
                            <button
                              type="button"
                              onClick={() => setActiveMaintenanceRoom(room)}
                              className="p-1.5 rounded hover:bg-[#FAF8F5] text-[#736B63] hover:text-[#1C1815] border border-transparent hover:border-[#DDD7CD] transition cursor-pointer"
                              title="Report Maintenance Issue / Out of Order"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modals */}
      {activeChecklistRoom && (
        <HousekeepingChecklistModal
          room={activeChecklistRoom}
          onClose={() => setActiveChecklistRoom(null)}
          onComplete={async (notes) => {
            try {
              await fetch(`/api/v1/rooms/${activeChecklistRoom.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'clean', notes }),
              });
              fetchRoomData();
            } catch (err) {
              console.error('Failed to update room clean:', err);
            }
            setActiveChecklistRoom(null);
          }}
        />
      )}

      {activeMaintenanceRoom && (
        <ReportMaintenanceModal
          room={activeMaintenanceRoom}
          onClose={() => setActiveMaintenanceRoom(null)}
          onSubmit={async (issueData) => {
            try {
              await fetch(`/api/v1/rooms/${activeMaintenanceRoom.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: issueData.takeOutOfOrder ? 'out_of_order' : activeMaintenanceRoom.status,
                  notes: `${issueData.category}: ${issueData.description} (Priority: ${issueData.priority})`,
                }),
              });
              fetchRoomData();
            } catch (err) {
              console.error('Failed to report maintenance:', err);
            }
            setActiveMaintenanceRoom(null);
          }}
        />
      )}
    </div>
  );
};

export default SupervisorRoomBoard;
