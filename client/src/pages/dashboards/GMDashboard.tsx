import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { FolioModal } from '../../components/FolioModal';
import { TrendingUp, Key, Layers, Users, Hotel, Loader2 } from 'lucide-react';

// Modular Feature Tabs
import { GMExecutiveKPIsTab } from '../../features/gm/GMExecutiveKPIsTab';
import { GMOperationsMonitorTab } from '../../features/gm/GMOperationsMonitorTab';
import { GMRoomHealthTab } from '../../features/gm/GMRoomHealthTab';
import { GMGuestCRMTab } from '../../features/gm/GMGuestCRMTab';

export const GMDashboard: React.FC = () => {
  const { currentProperty } = useAuth();
  const { subscribe } = useWebSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab State driven by URL ?tab= (Default is 'kpis')
  const validTabs = ['kpis', 'operations', 'rooms', 'crm'] as const;
  type GMTab = typeof validTabs[number];

  const rawTab = searchParams.get('tab') as GMTab | null;
  const activeTab: GMTab = rawTab && validTabs.includes(rawTab) ? rawTab : 'kpis';

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'kpis' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setActiveTab = (tab: GMTab) => {
    setSearchParams({ tab });
  };

  const [metrics, setMetrics] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFolioResId, setActiveFolioResId] = useState<string | null>(null);

  const fetchGMData = useCallback(async () => {
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
      console.error('Failed to load GM data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id]);

  useEffect(() => {
    fetchGMData();
  }, [fetchGMData]);

  // Live WebSocket Listeners
  useEffect(() => {
    const handleLiveEvent = () => {
      fetchGMData();
    };

    const unsubCheckIn = subscribe('RESERVATION_CHECKED_IN', handleLiveEvent);
    const unsubFolio = subscribe('FOLIO_UPDATED', handleLiveEvent);
    const unsubCreated = subscribe('RESERVATION_CREATED', handleLiveEvent);
    const unsubStatus = subscribe('ROOM_STATUS_CHANGED', handleLiveEvent);

    return () => {
      unsubCheckIn();
      unsubFolio();
      unsubCreated();
      unsubStatus();
    };
  }, [subscribe, fetchGMData]);

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-[#0F172A] bg-[#F8F9FA] font-sans selection:bg-[#C5A059]/20 selection:text-[#0F172A]">
      {/* 1. Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-[#0F172A] bg-white border border-[#E5E7EB] shadow-2xs">
            <span>General Manager Executive Office</span>
            <span>•</span>
            {loading ? (
              <span className="flex items-center gap-1 text-[#C5A059]">
                <Loader2 className="w-3 h-3 animate-spin" /> Live Syncing...
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">Live Property Feed</span>
            )}
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-[#0F172A] tracking-tight mt-2">
            {currentProperty?.name} GM Dashboard
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Executive revenue metrics, operational monitoring, room condition auditing, and guest VIP CRM.
          </p>
        </div>

        {/* Dedicated Property Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
            <Hotel className="w-4 h-4 text-[#C5A059]" /> Assigned Lodge:
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] shadow-2xs flex items-center gap-1.5">
            <span>{currentProperty?.name || 'Birchwood Manor'}</span>
            <span className="text-[10px] text-emerald-600 font-bold">• On-Property</span>
          </span>
        </div>
      </div>

      {/* 2. Sub-Tabs Ribbon */}
      <div className="p-1.5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-wrap gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('kpis')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'kpis' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Executive KPIs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operations')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'operations' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Front Desk Flow ({reservations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rooms' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Room Health ({rooms.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('crm')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'crm' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Guest VIP CRM</span>
        </button>
      </div>

      {/* 3. Active Tab View */}
      {activeTab === 'kpis' && (
        <GMExecutiveKPIsTab
          metrics={metrics}
          reservations={reservations}
          totalRooms={currentProperty?.totalRooms || 42}
        />
      )}

      {activeTab === 'operations' && (
        <GMOperationsMonitorTab
          reservations={reservations}
          onOpenFolio={(resId) => setActiveFolioResId(resId)}
        />
      )}

      {activeTab === 'rooms' && (
        <GMRoomHealthTab rooms={rooms} />
      )}

      {activeTab === 'crm' && (
        <GMGuestCRMTab />
      )}

      {/* 4. Folio Modal */}
      {activeFolioResId && (
        <FolioModal
          reservationId={activeFolioResId}
          onClose={() => {
            setActiveFolioResId(null);
            fetchGMData();
          }}
        />
      )}
    </div>
  );
};

export default GMDashboard;
