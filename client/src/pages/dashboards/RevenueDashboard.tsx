import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { TrendingUp, Tag, Calendar, Hotel, Loader2 } from 'lucide-react';

// Modular Feature Tabs
import { RevenueYieldTab } from '../../features/revenue/RevenueYieldTab';
import { RevenueRatePlansTab } from '../../features/revenue/RevenueRatePlansTab';
import { RevenueForecastTab } from '../../features/revenue/RevenueForecastTab';

export const RevenueDashboard: React.FC = () => {
  const { currentProperty } = useAuth();
  const { subscribe } = useWebSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab State driven by URL ?tab= (Default is 'yield')
  const validTabs = ['yield', 'rates', 'forecast'] as const;
  type RevenueTab = typeof validTabs[number];

  const rawTab = searchParams.get('tab') as RevenueTab | null;
  const activeTab: RevenueTab = rawTab && validTabs.includes(rawTab) ? rawTab : 'yield';

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'yield' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setActiveTab = (tab: RevenueTab) => {
    setSearchParams({ tab });
  };

  const [metrics, setMetrics] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRevenueData = useCallback(async () => {
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
      console.error('Failed to load revenue data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  // WebSocket Live
  useEffect(() => {
    const handleLiveEvent = () => {
      fetchRevenueData();
    };

    const unsubCreated = subscribe('RESERVATION_CREATED', handleLiveEvent);
    const unsubCheckIn = subscribe('RESERVATION_CHECKED_IN', handleLiveEvent);

    return () => {
      unsubCreated();
      unsubCheckIn();
    };
  }, [subscribe, fetchRevenueData]);

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-[#1E1627] bg-[#FAF9FC] font-sans selection:bg-[#4A1D6D]/15 selection:text-[#4A1D6D]">
      {/* 1. Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E9E5EE]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-[#1E1627] bg-white border border-[#E9E5EE] shadow-2xs">
            <span>Revenue Strategy & Yield Optimization</span>
            <span>•</span>
            {loading ? (
              <span className="flex items-center gap-1 text-[#4A1D6D]">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
              </span>
            ) : (
              <span className="text-emerald-700 font-bold">Dynamic Algorithmic Pacing Active</span>
            )}
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-[#1E1627] tracking-tight mt-2">
            {currentProperty?.name} Revenue Hub
          </h1>
          <p className="text-xs text-[#6E6678] mt-1">
            Dynamic pricing multipliers, rate distribution channels, and 90-day booking pacing forecasts.
          </p>
        </div>

        {/* Dedicated Property Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#6E6678] uppercase tracking-wider flex items-center gap-1.5">
            <Hotel className="w-4 h-4 text-[#4A1D6D]" /> Assigned Lodge:
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-white border border-[#E9E5EE] text-xs font-semibold text-[#1E1627] shadow-2xs flex items-center gap-1.5">
            <span>{currentProperty?.name || 'Birchwood Manor'}</span>
            <span className="text-[10px] text-emerald-700 font-bold">• On-Property</span>
          </span>
        </div>
      </div>

      {/* 2. Sub-Tabs Ribbon */}
      <div className="p-1.5 rounded-2xl bg-white border border-[#E9E5EE] flex flex-wrap gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('yield')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'yield' ? 'bg-[#4A1D6D] text-white shadow-xs' : 'text-[#6E6678] hover:text-[#4A1D6D] hover:bg-[#F3EDF8]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Yield & ADR Optimization</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rates' ? 'bg-[#4A1D6D] text-white shadow-xs' : 'text-[#6E6678] hover:text-[#4A1D6D] hover:bg-[#F3EDF8]'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Rate Plans & Channels</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('forecast')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'forecast' ? 'bg-[#4A1D6D] text-white shadow-xs' : 'text-[#6E6678] hover:text-[#4A1D6D] hover:bg-[#F3EDF8]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>90-Day Forecast</span>
        </button>
      </div>

      {/* 3. Active Tab View */}
      {activeTab === 'yield' && (
        <RevenueYieldTab metrics={metrics} reservations={reservations} />
      )}

      {activeTab === 'rates' && (
        <RevenueRatePlansTab />
      )}

      {activeTab === 'forecast' && (
        <RevenueForecastTab />
      )}
    </div>
  );
};

export default RevenueDashboard;
