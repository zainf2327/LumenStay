import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useToast } from '../../context/ToastContext';
import { HousekeepingChecklistModal } from '../../components/HousekeepingChecklistModal';
import { ReportMaintenanceModal } from '../../components/ReportMaintenanceModal';
import { Brush, Layers, Wrench, Loader2, Sparkles, CheckCircle, Clock } from 'lucide-react';

// Modular Feature Tabs
import { HKCleaningQueueTab } from '../../features/housekeeper/HKCleaningQueueTab';
import { HKRoomStatusTab } from '../../features/housekeeper/HKRoomStatusTab';
import { HKReportDefectTab } from '../../features/housekeeper/HKReportDefectTab';

export const HousekeeperDashboard: React.FC = () => {
  const { currentProperty } = useAuth();
  const { subscribe } = useWebSocket();
  const toast = useToast();
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
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [activeChecklistRoom, setActiveChecklistRoom] = useState<any | null>(null);
  const [activeMaintenanceRoom, setActiveMaintenanceRoom] = useState<any | null>(null);

  const fetchHousekeeperData = useCallback(async () => {
    if (!currentProperty?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/rooms?propertyId=${currentProperty.id}`).then((r) => r.json());
      if (res.success && Array.isArray(res.data)) {
        setRooms(res.data);
      }
    } catch (err) {
      console.error('Failed to load housekeeper data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id]);

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

    return () => {
      unsubStatus();
      unsubGuestOut();
    };
  }, [subscribe, fetchHousekeeperData]);

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

