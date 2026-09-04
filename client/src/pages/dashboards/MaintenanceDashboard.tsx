import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useToast } from '../../context/ToastContext';
import { ReportMaintenanceModal } from '../../components/ReportMaintenanceModal';
import { Wrench, AlertTriangle, Calendar, Loader2 } from 'lucide-react';

// Modular Feature Tabs
import { MaintenanceTicketsTab } from '../../features/maintenance/MaintenanceTicketsTab';
import { MaintenanceOOOSuitesTab } from '../../features/maintenance/MaintenanceOOOSuitesTab';
import { MaintenancePreventativeTab } from '../../features/maintenance/MaintenancePreventativeTab';

export const MaintenanceDashboard: React.FC = () => {
  const { currentProperty } = useAuth();
  const { subscribe } = useWebSocket();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab State driven by URL ?tab= (Default is 'tickets')
  const validTabs = ['tickets', 'ooo', 'schedule'] as const;
  type MaintenanceTab = typeof validTabs[number];

  const rawTab = searchParams.get('tab') as MaintenanceTab | null;
  const activeTab: MaintenanceTab = rawTab && validTabs.includes(rawTab) ? rawTab : 'tickets';

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'tickets' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setActiveTab = (tab: MaintenanceTab) => {
    setSearchParams({ tab });
  };

  const [rooms, setRooms] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  const fetchMaintenanceData = useCallback(async () => {
    if (!currentProperty?.id) return;
    try {
      setLoading(true);
      const [roomsRes, ticketsRes] = await Promise.all([
        fetch(`/api/v1/rooms?propertyId=${currentProperty.id}`).then((r) => r.json()),
        fetch(`/api/v1/maintenance?propertyId=${currentProperty.id}`).then((r) => r.json()),
      ]);

      if (roomsRes.success && Array.isArray(roomsRes.data)) {
        setRooms(roomsRes.data);
      }
      if (ticketsRes.success && Array.isArray(ticketsRes.data)) {
        setTickets(ticketsRes.data);
      }
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id]);

  useEffect(() => {
    fetchMaintenanceData();
  }, [fetchMaintenanceData]);

  // Live WebSocket Listeners
  useEffect(() => {
    const handleLiveEvent = () => {
      fetchMaintenanceData();
    };

    const unsubStatus = subscribe('ROOM_STATUS_CHANGED', handleLiveEvent);
    const unsubTktCreated = subscribe('MAINTENANCE_TICKET_CREATED', handleLiveEvent);
    const unsubTktUpdated = subscribe('MAINTENANCE_TICKET_UPDATED', handleLiveEvent);

    return () => {
      unsubStatus();
      unsubTktCreated();
      unsubTktUpdated();
    };
  }, [subscribe, fetchMaintenanceData]);

  const handleReturnToService = async (roomId: string) => {
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'clean', notes: 'Engineering repairs completed: returned clean.' }),
      }).then((r) => r.json());

      if (res.success) {
        toast.success('Suite returned to service as Clean', 'Maintenance Complete');
        fetchMaintenanceData();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update room');
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/v1/maintenance/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Repairs completed by on-duty engineering' }),
      }).then((r) => r.json());

      if (res.success) {
        toast.success('Work order marked as resolved', 'Ticket Resolved');
        fetchMaintenanceData();
      } else {
        toast.error(res.message || 'Failed to resolve ticket');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve ticket');
    }
  };

  const oooCount = rooms.filter((r) => r.status === 'out_of_order').length;
  const activeTicketsCount = tickets.filter((t) => t.status !== 'resolved' && t.status !== 'closed').length;

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 lg:p-8 max-w-[1520px] w-full mx-auto space-y-8 text-[#0F172A] bg-[#F8F9FA] font-sans selection:bg-[#C5A059]/20 selection:text-[#0F172A]">
      {/* 1. Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-[#0F172A] bg-white border border-[#E5E7EB] shadow-2xs">
            <span>Lead Engineering & Facilities</span>
            <span>•</span>
            {loading ? (
              <span className="flex items-center gap-1 text-[#C5A059]">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">Facilities Live Feed</span>
            )}
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-[#0F172A] tracking-tight mt-2">
            {currentProperty?.name} Maintenance Hub
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Work order resolution, out-of-order room returns, and scheduled preventative maintenance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowReportModal(true)}
          className="px-4 py-2.5 rounded-xl astra-btn-primary font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <Wrench className="w-4 h-4 text-[#C5A059]" />
          <span>Report Maintenance Defect</span>
        </button>
      </div>

      {/* 2. Sub-Tabs Ribbon */}
      <div className="p-1.5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-wrap gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tickets' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Work Order Tickets ({activeTicketsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ooo')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ooo' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Out of Order Suites ({oooCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'schedule' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Preventative Schedule</span>
        </button>
      </div>

      {/* 3. Active Tab Content */}
      {activeTab === 'tickets' && (
        <MaintenanceTicketsTab
          tickets={tickets}
          onOpenReportModal={() => setShowReportModal(true)}
          onResolveTicket={handleResolveTicket}
        />
      )}

      {activeTab === 'ooo' && (
        <MaintenanceOOOSuitesTab
          rooms={rooms}
          onReturnToService={(roomId) => handleReturnToService(roomId)}
        />
      )}

      {activeTab === 'schedule' && (
        <MaintenancePreventativeTab />
      )}

      {/* 4. Modal */}
      {showReportModal && (
        <ReportMaintenanceModal
          room={rooms[0] || { id: 'rm_birch_101', roomNumber: '101', building: 'Main Lodge', floor: 1, status: 'clean' }}
          onClose={() => setShowReportModal(false)}
          onSubmit={async (issueData) => {
            const targetRoom = rooms[0];
            try {
              const res = await fetch('/api/v1/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  propertyId: currentProperty?.id,
                  roomId: targetRoom?.id,
                  title: `${issueData.category}: Suite #${targetRoom?.roomNumber || '101'}`,
                  description: issueData.description,
                  priority: issueData.priority === 'urgent' ? 'urgent' : 'medium',
                  category: issueData.category,
                  reportedBy: 'Engineering Staff',
                  takeOutOfOrder: issueData.takeOutOfOrder,
                }),
              }).then((r) => r.json());

              if (res.success) {
                toast.success('Maintenance work order logged', 'Work Order Created');
                fetchMaintenanceData();
              } else {
                toast.error(res.message || 'Failed to create work order');
              }
            } catch (err: any) {
              console.error('Failed to report maintenance:', err);
              toast.error(err.message || 'Failed to report maintenance');
            }
            setShowReportModal(false);
          }}
        />
      )}
    </div>
  );
};

export default MaintenanceDashboard;
