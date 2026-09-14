import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useToast } from '../../context/ToastContext';
import { HousekeepingChecklistModal } from '../../components/HousekeepingChecklistModal';
import { ReportMaintenanceModal } from '../../components/ReportMaintenanceModal';
import { Brush, Layers, Wrench, Loader2, Sparkles, CheckCircle, Clock, Bell, Check } from 'lucide-react';

// Modular Feature Tabs
import { HKCleaningQueueTab } from '../../features/housekeeper/HKCleaningQueueTab';
import { HKRoomStatusTab } from '../../features/housekeeper/HKRoomStatusTab';
import { HKReportDefectTab } from '../../features/housekeeper/HKReportDefectTab';

export const HousekeeperDashboard: React.FC = () => {
  const { currentProperty } = useAuth();
  const { subscribe } = useWebSocket();
  const toast = useToast();
  const { addToast } = toast;
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab State driven by URL ?tab= (Default is 'queue')
  const validTabs = ['queue', 'status', 'defect'] as const;
  type HKTab = typeof validTabs[number];

  const rawTab = searchParams.get('tab') as HKTab | null;
  const activeTab: HKTab = rawTab && validTabs.includes(rawTab) ? rawTab : 'queue';

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'queue' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setActiveTab = (tab: HKTab) => {
    setSearchParams({ tab });
  };

  const [rooms, setRooms] = useState<any[]>([]);
  const [guestRequests, setGuestRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [activeChecklistRoom, setActiveChecklistRoom] = useState<any | null>(null);
  const [activeMaintenanceRoom, setActiveMaintenanceRoom] = useState<any | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const fetchHousekeeperData = useCallback(async () => {
    if (!currentProperty?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/rooms?propertyId=${currentProperty.id}`).then((r) => r.json());
      if (res.success && Array.isArray(res.data)) {
        setRooms(res.data);
      }

      // Fetch active guest service requests for housekeeping
      const reqRes = await fetch(`${API_BASE}/api/v1/service-requests/property/${currentProperty.id}?category=housekeeping`).then((r) => r.json());
      if (reqRes.success && Array.isArray(reqRes.data)) {
        setGuestRequests(reqRes.data.filter((r: any) => r.status !== 'completed' && r.status !== 'declined'));
      }
    } catch (err) {
      console.error('Failed to load housekeeper data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id, API_BASE]);

  useEffect(() => {
    fetchHousekeeperData();
  }, [fetchHousekeeperData]);

  // Live WebSocket Listeners
  useEffect(() => {
    const handleLiveEvent = () => {
      fetchHousekeeperData();
    };

    const unsubStatus = subscribe('ROOM_STATUS_CHANGED', handleLiveEvent);
    const unsubGuestOut = subscribe('GUEST_CHECKED_OUT', handleLiveEvent);
    const unsubServiceReq = subscribe('SERVICE_REQUEST_CREATED', (req: any) => {
      if (req.category === 'housekeeping' && req.propertyId === currentProperty?.id) {
        setGuestRequests((prev) => [req, ...prev.filter((r) => r.id !== req.id)]);
        addToast({
          type: 'info',
          title: 'Guest Service Request',
          message: `Suite ${req.roomNumber || 'Guest'}: ${req.details}`,
        });
      }
    });

    const unsubServiceUpdate = subscribe('SERVICE_REQUEST_UPDATED', (req: any) => {
      if (req.category === 'housekeeping') {
        if (req.status === 'completed' || req.status === 'declined') {
          setGuestRequests((prev) => prev.filter((r) => r.id !== req.id));
        } else {
          setGuestRequests((prev) => prev.map((r) => (r.id === req.id ? req : r)));
        }
      }
    });

    return () => {
      unsubStatus();
      unsubGuestOut();
      unsubServiceReq();
      unsubServiceUpdate();
    };
  }, [subscribe, fetchHousekeeperData, currentProperty?.id, addToast]);

  const handleMarkDelivered = async (requestId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/service-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (res.ok) {
        setGuestRequests((prev) => prev.filter((r) => r.id !== requestId));
        addToast({
          type: 'success',
          title: 'Item Delivered',
          message: 'Guest service request marked delivered.',
        });
      }
    } catch (err) {
      console.error('Failed to update request:', err);
    }
  };

  const dirtyCount = rooms.filter((r) => r.status === 'dirty').length;
  const cleanCount = rooms.filter((r) => r.status === 'clean').length;
  const inspectedCount = rooms.filter((r) => r.status === 'inspected').length;

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-[#0F172A] bg-[#F8F9FA] font-sans selection:bg-[#C5A059]/20 selection:text-[#0F172A]">
      {/* 1. Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-[#0F172A] bg-white border border-[#E5E7EB] shadow-2xs">
            <span>Room Attendant Hub</span>
            <span>•</span>
            {loading ? (
              <span className="flex items-center gap-1 text-[#C5A059]">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">Live Tasks Active</span>
            )}
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-[#0F172A] tracking-tight mt-2">
            {currentProperty?.name} Housekeeping Hub
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Cleaning checklist execution, linen replenishment, and room defect reporting.
          </p>
        </div>
      </div>

      {/* Real-time In-Stay Guest Requests Banner */}
      {guestRequests.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <h3 className="font-heading font-bold text-sm text-amber-950 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-700" /> Active Guest In-Stay Requests ({guestRequests.length})
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full">
              Priority Dispatch
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {guestRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-2xs flex flex-col justify-between space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0F172A]">Suite #{req.roomNumber || '204'}</span>
                    <span className="text-[10px] text-amber-800 font-semibold uppercase">{req.requestType}</span>
                  </div>
                  <p className="text-xs text-[#64748B]">{req.details}</p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">
                    {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleMarkDelivered(req.id)}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Mark Delivered
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold uppercase tracking-wider">Turnovers Pending</span>
            <Clock className="w-4 h-4 text-[#E11D48]" />
          </div>
          <span className="text-3xl font-heading font-extrabold text-[#E11D48]">{dirtyCount} Suites</span>
          <p className="text-[11px] text-[#64748B]">Awaiting cleaning & linen</p>
        </div>

        <div className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold uppercase tracking-wider">Clean • In Inspection</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-3xl font-heading font-extrabold text-emerald-600">{cleanCount} Suites</span>
          <p className="text-[11px] text-[#64748B]">Submitted to supervisor</p>
        </div>

        <div className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold uppercase tracking-wider">Inspected & Ready</span>
            <CheckCircle className="w-4 h-4 text-[#C5A059]" />
          </div>
          <span className="text-3xl font-heading font-extrabold text-[#0F172A]">{inspectedCount} Suites</span>
          <p className="text-[11px] text-[#64748B]">Passed quality check</p>
        </div>
      </div>

      {/* 3. Sub-Tabs Ribbon */}
      <div className="p-1.5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-wrap gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'queue' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Brush className="w-3.5 h-3.5" />
          <span>My Cleaning Queue ({dirtyCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'status' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Room Status Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('defect')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'defect' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Report Defect</span>
        </button>
      </div>

      {/* 4. Active Tab View */}
      {activeTab === 'queue' && (
        <HKCleaningQueueTab
          rooms={rooms}
          onStartCleaning={(room) => setActiveChecklistRoom(room)}
        />
      )}

      {activeTab === 'status' && (
        <HKRoomStatusTab rooms={rooms} />
      )}

      {activeTab === 'defect' && (
        <HKReportDefectTab
          rooms={rooms}
          onOpenReportModal={(room) => setActiveMaintenanceRoom(room)}
        />
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
              fetchHousekeeperData();
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
              const res = await fetch('/api/v1/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  propertyId: currentProperty?.id,
                  roomId: activeMaintenanceRoom.id,
                  title: `${issueData.category}: Suite #${activeMaintenanceRoom.roomNumber}`,
                  description: issueData.description,
                  priority: issueData.priority === 'urgent' ? 'urgent' : 'medium',
                  category: issueData.category,
                  reportedBy: 'Housekeeping Attendant',
                  takeOutOfOrder: issueData.takeOutOfOrder,
                }),
              }).then((r) => r.json());

              if (res.success) {
                toast.success(
                  `Maintenance Ticket Issued for Room #${activeMaintenanceRoom.roomNumber}`,
                  'Work Order Logged'
                );
              } else {
                toast.error(res.message || 'Failed to issue maintenance ticket');
              }
              fetchHousekeeperData();
            } catch (err: any) {
              console.error('Failed to report maintenance:', err);
              toast.error(err.message || 'Failed to submit maintenance request');
            }
            setActiveMaintenanceRoom(null);
          }}
        />
      )}

    </div>
  );
};

export default HousekeeperDashboard;

