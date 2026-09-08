import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { FolioModal } from '../../components/FolioModal';
import { Building2, TrendingUp, Receipt, Hotel, Loader2, Users } from 'lucide-react';

// Modular Feature Tabs
import { OwnerPortfolioTab } from '../../features/owner/OwnerPortfolioTab';
import { OwnerAnalyticsTab } from '../../features/owner/OwnerAnalyticsTab';
import { OwnerLedgerAuditTab } from '../../features/owner/OwnerLedgerAuditTab';
import { StaffManagementTab } from '../../features/staff/StaffManagementTab';

export const OwnerDashboard: React.FC = () => {
  const { currentProperty, properties, setCurrentProperty } = useAuth();
  const { subscribe } = useWebSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab State driven by URL ?tab= (Default is 'portfolio')
  const validTabs = ['portfolio', 'analytics', 'ledger', 'staff'] as const;
  type OwnerTab = typeof validTabs[number];

  const rawTab = searchParams.get('tab') as OwnerTab | null;
  const activeTab: OwnerTab = rawTab && validTabs.includes(rawTab) ? rawTab : 'portfolio';

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'portfolio' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setActiveTab = (tab: OwnerTab) => {
    setSearchParams({ tab });
  };

  const [metrics, setMetrics] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState<Record<string, any>>({});
  const [portfolioReservations, setPortfolioReservations] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFolioResId, setActiveFolioResId] = useState<string | null>(null);

  const fetchOwnerData = useCallback(async () => {
    if (!currentProperty?.id) return;
    try {
      setLoading(true);
      const [metricsRes, resQueue, allMetricsResults, allResResults] = await Promise.all([
        fetch(`/api/v1/rooms/dashboard?propertyId=${currentProperty.id}`).then((r) => r.json()),
        fetch(`/api/v1/rooms/reservations?propertyId=${currentProperty.id}`).then((r) => r.json()),
        Promise.all(
          properties.map((p) =>
            fetch(`/api/v1/rooms/dashboard?propertyId=${p.id}`)
              .then((r) => r.json())
              .then((res) => ({ id: p.id, data: res.success ? (res.data.metrics || res.data) : null }))
              .catch(() => ({ id: p.id, data: null }))
          )
        ),
        Promise.all(
          properties.map((p) =>
            fetch(`/api/v1/rooms/reservations?propertyId=${p.id}`)
              .then((r) => r.json())
              .then((res) => ({ id: p.id, data: res.success && Array.isArray(res.data) ? res.data : [] }))
              .catch(() => ({ id: p.id, data: [] }))
          )
        ),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data.metrics || metricsRes.data);
      }
      if (resQueue.success && Array.isArray(resQueue.data)) {
        setReservations(resQueue.data);
      }

      if (Array.isArray(allMetricsResults)) {
        const mObj: Record<string, any> = {};
        allMetricsResults.forEach((item) => {
          if (item?.id) mObj[item.id] = item.data;
        });
        setPortfolioMetrics(mObj);
      }

      if (Array.isArray(allResResults)) {
        const rObj: Record<string, any[]> = {};
        allResResults.forEach((item) => {
          if (item?.id) rObj[item.id] = item.data;
        });
        setPortfolioReservations(rObj);
      }
    } catch (err) {
      console.error('Failed to load Owner data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id, properties]);

  useEffect(() => {
    fetchOwnerData();
  }, [fetchOwnerData]);

  // Live WebSocket Listeners
  useEffect(() => {
    const handleLiveEvent = () => {
      fetchOwnerData();
    };

    const unsubCheckIn = subscribe('RESERVATION_CHECKED_IN', handleLiveEvent);
    const unsubFolio = subscribe('FOLIO_UPDATED', handleLiveEvent);
    const unsubCreated = subscribe('RESERVATION_CREATED', handleLiveEvent);

    return () => {
      unsubCheckIn();
      unsubFolio();
      unsubCreated();
    };
  }, [subscribe, fetchOwnerData]);

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-[#0F172A] bg-[#F8F9FA] font-sans selection:bg-[#C5A059]/20 selection:text-[#0F172A]">
      {/* 1. Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-[#0F172A] bg-white border border-[#E5E7EB] shadow-2xs">
            <span>Ownership Portfolio Suite</span>
            <span>•</span>
            {loading ? (
              <span className="flex items-center gap-1 text-[#C5A059]">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
              </span>
            ) : (
              <span className="text-emerald-600 font-bold">Multi-Property Live Feed</span>
            )}
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-[#0F172A] tracking-tight mt-2">
            Lumen Hospitality Portfolio Dashboard
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            6 boutique properties, 197 total keys, portfolio ADR, yield benchmarks, and financial audits.
          </p>
        </div>

        {/* Selected Hotel Chip */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
            <Hotel className="w-4 h-4 text-[#C5A059]" /> Selected:
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] shadow-2xs">
            {currentProperty?.name}
          </span>
        </div>
      </div>

      {/* 2. Sub-Tabs Ribbon */}
      <div className="p-1.5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-wrap gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'portfolio' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Properties Portfolio ({properties.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'analytics' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Yield & ADR Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ledger' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Ledger & Folio Audit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'staff' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff & Governance</span>
        </button>
      </div>

      {/* 3. Active Tab Content */}
      {activeTab === 'portfolio' && (
        <OwnerPortfolioTab
          properties={properties}
          currentProperty={currentProperty}
          onSelectProperty={(p) => setCurrentProperty(p)}
          portfolioMetrics={portfolioMetrics}
          portfolioReservations={portfolioReservations}
        />
      )}

      {activeTab === 'analytics' && (
        <OwnerAnalyticsTab
          metrics={metrics}
          reservations={reservations}
          totalRooms={currentProperty?.totalRooms || 42}
          properties={properties}
          currentProperty={currentProperty}
          portfolioMetrics={portfolioMetrics}
          portfolioReservations={portfolioReservations}
          onSelectProperty={(p) => setCurrentProperty(p)}
        />
      )}

      {activeTab === 'ledger' && (
        <OwnerLedgerAuditTab
          reservations={reservations}
          onOpenFolio={(resId) => setActiveFolioResId(resId)}
        />
      )}

      {activeTab === 'staff' && (
        <StaffManagementTab />
      )}

      {/* 4. Folio Audit Modal */}
      {activeFolioResId && (
        <FolioModal
          reservationId={activeFolioResId}
          onClose={() => {
            setActiveFolioResId(null);
            fetchOwnerData();
          }}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
