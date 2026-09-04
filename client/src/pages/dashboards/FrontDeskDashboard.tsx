import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { CheckInModal } from '../../components/CheckInModal';
import { FolioModal } from '../../components/FolioModal';
import { WalkInBookingModal } from '../../components/WalkInBookingModal';
import { AddFolioChargeModal } from '../../components/AddFolioChargeModal';
import {
  Key,
  Users,
  LogOut,
  Layers,
  UserPlus,
  Loader2,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

// Modular Feature Tabs
import { FrontDeskArrivalsTab } from '../../features/frontdesk/FrontDeskArrivalsTab';
import { FrontDeskInHouseTab } from '../../features/frontdesk/FrontDeskInHouseTab';
import { FrontDeskDeparturesTab } from '../../features/frontdesk/FrontDeskDeparturesTab';
import { FrontDeskRoomStatusTab } from '../../features/frontdesk/FrontDeskRoomStatusTab';
import { FrontDeskWalkInTab } from '../../features/frontdesk/FrontDeskWalkInTab';

export const FrontDeskDashboard: React.FC = () => {
  const { currentProperty } = useAuth();
  const { subscribe } = useWebSocket();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab State driven by URL ?tab= (Default is 'arrivals')
  const validTabs = ['arrivals', 'inhouse', 'departures', 'status', 'walkin'] as const;
  type FrontDeskTab = typeof validTabs[number];

  const rawTab = searchParams.get('tab') as FrontDeskTab | null;
  const activeTab: FrontDeskTab = rawTab && validTabs.includes(rawTab) ? rawTab : 'arrivals';

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'arrivals' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setActiveTab = (tab: FrontDeskTab) => {
    setSearchParams({ tab });
  };

  // Metrics & Data State
  const [metrics, setMetrics] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [activeCheckInRes, setActiveCheckInRes] = useState<any | null>(null);
  const [activeFolioResId, setActiveFolioResId] = useState<string | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState<boolean>(false);
  const [activeChargeRes, setActiveChargeRes] = useState<any | null>(null);

  const fetchFrontDeskData = useCallback(async () => {
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

  const arrivalsCount = reservations.filter((r) => r.status === 'confirmed').length;
  const inHouseCount = reservations.filter((r) => r.status === 'checked_in').length;
  const readyRoomsCount = (metrics?.cleanRooms || 0) + (metrics?.inspectedRooms || 0);

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 lg:p-8 max-w-[1520px] w-full mx-auto space-y-8 text-[#0F172A] bg-[#F8F9FA] font-sans selection:bg-[#C5A059]/20 selection:text-[#0F172A]">
      {/* 1. Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-[#0F172A] bg-white border border-[#E5E7EB] shadow-2xs">
            <span>Front Desk Hub</span>
            <span>•</span>
            {loading ? (
              <span className="flex items-center gap-1 text-[#C5A059]">
                <Loader2 className="w-3 h-3 animate-spin" /> Live Syncing...
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">Real-Time Bus Live</span>
            )}
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-[#0F172A] tracking-tight mt-2">
            {currentProperty?.name} Front Desk
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Guest arrivals, digital key provisioning, in-house folios, departures, and suite condition directory.
          </p>
        </div>

        {/* Quick Walk-In Button */}
        <button
          type="button"
          onClick={() => setShowWalkInModal(true)}
          className="px-4 py-2.5 rounded-xl astra-btn-primary font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <UserPlus className="w-4 h-4 text-[#C5A059]" />
          <span>Walk-In Registration</span>
        </button>
      </div>

      {/* 2. Operational KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-semibold uppercase tracking-wider">Occupancy</span>
              <TrendingUp className="w-4 h-4 text-[#C5A059]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-heading font-extrabold text-[#0F172A]">{metrics.occupancyRate}%</span>
              <span className="text-xs text-[#64748B]">({inHouseCount}/{metrics.totalRooms} Suites)</span>
            </div>
            <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div className="h-full bg-[#0F172A] rounded-full" style={{ width: `${Math.min(100, metrics.occupancyRate)}%` }} />
            </div>
          </div>

          <div className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-semibold uppercase tracking-wider">Today's Arrivals</span>
              <Key className="w-4 h-4 text-[#C5A059]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-heading font-extrabold text-[#0F172A]">{arrivalsCount}</span>
              <span className="text-xs text-[#64748B]">Incoming</span>
            </div>
            <p className="text-[11px] text-[#64748B]">Awaiting check-in</p>
          </div>

          <div className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-semibold uppercase tracking-wider">In-House Stays</span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-heading font-extrabold text-emerald-600">{inHouseCount}</span>
              <span className="text-xs text-[#64748B]">Active</span>
            </div>
            <p className="text-[11px] text-[#64748B]">Digital keys active</p>
          </div>

          <div className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-semibold uppercase tracking-wider">Ready for Allocation</span>
              <CheckCircle className="w-4 h-4 text-[#0F172A]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-heading font-extrabold text-[#0F172A]">{readyRoomsCount}</span>
              <span className="text-xs text-[#64748B]">Suites</span>
            </div>
            <p className="text-[11px] text-[#64748B]">Clean & inspected</p>
          </div>
        </div>
      )}

      {/* 3. Front Desk Sub-Tabs Ribbon */}
      <div className="p-1.5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-wrap gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('arrivals')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'arrivals' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Arrivals ({arrivalsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inhouse')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'inhouse' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>In-House Guests ({inHouseCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('departures')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'departures' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Departures ({inHouseCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'status' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Room Status Rows ({rooms.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('walkin')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'walkin' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Walk-In Booking</span>
        </button>
      </div>

      {/* 4. Active Tab Content View */}
      {activeTab === 'arrivals' && (
        <FrontDeskArrivalsTab
          reservations={reservations}
          onCheckIn={(res) => setActiveCheckInRes(res)}
        />
      )}

      {activeTab === 'inhouse' && (
        <FrontDeskInHouseTab
          reservations={reservations}
          onOpenFolio={(resId) => setActiveFolioResId(resId)}
          onAddCharge={(chargeData) => setActiveChargeRes(chargeData)}
          onCheckOut={(resId) => handleQuickCheckOut(resId)}
        />
      )}

      {activeTab === 'departures' && (
        <FrontDeskDeparturesTab
          reservations={reservations}
          onCheckOut={(resId) => handleQuickCheckOut(resId)}
          onOpenFolio={(resId) => setActiveFolioResId(resId)}
        />
      )}

      {activeTab === 'status' && (
        <FrontDeskRoomStatusTab rooms={rooms} />
      )}

      {activeTab === 'walkin' && (
        <FrontDeskWalkInTab
          onOpenWalkInModal={() => setShowWalkInModal(true)}
          metrics={metrics}
        />
      )}

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

export default FrontDeskDashboard;
