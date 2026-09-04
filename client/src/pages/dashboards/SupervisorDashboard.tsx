import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { HousekeepingChecklistModal } from '../../components/HousekeepingChecklistModal';
import { ReportMaintenanceModal } from '../../components/ReportMaintenanceModal';
import {
  ShieldCheck,
  Layers,
  Users,
  Sparkles,
  Brush,
  Wrench,
  Loader2,
} from 'lucide-react';
import type { RoomStatus } from '../../types';

// Modular Feature Tabs
import { SupervisorInspectionTab } from '../../features/supervisor/SupervisorInspectionTab';
import { SupervisorRoomMatrixTab } from '../../features/supervisor/SupervisorRoomMatrixTab';
import { SupervisorAttendantTaskTab } from '../../features/supervisor/SupervisorAttendantTaskTab';

export const SupervisorDashboard: React.FC = () => {
  const { currentProperty } = useAuth();
  const { subscribe } = useWebSocket();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab State driven by URL ?tab= (Default is 'inspection')
  const validTabs = ['inspection', 'matrix', 'tasks'] as const;
  type SupervisorTab = typeof validTabs[number];

  const rawTab = searchParams.get('tab') as SupervisorTab | null;
  const activeTab: SupervisorTab = rawTab && validTabs.includes(rawTab) ? rawTab : 'inspection';

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'inspection' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setActiveTab = (tab: SupervisorTab) => {
    setSearchParams({ tab });
  };

  const [rooms, setRooms] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [activeChecklistRoom, setActiveChecklistRoom] = useState<any | null>(null);
  const [activeMaintenanceRoom, setActiveMaintenanceRoom] = useState<any | null>(null);

  const fetchSupervisorData = useCallback(async () => {
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
      console.error('Failed to load supervisor data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id]);

  useEffect(() => {
    fetchSupervisorData();
  }, [fetchSupervisorData]);

  // Live WebSocket Listeners
  useEffect(() => {
    const handleLiveEvent = () => {
      fetchSupervisorData();
    };

    const unsubStatus = subscribe('ROOM_STATUS_CHANGED', handleLiveEvent);
    const unsubCheckIn = subscribe('RESERVATION_CHECKED_IN', handleLiveEvent);
    const unsubGuestOut = subscribe('GUEST_CHECKED_OUT', handleLiveEvent);

    return () => {
      unsubStatus();
      unsubCheckIn();
      unsubGuestOut();
    };
  }, [subscribe, fetchSupervisorData]);

  // Status API
  const handleUpdateRoomStatus = async (roomId: string, newStatus: RoomStatus, notes?: string) => {
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes }),
      }).then((r) => r.json());

      if (res.success) {
        toast.success(`Suite status updated to ${newStatus.toUpperCase()}`, 'Room Status Updated');
        fetchSupervisorData();
      } else {
        toast.error(res.error || 'Failed to update room status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update room status');
    }
  };

  const handleRejectInspection = async (room: any) => {
    const isConfirmed = await confirm({
      title: `Reject Inspection for Suite #${room.roomNumber}`,
      message: 'Fail this room inspection and return it to Dirty? Attendant will be dispatched for re-cleaning.',
      confirmText: 'Reject & Require Re-Clean',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (!isConfirmed) return;
    handleUpdateRoomStatus(room.id, 'dirty', 'Supervisor inspection rejected: re-cleaning required.');
  };

  const cleanRoomsCount = rooms.filter((r) => r.status === 'clean').length;

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-[#0F172A] bg-[#F8F9FA] font-sans selection:bg-[#C5A059]/20 selection:text-[#0F172A]">
      {/* 1. Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-[#0F172A] bg-white border border-[#E5E7EB] shadow-2xs">
            <span>Housekeeping Supervisor Hub</span>
            <span>•</span>
            {loading ? (
              <span className="flex items-center gap-1 text-[#C5A059]">
                <Loader2 className="w-3 h-3 animate-spin" /> Live Syncing...
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">Live Room State Active</span>
            )}
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-[#0F172A] tracking-tight mt-2">
            {currentProperty?.name} Supervisor Dashboard
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Quality control approval, physical suite condition matrix, and attendant shift monitoring.
          </p>
        </div>

        <div className="px-4 py-2 rounded-full bg-white border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] flex items-center gap-2 shadow-2xs">
          <Layers className="w-4 h-4 text-[#C5A059]" />
          <span>{rooms.length} Suites in Inventory</span>
        </div>
      </div>

      {/* 2. KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-semibold uppercase tracking-wider">Awaiting Inspection</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-heading font-extrabold text-emerald-600">{cleanRoomsCount}</span>
              <span className="text-xs text-[#64748B]">Cleaned</span>
            </div>
            <p className="text-[11px] text-[#64748B]">Needs supervisor approval</p>
          </div>

          <div className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-semibold uppercase tracking-wider">Inspected & Verified</span>
              <ShieldCheck className="w-4 h-4 text-[#C5A059]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-heading font-extrabold text-[#0F172A]">{metrics.inspectedRooms || 0}</span>
              <span className="text-xs text-[#64748B]">Ready</span>
            </div>
            <p className="text-[11px] text-[#64748B]">Passed quality inspection</p>
          </div>

          <div className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-semibold uppercase tracking-wider">Turnover Pending</span>
              <Brush className="w-4 h-4 text-[#E11D48]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-heading font-extrabold text-[#E11D48]">{metrics.dirtyRooms || 0}</span>
              <span className="text-xs text-[#64748B]">Dirty</span>
            </div>
            <p className="text-[11px] text-[#64748B]">Attendants assigned</p>
          </div>

          <div className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs text-[#64748B]">
              <span className="font-semibold uppercase tracking-wider">Out of Order</span>
              <Wrench className="w-4 h-4 text-[#64748B]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-heading font-extrabold text-[#64748B]">{metrics.outOfOrderRooms || 0}</span>
              <span className="text-xs text-[#64748B]">Offline</span>
            </div>
            <p className="text-[11px] text-[#64748B]">Maintenance active</p>
          </div>
        </div>
      )}

      {/* 3. Sub-Tabs Ribbon */}
      <div className="p-1.5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-wrap gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('inspection')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'inspection' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Inspection Queue ({cleanRoomsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'matrix' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Suite Condition Board ({rooms.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tasks' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Attendant Shift Roster</span>
        </button>
      </div>

      {/* 4. Active Tab Component */}
      {activeTab === 'inspection' && (
        <SupervisorInspectionTab
          rooms={rooms}
          onApprove={(roomId) => handleUpdateRoomStatus(roomId, 'inspected')}
          onReject={(room) => handleRejectInspection(room)}
        />
      )}

      {activeTab === 'matrix' && (
        <SupervisorRoomMatrixTab
          rooms={rooms}
          onUpdateStatus={(roomId, status) => handleUpdateRoomStatus(roomId, status)}
          onRejectInspection={(room) => handleRejectInspection(room)}
          onOpenChecklist={(room) => setActiveChecklistRoom(room)}
          onOpenMaintenance={(room) => setActiveMaintenanceRoom(room)}
        />
      )}

      {activeTab === 'tasks' && (
        <SupervisorAttendantTaskTab rooms={rooms} />
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
              fetchSupervisorData();
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
              fetchSupervisorData();
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

export default SupervisorDashboard;
