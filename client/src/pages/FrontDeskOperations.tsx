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
  TrendingUp,
  UserPlus,
  PlusCircle,
  Search,
  Loader2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

export const FrontDeskOperations: React.FC = () => {
  const { currentProperty } = useAuth();
  const { subscribe } = useWebSocket();
  const toast = useToast();
  const { confirm } = useConfirm();

  // Metrics & Data State
  const [metrics, setMetrics] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [queueFilter, setQueueFilter] = useState<'all' | 'arrivals' | 'inhouse' | 'departures'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [activeCheckInRes, setActiveCheckInRes] = useState<any | null>(null);
  const [activeFolioResId, setActiveFolioResId] = useState<string | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState<boolean>(false);
  const [activeChargeRes, setActiveChargeRes] = useState<any | null>(null);

  const fetchFrontDeskData = useCallback(async () => {
    if (!currentProperty?.id) return;
    try {
      setLoading(true);
      const [metricsRes, resQueue] = await Promise.all([
        fetch(`/api/v1/rooms/dashboard?propertyId=${currentProperty.id}`).then((r) => r.json()),
        fetch(`/api/v1/rooms/reservations?propertyId=${currentProperty.id}`).then((r) => r.json()),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data.metrics || metricsRes.data);
      }
      if (resQueue.success && Array.isArray(resQueue.data)) {
        setReservations(resQueue.data);
      }
    } catch (err) {
      console.error('Failed to load Front Desk data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id]);

  useEffect(() => {
    fetchFrontDeskData();
  }, [fetchFrontDeskData]);

  // Live WebSocket Listeners
  useEffect(() => {
    const handleLiveEvent = () => {
      fetchFrontDeskData();
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
  }, [subscribe, fetchFrontDeskData]);

  const handleQuickCheckOut = async (reservationId: string) => {
    const isConfirmed = await confirm({
      title: 'Confirm Guest Check-Out',
      message:
        'Complete check-out for this guest? This will deactivate their digital mobile key and immediately mark the suite as Dirty for housekeeping turnover.',
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
        toast.success(
          'Guest check-out completed. Key deactivated and room marked dirty.',
          'Check-Out Complete'
        );
        fetchFrontDeskData();
      } else {
        toast.error(res.error || 'Failed to check out reservation');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to check out reservation');
    }
  };

  // Filter Reservations Queue
  const filteredReservations = reservations.filter((res) => {
    const gName = res.guestName || (res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : '');
    const code = res.confirmationCode || '';
    const rNum = res.assignedRoomNumber || res.assignedRoom?.roomNumber || res.roomNumber || '';

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = gName.toLowerCase().includes(q);
      const matchCode = code.toLowerCase().includes(q);
      const matchRoom = rNum.toString().toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchRoom) return false;
    }

    if (queueFilter === 'arrivals') return res.status === 'confirmed';
    if (queueFilter === 'inhouse') return res.status === 'checked_in';
    if (queueFilter === 'departures') return res.status === 'checked_in';
    return true;
  });

  const arrivalsCount = reservations.filter((r) => r.status === 'confirmed').length;
  const inHouseCount = reservations.filter((r) => r.status === 'checked_in').length;

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-[#1C1815] bg-[#F7F4EE] font-sans selection:bg-[#B08D57]/20 selection:text-[#1C1815]">
      {/* 1. Header Command Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DCD2]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-medium tracking-wider uppercase text-[#8C621E] bg-[#FAF6EE] border border-[#ECE2CE]">
            <span>Front Desk Operations Desk</span>
            <span>•</span>
            {loading ? (
              <span className="flex items-center gap-1 text-[#8C621E]">
                <Loader2 className="w-3 h-3 animate-spin" /> Live Bus Sync
              </span>
            ) : (
              <span>Real-Time Sync Active</span>
            )}
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#1C1815] tracking-tight mt-1.5">
            {currentProperty?.name} Front Desk
          </h1>
          <p className="text-xs text-[#736B63] mt-1">
            Manage daily guest turnover, check-ins, digital key issuance, and live folio billing.
          </p>
        </div>

        {/* Quick Action Button */}
        <button
          type="button"
          onClick={() => setShowWalkInModal(true)}
          className="px-4 py-2.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Walk-In Registration</span>
        </button>
      </div>

      {/* 2. Operational KPI Cards */}
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

          {/* Today's Arrivals */}
          <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#736B63]">
              <span className="font-medium uppercase tracking-wider">Today's Arrivals</span>
              <Key className="w-4 h-4 text-[#B08D57]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#8C621E]">
                {arrivalsCount}
              </span>
              <span className="text-xs text-[#736B63]">Guests Incoming</span>
            </div>
            <p className="text-[11px] text-[#736B63]">Awaiting check-in & keys</p>
          </div>

          {/* Active In-House */}
          <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#736B63]">
              <span className="font-medium uppercase tracking-wider">In-House Stays</span>
              <Users className="w-4 h-4 text-[#236446]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#236446]">
                {inHouseCount}
              </span>
              <span className="text-xs text-[#736B63]">Active Stays</span>
            </div>
            <p className="text-[11px] text-[#736B63]">Digital mobile keys active</p>
          </div>

          {/* Ready Inventory */}
          <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#736B63]">
              <span className="font-medium uppercase tracking-wider">Ready for Check-In</span>
              <CheckCircle className="w-4 h-4 text-[#1C1815]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1815]">
                {metrics.cleanRooms + (metrics.inspectedRooms || 0)}
              </span>
              <span className="text-xs text-[#736B63]">Suites Ready</span>
            </div>
            <p className="text-[11px] text-[#736B63]">Clean & inspected inventory</p>
          </div>
        </div>
      )}

      {/* 3. Search & Queue Filter Ribbon */}
      <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Search */}
        <div className="flex-1 min-w-[260px] relative">
          <Search className="w-4 h-4 text-[#736B63] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guest name, confirmation code (e.g. LMN-BW-...), or suite #"
            className="w-full pl-10 pr-4 py-2 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#1C1815] placeholder-[#A69E95] focus:outline-none focus:border-[#B08D57] focus:bg-white transition"
          />
        </div>

        {/* Queue Filter Segmented Control */}
        <div className="flex items-center gap-1.5 p-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8]">
          <button
            type="button"
            onClick={() => setQueueFilter('all')}
            className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
              queueFilter === 'all'
                ? 'bg-white text-[#1C1815] shadow-xs font-semibold'
                : 'text-[#736B63] hover:text-[#1C1815]'
            }`}
          >
            All Active ({reservations.length})
          </button>
          <button
            type="button"
            onClick={() => setQueueFilter('arrivals')}
            className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
              queueFilter === 'arrivals'
                ? 'bg-white text-[#8C621E] shadow-xs font-semibold'
                : 'text-[#736B63] hover:text-[#1C1815]'
            }`}
          >
            Arrivals ({arrivalsCount})
          </button>
          <button
            type="button"
            onClick={() => setQueueFilter('inhouse')}
            className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer ${
              queueFilter === 'inhouse'
                ? 'bg-white text-[#236446] shadow-xs font-semibold'
                : 'text-[#736B63] hover:text-[#1C1815]'
            }`}
          >
            In-House ({inHouseCount})
          </button>
        </div>
      </div>

      {/* 4. Reservations Operational Queue Table */}
      <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#E5E0D8] flex items-center justify-between">
          <div>
            <h3 className="font-serif font-normal text-lg text-[#1C1815]">
              Operational Guest Queue ({filteredReservations.length})
            </h3>
            <p className="text-xs text-[#736B63]">
              Check in incoming guests, provision digital Salto/BLE keys, manage folios, and process departures.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-[#736B63] font-medium">
              <tr>
                <th className="p-4">Guest Name</th>
                <th className="p-4">Confirmation</th>
                <th className="p-4">Assigned Suite</th>
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

                const gName =
                  res.guestName || (res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : 'Valued Guest');
                const gEmail = res.guestEmail || res.guest?.email || 'Direct Guest';
                const rNumber = res.assignedRoomNumber || res.assignedRoom?.roomNumber || res.roomNumber;
                const rType = res.roomTypeName || res.roomType?.name || 'Boutique Suite';

                return (
                  <tr key={res.id} className="hover:bg-[#FAF8F5] transition">
                    {/* Guest Name & Contact */}
                    <td className="p-4">
                      <div className="font-semibold text-[#1C1815] text-sm">{gName}</div>
                      <span className="text-[11px] text-[#736B63]">{gEmail}</span>
                    </td>

                    {/* Confirmation Code */}
                    <td className="p-4 font-mono font-medium text-[#1C1815]">
                      {res.confirmationCode}
                    </td>

                    {/* Suite Info */}
                    <td className="p-4">
                      <div className="font-semibold text-[#1C1815]">
                        {rNumber ? `Suite #${rNumber}` : 'Unassigned'}
                      </div>
                      <span className="text-[11px] text-[#736B63]">{rType}</span>
                    </td>

                    {/* Dates */}
                    <td className="p-4 font-mono text-[#4A433D]">
                      {res.checkInDate} → {res.checkOutDate}
                      <span className="text-[10px] text-[#736B63] block font-sans">
                        {res.totalNights} night{res.totalNights > 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* Folio Status */}
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${
                          res.paymentStatus === 'paid'
                            ? 'bg-[#EBF4EF] text-[#236446] border-[#C8E3D4]'
                            : 'bg-[#FAF6EE] text-[#8C621E] border-[#ECE2CE]'
                        }`}
                      >
                        {res.paymentStatus || 'Authorized'}
                      </span>
                      <span className="text-[11px] font-mono text-[#1C1815] font-semibold block mt-1">
                        ${(res.totalAmount || 0).toFixed(2)}
                      </span>
                    </td>

                    {/* Mobile Digital Key */}
                    <td className="p-4">
                      {res.digitalKeyIssued || isCheckedIn ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#236446] bg-[#EBF4EF] px-2 py-0.5 rounded border border-[#C8E3D4]">
                          <Key className="w-3 h-3 text-[#236446]" /> Active BLE
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#736B63] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E5E0D8]">
                          Pending Arrival
                        </span>
                      )}
                    </td>

                    {/* Operational Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isConfirmed && (
                          <button
                            type="button"
                            onClick={() => setActiveCheckInRes(res)}
                            className="px-3.5 py-1.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                          >
                            <Key className="w-3.5 h-3.5 text-[#B08D57]" />
                            <span>Check-In</span>
                          </button>
                        )}

                        {isCheckedIn && (
                          <>
                            <button
                              type="button"
                              onClick={() => setActiveFolioResId(res.id)}
                              className="p-1.5 rounded-md hover:bg-white text-[#736B63] hover:text-[#1C1815] border border-transparent hover:border-[#DDD7CD] transition cursor-pointer"
                              title="Inspect Live Folio & Charges"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveChargeRes({
                                  id: res.id,
                                  roomNumber: rNumber,
                                  guestName: gName,
                                })
                              }
                              className="p-1.5 rounded-md hover:bg-white text-[#736B63] hover:text-[#1C1815] border border-transparent hover:border-[#DDD7CD] transition cursor-pointer"
                              title="Post Incidental Charge"
                            >
                              <PlusCircle className="w-4 h-4 text-[#B08D57]" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickCheckOut(res.id)}
                              className="px-3 py-1.5 rounded-md bg-[#FAF0ED] hover:bg-[#F3D2C9] text-[#8C2F22] border border-[#EACEC8] text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                              title="Process Guest Departure"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Check Out</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredReservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-xs text-[#736B63]">
                    No guest reservations found matching this filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modals */}
      {activeCheckInRes && (
        <CheckInModal
          reservation={activeCheckInRes}
          propertyId={currentProperty?.id || 'prop_birchwood'}
          onClose={() => setActiveCheckInRes(null)}
          onCheckInSuccess={() => {
            fetchFrontDeskData();
            setActiveCheckInRes(null);
          }}
        />
      )}

      {activeFolioResId && (
        <FolioModal
          reservationId={activeFolioResId}
          onClose={() => {
            setActiveFolioResId(null);
            fetchFrontDeskData();
          }}
        />
      )}

      {showWalkInModal && (
        <WalkInBookingModal
          propertyId={currentProperty?.id || 'prop_birchwood'}
          onClose={() => setShowWalkInModal(false)}
          onSuccess={() => {
            fetchFrontDeskData();
            setShowWalkInModal(false);
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
            fetchFrontDeskData();
            setActiveChargeRes(null);
          }}
        />
      )}
    </div>
  );
};

export default FrontDeskOperations;
