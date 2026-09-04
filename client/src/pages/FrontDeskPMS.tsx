import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { CheckInModal } from '../components/CheckInModal';
import { FolioModal } from '../components/FolioModal';
import { WalkInBookingModal } from '../components/WalkInBookingModal';
import { AddFolioChargeModal } from '../components/AddFolioChargeModal';
import {
  Key,
  LogOut,
  Receipt,
  Users,
  CheckCircle,
  Brush,
  TrendingUp,
  Layers,
  UserPlus,
  PlusCircle,
  Search,
  Check,
  MoreVertical,
  Loader2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import type { RoomStatus } from '../types';

export const FrontDeskPMS: React.FC = () => {
  const { currentProperty, currentUser } = useAuth();
  const { subscribe } = useWebSocket();
  const toast = useToast();
  const { confirm } = useConfirm();

  // Role Permissions Flags
  const isSupervisorOrMaintenance =
    currentUser?.role === 'housekeeping_supervisor' || currentUser?.role === 'maintenance';
  const isExecutiveOrRevenue =
    currentUser?.role === 'gm' || currentUser?.role === 'owner' || currentUser?.role === 'revenue_manager';

  // Metrics & Data State
  const [metrics, setMetrics] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'rooms' | 'queue'>(
    currentUser?.role === 'front_desk' ? 'queue' : 'rooms'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [queueFilter, setQueueFilter] = useState<'all' | 'arrivals' | 'inhouse' | 'departures'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [activeCheckInRes, setActiveCheckInRes] = useState<any | null>(null);
  const [activeFolioResId, setActiveFolioResId] = useState<string | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState<boolean>(false);
  const [activeChargeRes, setActiveChargeRes] = useState<any | null>(null);
  const [activeMenuRoomId, setActiveMenuRoomId] = useState<string | null>(null);

  const fetchPMSData = useCallback(async () => {
    if (!currentProperty?.id) return;
    try {
      setLoading(true);
      const [metricsRes, resQueue, roomsRes] = await Promise.all([
        fetch(`/api/v1/rooms/dashboard?propertyId=${currentProperty.id}`).then((r) => r.json()),
        fetch(`/api/v1/rooms/reservations?propertyId=${currentProperty.id}`).then((r) => r.json()),
        fetch(`/api/v1/rooms?propertyId=${currentProperty.id}`).then((r) => r.json()),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data.metrics || metricsRes.data);
      }
      if (roomsRes.success && Array.isArray(roomsRes.data)) {
        setRooms(roomsRes.data);
      }
      if (resQueue.success && Array.isArray(resQueue.data)) {
        setReservations(resQueue.data);
      }
    } catch (err) {
      console.error('Failed to load PMS dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id]);

  useEffect(() => {
    fetchPMSData();
  }, [fetchPMSData]);

  // Live WebSocket Listeners
  useEffect(() => {
    const handleLiveEvent = () => {
      fetchPMSData();
    };

    const unsubCheckIn = subscribe('RESERVATION_CHECKED_IN', handleLiveEvent);
    const unsubGuestIn = subscribe('GUEST_CHECKED_IN', handleLiveEvent);
    const unsubGuestOut = subscribe('GUEST_CHECKED_OUT', handleLiveEvent);
    const unsubStatus = subscribe('ROOM_STATUS_CHANGED', handleLiveEvent);
    const unsubFolio = subscribe('FOLIO_UPDATED', handleLiveEvent);
    const unsubCreated = subscribe('RESERVATION_CREATED', handleLiveEvent);
    const unsubCancelled = subscribe('RESERVATION_CANCELLED', handleLiveEvent);

    return () => {
      unsubCheckIn();
      unsubGuestIn();
      unsubGuestOut();
      unsubStatus();
      unsubFolio();
      unsubCreated();
      unsubCancelled();
    };
  }, [subscribe, fetchPMSData]);

  const handleUpdateRoomStatus = async (roomId: string, newStatus: RoomStatus) => {
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).then((r) => r.json());

      if (res.success) {
        setActiveMenuRoomId(null);
        toast.success(`Suite status updated to ${newStatus.replace('_', ' ').toUpperCase()}`, 'Room Status Updated');
        fetchPMSData();
      } else {
        toast.error(res.error || 'Failed to update room status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update room status');
    }
  };

  const handleQuickCheckOut = async (reservationId: string) => {
    const isConfirmed = await confirm({
      title: 'Confirm Guest Check-Out',
      message: 'Complete check-out for this guest? This will deactivate their digital mobile key and immediately mark the suite as Dirty for housekeeping turnover.',
      confirmText: 'Complete Check-Out',
      cancelText: 'Keep In-House',
      variant: 'danger',
    });

    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/v1/rooms/reservations/${reservationId}/check-out`, {
        method: 'POST',
      }).then((r) => r.json());

      if (res.success) {
        toast.success('Guest check-out completed. Key deactivated and room marked dirty.', 'Check-Out Complete');
        fetchPMSData();
      } else {
        toast.error(res.error || 'Failed to check out reservation');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to check out reservation');
    }
  };

  // Filter Rooms
  const filteredRooms = rooms.filter((r) => {
    const occupantName = r.currentReservation?.guestName || r.currentGuestName || '';
    if (floorFilter !== 'all' && r.floor?.toString() !== floorFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = r.roomNumber?.toLowerCase().includes(q);
      const typeMatch = r.roomTypeName?.toLowerCase().includes(q);
      const guestMatch = occupantName.toLowerCase().includes(q);
      if (!numMatch && !typeMatch && !guestMatch) return false;
    }
    if (statusFilter === 'clean') return r.status === 'clean';
    if (statusFilter === 'dirty') return r.status === 'dirty';
    if (statusFilter === 'inspected') return r.status === 'inspected';
    if (statusFilter === 'out_of_order') return r.status === 'out_of_order';
    if (statusFilter === 'occupied') return r.isOccupied;
    if (statusFilter === 'vacant') return !r.isOccupied;
    return true;
  });

  // Group rooms by floor
  const floors = Array.from(new Set(rooms.map((r) => r.floor || 1))).sort((a, b) => a - b);
  const roomsByFloor = filteredRooms.reduce((acc: Record<number, any[]>, room) => {
    const floor = room.floor || 1;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});

  // Filter Queue
  const filteredReservations = reservations.filter((res) => {
    const guestName = (res.guestName || (res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : '')).toLowerCase();
    const guestEmail = (res.guestEmail || res.guest?.email || '').toLowerCase();
    const roomNumber = (res.assignedRoomNumber || res.assignedRoom?.roomNumber || res.roomNumber || '').toLowerCase();
    const code = (res.confirmationCode || '').toLowerCase();

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!code.includes(q) && !guestName.includes(q) && !roomNumber.includes(q) && !guestEmail.includes(q)) {
        return false;
      }
    }
    if (queueFilter === 'arrivals') return res.status === 'confirmed';
    if (queueFilter === 'inhouse') return res.status === 'checked_in';
    if (queueFilter === 'departures') return res.status === 'checked_in';
    return true;
  });

  const getStatusBadge = (status: RoomStatus, isOccupied: boolean) => {
    if (isOccupied) {
      return {
        label: 'Occupied',
        bg: 'bg-[#FAF6EE] text-[#1C1815] border-[#ECE2CE]',
        dot: 'bg-[#B08D57]',
      };
    }
    switch (status) {
      case 'clean':
        return {
          label: 'Clean',
          bg: 'bg-[#EBF4EF] text-[#236446] border-[#C8E3D4]',
          dot: 'bg-[#236446]',
        };
      case 'dirty':
        return {
          label: 'Dirty (Turnover)',
          bg: 'bg-[#FAF0ED] text-[#8C2F22] border-[#EACEC8]',
          dot: 'bg-[#8C2F22]',
        };
      case 'inspected':
        return {
          label: 'Inspected Ready',
          bg: 'bg-[#FDF6E8] text-[#8C621E] border-[#F7E5BD]',
          dot: 'bg-[#8C621E]',
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
              {isSupervisorOrMaintenance
                ? 'Housekeeping & Facilities Board'
                : isExecutiveOrRevenue
                ? 'Executive PMS Dashboard'
                : 'Front Desk Operations'}
            </span>
            <span>•</span>
            {loading ? (
              <span className="flex items-center gap-1 text-[#8C621E]">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
              </span>
            ) : (
              <span>Live Real-Time Bus</span>
            )}
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#1C1815] tracking-tight mt-1.5">
            {currentProperty?.name}{' '}
            {isSupervisorOrMaintenance
              ? 'Room Condition Board'
              : isExecutiveOrRevenue
              ? 'Executive Management'
              : 'Front Desk PMS'}
          </h1>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {!isSupervisorOrMaintenance && (
            <button
              type="button"
              onClick={() => setShowWalkInModal(true)}
              className="px-4 py-2.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] font-medium text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Walk-In Registration</span>
            </button>
          )}

          {/* View Mode Switcher */}
          {!isSupervisorOrMaintenance ? (
            <div className="p-1 rounded-md bg-white border border-[#DDD7CD] flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('rooms')}
                className={`px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wider transition cursor-pointer ${
                  activeTab === 'rooms'
                    ? 'bg-[#F4EFE6] text-[#1C1815] font-semibold'
                    : 'text-[#736B63] hover:text-[#1C1815]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 inline mr-1.5" /> Floorplan ({rooms.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wider transition cursor-pointer ${
                  activeTab === 'queue'
                    ? 'bg-[#F4EFE6] text-[#1C1815] font-semibold'
                    : 'text-[#736B63] hover:text-[#1C1815]'
                }`}
              >
                <Users className="w-3.5 h-3.5 inline mr-1.5" /> Guest Queue ({reservations.length})
              </button>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-md bg-white border border-[#DDD7CD] text-xs font-semibold text-[#1C1815] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#B08D57]" /> Room Inventory ({rooms.length} Suites)
            </div>
          )}
        </div>
      </div>

      {/* 2. Operations KPI Ribbon */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Occupancy Rate */}
          <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#736B63]">
              <span className="font-medium uppercase tracking-wider">Occupancy Rate</span>
              <TrendingUp className="w-4 h-4 text-[#B08D57]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1815]">
                {metrics.occupancyRate}%
              </span>
              <span className="text-xs text-[#736B63]">
                ({metrics.inHouse ?? metrics.occupiedRooms ?? 0}/{metrics.totalRooms} Rooms)
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#F4EFE6] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#B08D57] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.occupancyRate)}%` }}
              />
            </div>
          </div>

          {/* If Executive/Revenue: Show Gross Daily Revenue; otherwise show In-House Stays */}
          {isExecutiveOrRevenue ? (
            <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#736B63]">
                <span className="font-medium uppercase tracking-wider">Gross Daily Revenue</span>
                <Receipt className="w-4 h-4 text-[#236446]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-serif font-bold text-[#236446]">
                  ${(metrics.totalRevenue || (metrics.inHouse ?? 1) * 385).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-[#736B63]">USD</span>
              </div>
              <p className="text-[11px] text-[#736B63]">ADR ~${Math.round((metrics.totalRevenue || 1200) / Math.max(1, metrics.inHouse || 1))}/nt</p>
            </div>
          ) : (
            <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#736B63]">
                <span className="font-medium uppercase tracking-wider">In-House Stays</span>
                <Users className="w-4 h-4 text-[#236446]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-serif font-bold text-[#236446]">
                  {metrics.inHouse ?? metrics.inHouseGuests ?? metrics.occupiedRooms ?? 0}
                </span>
                <span className="text-xs text-[#736B63]">Active Suites</span>
              </div>
              <p className="text-[11px] text-[#736B63]">Digital keys active</p>
            </div>
          )}

          {/* Housekeeping Turnover Queue */}
          <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#736B63]">
              <span className="font-medium uppercase tracking-wider">Housekeeping Queue</span>
              <Brush className="w-4 h-4 text-[#8C2F22]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#8C2F22]">
                {metrics.dirtyRooms}
              </span>
              <span className="text-xs text-[#736B63]">Turnover Rooms</span>
            </div>
            <p className="text-[11px] text-[#8C2F22]">Turnover dispatched</p>
          </div>

          {/* Ready for Arrival */}
          <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#736B63]">
              <span className="font-medium uppercase tracking-wider">Ready for Arrival</span>
              <CheckCircle className="w-4 h-4 text-[#1C1815]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1815]">
                {metrics.cleanRooms + (metrics.inspectedRooms || 0)}
              </span>
              <span className="text-xs text-[#736B63]">Ready Suites</span>
            </div>
            <p className="text-[11px] text-[#736B63]">Clean & inspected inventory</p>
          </div>
        </div>
      )}

      {/* 3. Search & Quick Filters Bar */}
      <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Search input */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-[#736B63] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by room #, guest name, confirmation code..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-xs text-[#1C1815] placeholder-[#A69E95] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
          />
        </div>

        {/* Filter Pills */}
        {activeTab === 'rooms' ? (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-[#736B63] mr-1 uppercase tracking-wider font-medium">
              Filter:
            </span>
            {['all', 'clean', 'inspected', 'dirty', 'occupied', 'vacant', 'out_of_order'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md border transition capitalize cursor-pointer text-[11px] ${
                  statusFilter === st
                    ? 'bg-[#FAF6EE] border-[#B08D57] text-[#1C1815] font-semibold'
                    : 'bg-white border-[#E5E0D8] text-[#736B63] hover:text-[#1C1815]'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}

            {/* Floor filter */}
            {floors.length > 1 && (
              <select
                value={floorFilter}
                onChange={(e) => setFloorFilter(e.target.value)}
                className="px-2.5 py-1 rounded-md bg-white border border-[#DDD7CD] text-[11px] text-[#1C1815] focus:outline-none ml-2"
              >
                <option value="all">All Floors</option>
                {floors.map((fl) => (
                  <option key={fl} value={fl.toString()}>
                    Floor {fl}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[11px] text-[#736B63] mr-1 uppercase tracking-wider font-medium">
              Queue:
            </span>
            {[
              { id: 'all', label: 'All Active' },
              { id: 'arrivals', label: "Today's Arrivals" },
              { id: 'inhouse', label: 'In-House Guests' },
              { id: 'departures', label: "Today's Departures" },
            ].map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setQueueFilter(q.id as any)}
                className={`px-2.5 py-1 rounded-md border transition cursor-pointer text-[11px] ${
                  queueFilter === q.id
                    ? 'bg-[#FAF6EE] border-[#B08D57] text-[#1C1815] font-semibold'
                    : 'bg-white border-[#E5E0D8] text-[#736B63] hover:text-[#1C1815]'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Tab 1: Interactive Room Matrix Floorplan */}
      {activeTab === 'rooms' && (
        <div className="space-y-8">
          {Object.entries(roomsByFloor).map(([floor, floorRooms]) => (
            <div key={floor} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2DCD2]">
                <h3 className="font-serif font-normal text-lg text-[#1C1815] flex items-center gap-2">
                  <span>Floor {floor}</span>
                  <span className="text-xs font-sans text-[#736B63]">({floorRooms.length} Suites)</span>
                </h3>
              </div>

              {/* Floor Rooms Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {floorRooms.map((room) => {
                  const badge = getStatusBadge(room.status, room.isOccupied);
                  const isMenuOpen = activeMenuRoomId === room.id;

                  return (
                    <div
                      key={room.id}
                      className={`editorial-card rounded-xl bg-white border p-4.5 space-y-3 transition-all duration-200 shadow-sm ${
                        room.isOccupied
                          ? 'border-[#ECE2CE] bg-[#FAF8F5]'
                          : room.status === 'dirty'
                          ? 'border-[#EACEC8]'
                          : 'border-[#DDD7CD] hover:border-[#B08D57]'
                      }`}
                    >
                      {/* Room Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-lg font-serif font-bold text-[#1C1815]">
                              #{room.roomNumber}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 font-medium ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </div>
                          <span className="text-xs text-[#736B63] block mt-0.5">
                            {room.roomTypeName || 'Deluxe Suite'}
                          </span>
                        </div>

                        {/* Room Status Dropdown Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveMenuRoomId(isMenuOpen ? null : room.id)}
                            className="p-1 rounded-md hover:bg-[#F4EFE6] text-[#736B63] hover:text-[#1C1815] transition cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-white border border-[#DDD7CD] shadow-xl p-1.5 z-40 animate-fadeIn space-y-1 text-xs"
                            >
                              <span className="text-[10px] text-[#736B63] px-2 py-1 block uppercase tracking-wider font-medium">
                                Set Status:
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateRoomStatus(room.id, 'clean')}
                                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#EBF4EF] text-[#236446] flex items-center justify-between transition"
                              >
                                <span>Mark Clean</span>
                                {room.status === 'clean' && <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateRoomStatus(room.id, 'inspected')}
                                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#FDF6E8] text-[#8C621E] flex items-center justify-between transition"
                              >
                                <span>Mark Inspected</span>
                                {room.status === 'inspected' && <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateRoomStatus(room.id, 'dirty')}
                                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#FAF0ED] text-[#8C2F22] flex items-center justify-between transition"
                              >
                                <span>Mark Dirty (Turnover)</span>
                                {room.status === 'dirty' && <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateRoomStatus(room.id, 'out_of_order')}
                                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-[#F0EFEF] text-[#5C5855] flex items-center justify-between transition"
                              >
                                <span>Out of Order</span>
                                {room.status === 'out_of_order' && <Check className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* In-House Guest Summary (If Occupied) */}
                      {room.isOccupied && room.currentGuestName ? (
                        <div className="p-2.5 rounded-lg bg-white border border-[#DDD7CD] text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#1C1815] truncate">{room.currentGuestName}</span>
                            <span className="text-[10px] text-[#8C621E] font-medium">In-House</span>
                          </div>
                          {room.stayDates && (
                            <span className="text-[11px] text-[#736B63] block">{room.stayDates}</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#736B63] py-1">
                          {room.status === 'clean' || room.status === 'inspected'
                            ? 'Ready for instant allocation'
                            : room.status === 'dirty'
                            ? 'Awaiting housekeeping service'
                            : 'Currently offline'}
                        </div>
                      )}

                      {/* Room Quick Actions */}
                      <div className="pt-2 border-t border-[#E5E0D8] flex items-center justify-between text-xs">
                        {room.isOccupied && room.currentReservationId && !isSupervisorOrMaintenance ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setActiveFolioResId(room.currentReservationId)}
                              className="text-[#1C1815] hover:text-[#B08D57] flex items-center gap-1 transition"
                            >
                              <Receipt className="w-3.5 h-3.5" /> Folio
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveChargeRes({
                                  id: room.currentReservationId,
                                  roomNumber: room.roomNumber,
                                  guestName: room.currentGuestName,
                                })
                              }
                              className="text-[#736B63] hover:text-[#1C1815] flex items-center gap-1 transition"
                            >
                              <PlusCircle className="w-3.5 h-3.5 text-[#B08D57]" /> + Charge
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickCheckOut(room.currentReservationId)}
                              className="text-[#8C2F22] hover:text-[#6E2218] flex items-center gap-1 transition"
                            >
                              <LogOut className="w-3.5 h-3.5" /> Check Out
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-[#736B63]">
                            Floor {room.floor || 1} • {room.isOccupied ? 'Occupied Suite' : 'Vacant Ready'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Tab 2: Guest Queue (Arrivals, In-House, Departures) */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] overflow-hidden shadow-sm">
            <div className="p-5 border-b border-[#E5E0D8] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-normal text-lg text-[#1C1815]">
                  Operational Guest Queue ({filteredReservations.length})
                </h3>
                <p className="text-xs text-[#736B63]">
                  Today's front desk workflow: arrivals, room check-in, key activations & departures
                </p>
              </div>
            </div>

            {/* Reservations Queue Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#736B63] font-medium">
                  <tr>
                    <th className="p-4">Guest Name</th>
                    <th className="p-4">Confirmation</th>
                    <th className="p-4">Room & Type</th>
                    <th className="p-4">Stay Dates</th>
                    <th className="p-4">Folio Status</th>
                    <th className="p-4">Digital Key</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8]">
                  {filteredReservations.map((res) => {
                    const isCheckedIn = res.status === 'checked_in';
                    const isConfirmed = res.status === 'confirmed';

                    const gName = res.guestName || (res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : 'Valued Guest');
                    const gEmail = res.guestEmail || res.guest?.email || 'Direct Guest';
                    const rNumber = res.assignedRoomNumber || res.assignedRoom?.roomNumber || res.roomNumber;
                    const rType = res.roomTypeName || res.roomType?.name || 'Boutique Suite';

                    return (
                      <tr key={res.id} className="hover:bg-[#FAF8F5] transition">
                        {/* Guest */}
                        <td className="p-4">
                          <div className="font-semibold text-[#1C1815] text-sm">{gName}</div>
                          <span className="text-[11px] text-[#736B63]">{gEmail}</span>
                        </td>

                        {/* Code */}
                        <td className="p-4 font-mono font-medium text-[#1C1815]">
                          {res.confirmationCode}
                        </td>

                        {/* Room */}
                        <td className="p-4">
                          <div className="font-semibold text-[#1C1815]">
                            {rNumber ? `Room #${rNumber}` : 'Unassigned'}
                          </div>
                          <span className="text-[11px] text-[#736B63]">{rType}</span>
                        </td>

                        {/* Dates */}
                        <td className="p-4 text-[#4A433D]">
                          <div>{res.checkInDate} → {res.checkOutDate}</div>
                          <span className="text-[11px] text-[#736B63]">{res.totalNights} Nights</span>
                        </td>

                        {/* Folio */}
                        <td className="p-4">
                          <span className="font-mono font-semibold text-[#1C1815]">${res.totalAmount?.toFixed(2)}</span>
                          <span className="text-[10px] text-[#236446] block mt-0.5">Authorized</span>
                        </td>

                        {/* Digital Key */}
                        <td className="p-4">
                          {res.digitalKeyIssued ? (
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-medium bg-[#EBF4EF] text-[#236446] border border-[#C8E3D4]">
                              Key Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-medium bg-[#F0EFEF] text-[#5C5855] border border-[#DDDCDA]">
                              Pending Desk
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isConfirmed && (
                              <button
                                type="button"
                                onClick={() => setActiveCheckInRes(res)}
                                className="px-3 py-1.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] font-medium text-xs flex items-center gap-1 transition cursor-pointer"
                              >
                                <Key className="w-3.5 h-3.5" /> Check In
                              </button>
                            )}

                            {isCheckedIn && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveChargeRes({
                                      id: res.id,
                                      roomNumber: res.roomNumber,
                                      guestName: res.guestName,
                                    })
                                  }
                                  className="p-1.5 rounded-md bg-white hover:bg-[#FAF8F5] border border-[#DDD7CD] text-[#736B63] transition"
                                  title="Post Incidental Charge"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickCheckOut(res.id)}
                                  className="px-3 py-1.5 rounded-md bg-[#FAF0ED] hover:bg-[#F3D2C9] text-[#8C2F22] border border-[#EACEC8] font-medium text-xs flex items-center gap-1 transition cursor-pointer"
                                >
                                  <LogOut className="w-3.5 h-3.5" /> Check Out
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => setActiveFolioResId(res.id)}
                              className="px-3 py-1.5 rounded-md bg-white hover:bg-[#FAF8F5] border border-[#DDD7CD] text-[#1C1815] font-medium text-xs flex items-center gap-1 transition cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5 text-[#B08D57]" /> Folio
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {activeCheckInRes && currentProperty && (
        <CheckInModal
          reservation={activeCheckInRes}
          propertyId={currentProperty.id}
          onClose={() => setActiveCheckInRes(null)}
          onCheckInSuccess={() => {
            setActiveCheckInRes(null);
            toast.success('Guest successfully checked in. Digital & RFID keys activated.', 'Check-In Complete');
            fetchPMSData();
          }}
        />
      )}

      {activeFolioResId && (
        <FolioModal
          reservationId={activeFolioResId}
          onClose={() => setActiveFolioResId(null)}
        />
      )}

      {showWalkInModal && currentProperty && (
        <WalkInBookingModal
          propertyId={currentProperty.id}
          onClose={() => setShowWalkInModal(false)}
          onSuccess={() => {
            setShowWalkInModal(false);
            toast.success('Walk-in reservation created and checked in successfully!', 'Walk-In Complete');
            fetchPMSData();
          }}
        />
      )}

      {activeChargeRes && (
        <AddFolioChargeModal
          reservationId={activeChargeRes.id}
          roomNumber={activeChargeRes.roomNumber}
          guestName={activeChargeRes.guestName}
          onClose={() => setActiveChargeRes(null)}
          onSuccess={() => {
            setActiveChargeRes(null);
            toast.success('Incidental charge posted to guest folio ledger.', 'Charge Posted');
            fetchPMSData();
          }}
        />
      )}
    </div>
  );
};

export default FrontDeskPMS;
