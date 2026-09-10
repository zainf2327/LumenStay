import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
  Globe,
  ShieldCheck,
  RefreshCw,
  Zap,
  Loader2,
  Download,
} from 'lucide-react';
import { ChannelDonutChart } from '../../components/charts/ChannelDonutChart';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import type { DynamicPricingRule, ChannelSyncStatus } from '../../../../server/src/types/domain.types.js';

interface RatePlan {
  id: string;
  name: string;
  code: string;
  basePrice: number;
  discountPct: number;
  minStay: number;
  perks: string[];
  active: boolean;
  weekendSurcharge: number;
  cancellationPolicy: string;
}

export const RevenueRatePlansTab: React.FC = () => {
  const { currentProperty } = useAuth();
  const { subscribe } = useWebSocket();

  const [ratePlans, setRatePlans] = useState<RatePlan[]>([
    {
      id: 'rp_bar',
      name: 'Best Available Rate (BAR)',
      code: 'BAR-FLEX',
      basePrice: 420,
      discountPct: 0,
      minStay: 1,
      perks: ['Free Cancellation up to 48h', 'Welcome Heritage Cocktail', 'High-Speed Wi-Fi'],
      active: true,
      weekendSurcharge: 45,
      cancellationPolicy: 'Flexible 48h',
    },
    {
      id: 'rp_nonref',
      name: 'Advance Purchase Saver',
      code: 'ADV-NONREF',
      basePrice: 355,
      discountPct: 15,
      minStay: 1,
      perks: ['15% Non-Refundable Savings', 'Complimentary Valet Parking', 'Lumen Elite Points'],
      active: true,
      weekendSurcharge: 30,
      cancellationPolicy: 'Non-Refundable',
    },
    {
      id: 'rp_corp',
      name: 'Heritage Corporate Executive',
      code: 'CORP-EXEC',
      basePrice: 330,
      discountPct: 20,
      minStay: 1,
      perks: ['Guaranteed 2PM Late Checkout', 'High-Speed Boardroom Access', 'Breakfast Included'],
      active: true,
      weekendSurcharge: 0,
      cancellationPolicy: 'Same-day 6PM',
    },
    {
      id: 'rp_extended',
      name: 'Extended Luxury Sanctuary (3+ Nts)',
      code: 'EXT-STAY',
      basePrice: 310,
      discountPct: 25,
      minStay: 3,
      perks: ['$75 Spa & Wellness Credit', 'Daily Gourmet Breakfast', 'Complimentary Laundry Prep'],
      active: true,
      weekendSurcharge: 20,
      cancellationPolicy: '7 Days Prior',
    },
  ]);

  // Phase 2: Live Channel Gateway & Dynamic Pricing States
  const [channelStatus, setChannelStatus] = useState<ChannelSyncStatus | null>(null);
  const [pricingRules, setPricingRules] = useState<DynamicPricingRule[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [pullingFeed, setPullingFeed] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationChannel, setSimulationChannel] = useState<'expedia' | 'booking_com' | 'airbnb'>('expedia');
  const [simulationAmount, setSimulationAmount] = useState<number>(760);
  const [recentSimulatedBooking, setRecentSimulatedBooking] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [overridePrice, setOverridePrice] = useState<number>(445);
  const [overrideSuccess, setOverrideSuccess] = useState<boolean>(false);

  const propertyId = currentProperty?.id || 'prop_birchwood';

  // Fetch Channel Manager Status and Rules
  const fetchChannelData = useCallback(async () => {
    try {
      const [statusRes, rulesRes] = await Promise.all([
        fetch(`/api/v1/channels/status?propertyId=${propertyId}`).then((r) => r.json()),
        fetch(`/api/v1/channels/pricing-rules?propertyId=${propertyId}`).then((r) => r.json()),
      ]);

      if (statusRes.success && Array.isArray(statusRes.data) && statusRes.data.length > 0) {
        setChannelStatus(statusRes.data[0]);
      }
      if (rulesRes.success && Array.isArray(rulesRes.data)) {
        setPricingRules(rulesRes.data);
      }
    } catch (err) {
      console.error('Failed to load channel manager data:', err);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchChannelData();
  }, [fetchChannelData]);

  // Subscribe to real-time Channel & Pricing Events
  useEffect(() => {
    const handleOtaBooking = (data: any) => {
      setRecentSimulatedBooking(data);
      setNotification(`⚡ Real-Time OTA Inbound: ${data.channel.toUpperCase()} reservation confirmed for ${data.guestName} ($${data.totalAmount}). Net captured: $${data.netReceivable}`);
      fetchChannelData();
    };

    const handleSyncComplete = (data: any) => {
      setNotification(`✓ Channex Two-Way Parity Sync completed across Expedia, Booking.com, and Airbnb in ${data.latencyMs}ms`);
      fetchChannelData();
    };

    const unsubOta = subscribe('OTA_BOOKING_RECEIVED', handleOtaBooking);
    const unsubSync = subscribe('CHANNEL_SYNC_COMPLETED', handleSyncComplete);

    return () => {
      unsubOta();
      unsubSync();
    };
  }, [subscribe, fetchChannelData]);

  const handleAdjustPrice = (id: string, delta: number) => {
    setRatePlans((prev) =>
      prev.map((rp) => (rp.id === id ? { ...rp, basePrice: Math.max(150, rp.basePrice + delta) } : rp))
    );
  };

  const handleToggleActive = (id: string) => {
    setRatePlans((prev) =>
      prev.map((rp) => (rp.id === id ? { ...rp, active: !rp.active } : rp))
    );
  };

  // Trigger Outbound Channel Parity Sync
  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      const res = await fetch(`/api/v1/channels/sync/${propertyId}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setNotification(json.message || 'Two-way parity successfully pushed to Channex and OTAs');
        fetchChannelData();
      }
    } catch (e) {
      setNotification('Failed to sync channels. Please try again.');
    } finally {
      setSyncing(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Option 1: Pull Booking Revisions Feed on-demand
  const handlePullFeed = async () => {
    try {
      setPullingFeed(true);
      const res = await fetch('/api/v1/channels/pull-feed', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setNotification(json.message || 'Channex Booking Revisions feed polled and acknowledged.');
        fetchChannelData();
      }
    } catch (e) {
      setNotification('Failed to pull Channex feed. Please verify API connection.');
    } finally {
      setPullingFeed(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Toggle Dynamic Pricing Rule Active State
  const handleToggleRule = async (ruleId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/v1/channels/pricing-rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const json = await res.json();
      if (json.success) {
        setPricingRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, isActive: !currentActive } : r))
        );
        setNotification(`Dynamic rule "${json.data.name}" ${!currentActive ? 'Enabled' : 'Paused'}`);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Apply Manual Rate Override & Push to OTAs
  const handleApplyOverride = async () => {
    try {
      const res = await fetch('/api/v1/channels/rate-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          roomTypeId: 'rt_birchwood_deluxe',
          price: overridePrice,
          setBy: 'Revenue Manager',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setOverrideSuccess(true);
        setNotification(`Rate override $${overridePrice}/night immediately deployed to Channex, Expedia, and Booking.com!`);
        setTimeout(() => {
          setOverrideSuccess(false);
          setNotification(null);
        }, 5000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Simulate Inbound OTA Booking
  const handleSimulateBooking = async () => {
    try {
      setSimulating(true);
      const res = await fetch('/api/v1/channels/simulate-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          channel: simulationChannel,
          totalAmount: simulationAmount,
          guestName: simulationChannel === 'airbnb' ? 'Liam Gallagher' : simulationChannel === 'booking_com' ? 'Sofia Rodriguez' : 'Marcus Vance',
          guestEmail: `guest_${simulationChannel}_${Date.now()}@example.com`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRecentSimulatedBooking(json.data.reservation);
        setNotification(`✓ Simulated ${simulationChannel.toUpperCase()} booking created! Folio updated with dual gross/net commission.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
      setTimeout(() => setNotification(null), 6000);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Real-Time Notification Banner */}
      {notification && (
        <div className="p-4 rounded-xl bg-[#EBF4EF] border border-[#C8E3D4] text-[#236446] flex items-center gap-3 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-xs font-semibold">{notification}</p>
        </div>
      )}

      {/* 1. Header & Live Channex Distribution Hub Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E9E5EE]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#4A1D6D] bg-[#F3EDF8] border border-[#E2D4F0] mb-1">
            <Globe className="w-3 h-3 text-[#4A1D6D]" /> Phase 2: Channex.io Live Distribution Hub
          </div>
          <h2 className="text-xl font-serif font-semibold text-[#1E1627]">
            Rate Plans, OTA Channels & Yield Rules
          </h2>
          <p className="text-xs text-[#6E6678]">
            Two-way inventory sync, rate parity enforcement, dynamic surge triggers, and dual gross/net folio accounting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={pullingFeed}
            onClick={handlePullFeed}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E9E5EE] hover:bg-[#F3EDF8] text-[#1E1627] text-xs font-semibold uppercase tracking-wider transition shadow-2xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
            title="Poll Channex Booking Revisions Feed for new bookings"
          >
            <Download className={`w-3.5 h-3.5 text-[#6E6678] ${pullingFeed ? 'animate-bounce' : ''}`} />
            <span>{pullingFeed ? 'Pulling Feed...' : 'Pull Feed (Option 1)'}</span>
          </button>

          <button
            type="button"
            disabled={syncing}
            onClick={handleTriggerSync}
            className="px-4 py-2.5 rounded-xl bg-[#4A1D6D] hover:bg-[#3B1457] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Parity...' : 'Push Two-Way Parity'}</span>
          </button>
        </div>
      </div>

      {/* 2. Channex Channel Gateway Connectivity Status Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gateway Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Channex Hub</span>
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">99.9% Uptime</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Latency: {channelStatus?.syncLatencySeconds || '0.38'}s</div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
            Connected
          </span>
        </div>

        {/* Expedia Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expedia EPS</span>
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">18.0% Commission</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Instant Webhooks Active</div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-300">
            Live Parity
          </span>
        </div>

        {/* Booking.com Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Booking.com</span>
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">15.0% Commission</div>
            <div className="text-[11px] text-slate-500 mt-0.5">JSON Webhook Verified</div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-300">
            Live Parity
          </span>
        </div>

        {/* Airbnb Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Airbnb Boutique</span>
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1">3.0% Host Fee</div>
            <div className="text-[11px] text-slate-500 mt-0.5">2-Way iCal & API Bus</div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
            Syncing
          </span>
        </div>
      </div>

      {/* 3. Dynamic Pricing & Occupancy Yield Rules Engine */}
      <div className="editorial-card rounded-2xl bg-white border border-[#E9E5EE] p-6 lg:p-8 space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E9E5EE]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#4A1D6D] bg-[#F3EDF8] border border-[#E2D4F0] mb-1">
              <Zap className="w-3 h-3 text-[#4A1D6D]" /> Automated Rules Engine
            </div>
            <h3 className="text-xl font-serif font-semibold text-[#1E1627]">
              Property Dynamic Yield Triggers
            </h3>
            <p className="text-xs text-[#6E6678] font-medium">
              Rules automatically adjust rates based on current occupancy, applying price surges and MLOS restrictions before pushing to Channex.
            </p>
          </div>

          {/* Quick Manual Override Form */}
          <div className="flex items-center gap-2 bg-[#FAF9FC] p-2 rounded-xl border border-[#E9E5EE]">
            <span className="text-xs font-semibold text-[#1E1627]">Override BAR:</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-semibold">$</span>
              <input
                type="number"
                value={overridePrice}
                onChange={(e) => setOverridePrice(Number(e.target.value))}
                className="w-20 pl-6 pr-2 py-1 text-xs font-bold rounded-lg border border-[#E9E5EE] bg-white focus:outline-hidden focus:border-[#4A1D6D]"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyOverride}
              className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1 ${
                overrideSuccess ? 'bg-emerald-700' : 'bg-[#4A1D6D] hover:bg-[#3B1457]'
              }`}
            >
              <span>{overrideSuccess ? '✓ Deployed' : 'Push Rate'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricingRules.length > 0 ? (
            pricingRules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-xl border transition ${
                  rule.isActive
                    ? 'bg-amber-50/40 border-amber-200 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 px-2 py-0.5 rounded bg-amber-100 border border-amber-300">
                    {rule.ruleType.replace('_', ' ')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleRule(rule.id, rule.isActive)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer transition ${
                      rule.isActive
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {rule.isActive ? 'Active' : 'Off'}
                  </button>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mt-2">{rule.name}</h4>
                <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                  <p>
                    Threshold: <strong className="text-slate-900">{rule.thresholdPercent}% Occupancy</strong>
                  </p>
                  <p>
                    Adjustment:{' '}
                    <strong className="text-emerald-700">
                      {rule.priceAdjustmentPercent > 0 ? `+${rule.priceAdjustmentPercent}%` : `${rule.priceAdjustmentPercent}%`}
                    </strong>
                  </p>
                  {rule.minNights && <p>Min Stay: <strong>{rule.minNights} nights (MLOS)</strong></p>}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-6 text-xs text-slate-500">
              Loading dynamic pricing rules...
            </div>
          )}
        </div>
      </div>

      {/* 4. Option 1: Channex Revisions Feed (Pull & Acknowledge Engine) */}
      <div className="editorial-card rounded-2xl bg-gradient-to-br from-[#1E1627] to-[#2D1B3E] text-white p-6 lg:p-8 space-y-6 shadow-md border border-[#3E2754]">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] bg-white/10 border border-white/20 mb-1">
              <Download className="w-3 h-3 text-[#D4AF37]" /> Option 1: Pull Revisions Feed API
            </div>
            <h3 className="text-xl font-serif font-semibold text-white">
              Channex Revisions Feed &amp; Mandatory Acknowledgment
            </h3>
            <p className="text-xs text-slate-300">
              LumenStay polls the central Channex revisions feed for all properties in one unified call (<code>GET /api/v1/booking_revisions/feed</code>), saves reservations to PMS inventory, and confirms receipt via mandatory acknowledgment (<code>POST /api/v1/booking_revisions/:id/ack</code>).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Select Distribution Channel
            </label>
            <select
              value={simulationChannel}
              onChange={(e: any) => setSimulationChannel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold focus:outline-hidden focus:border-purple-400"
            >
              <option value="expedia" className="bg-[#1E1627] text-white">Expedia (18% Commission)</option>
              <option value="booking_com" className="bg-[#1E1627] text-white">Booking.com (15% Commission)</option>
              <option value="airbnb" className="bg-[#1E1627] text-white">Airbnb Boutique (3% Host Fee)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
              Gross Reservation Value ($)
            </label>
            <input
              type="number"
              value={simulationAmount}
              onChange={(e) => setSimulationAmount(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold focus:outline-hidden focus:border-purple-400"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              disabled={simulating}
              onClick={handleSimulateBooking}
              className="w-full py-2.5 px-4 rounded-xl bg-[#4A1D6D] hover:bg-[#5C2487] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-sm border border-purple-400/30 disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" /> Pulling &amp; Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-purple-200" /> Simulate &amp; Ingest Feed
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Simulation Result Display */}
        {recentSimulatedBooking && (
          <div className="p-4 rounded-xl bg-slate-800/80 border border-emerald-500/40 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Inbound Revision Processed &amp; Acknowledged (&lt;3.0s)
              </span>
              <span className="font-mono">{recentSimulatedBooking.confirmationCode}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-slate-700">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Channel</span>
                <span className="font-bold uppercase text-white">{recentSimulatedBooking.source || simulationChannel}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Gross Charge</span>
                <span className="font-bold text-white">${recentSimulatedBooking.totalAmount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Channel Commission</span>
                <span className="font-bold text-rose-400">-${recentSimulatedBooking.commissionAmount || Math.round(recentSimulatedBooking.totalAmount * 0.18)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Net Captured</span>
                <span className="font-bold text-emerald-400">${recentSimulatedBooking.netReceivable || (recentSimulatedBooking.totalAmount - Math.round(recentSimulatedBooking.totalAmount * 0.18))}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Channel Distribution & Margin Analysis Donut */}
      <ChannelDonutChart />

      {/* 6. Published Rate Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ratePlans.map((plan) => (
          <div
            key={plan.id}
            className={`editorial-card rounded-2xl bg-white border p-6 space-y-5 transition shadow-xs ${
              plan.active ? 'border-[#E9E5EE]' : 'border-[#E9E5EE]/50 opacity-60'
            }`}
          >
            {/* Top Info */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A1D6D] px-2 py-0.5 rounded bg-[#F3EDF8] border border-[#E2D4F0]">
                  {plan.code}
                </span>
                <h3 className="text-lg font-serif font-semibold text-[#1E1627] mt-1.5">{plan.name}</h3>
                <p className="text-xs text-[#6E6678]">{plan.cancellationPolicy}</p>
              </div>

              {/* Status Toggle */}
              <button
                type="button"
                onClick={() => handleToggleActive(plan.id)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition ${
                  plan.active
                    ? 'bg-[#EBF5F0] text-[#1E5631] border border-[#C8E3D4]'
                    : 'bg-[#F0EFEF] text-[#6E6678] border border-[#DDDCDA]'
                }`}
              >
                {plan.active ? 'Active on Web' : 'Paused'}
              </button>
            </div>

            {/* Price & Adjuster */}
            <div className="p-4 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#6E6678]">Base Published Rate</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-serif font-bold text-[#1E1627]">${plan.basePrice}</span>
                  <span className="text-xs text-[#6E6678]">/ night</span>
                </div>
                <span className="text-[10px] text-[#1E5631] font-medium">
                  +${plan.weekendSurcharge} weekend surcharge
                </span>
              </div>

              {/* Quick Stepper */}
              <div className="flex items-center gap-1.5 bg-white border border-[#E9E5EE] rounded-lg p-1 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleAdjustPrice(plan.id, -10)}
                  className="p-1.5 rounded-md hover:bg-[#F3EDF8] text-[#6E6678] hover:text-[#4A1D6D] transition cursor-pointer"
                  title="Decrease rate by $10"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-[#1E1627] px-2 min-w-8 text-center">
                  ${plan.basePrice}
                </span>
                <button
                  type="button"
                  onClick={() => handleAdjustPrice(plan.id, 10)}
                  className="p-1.5 rounded-md hover:bg-[#F3EDF8] text-[#6E6678] hover:text-[#4A1D6D] transition cursor-pointer"
                  title="Increase rate by $10"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Included Direct Perks */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-[#1E1627] uppercase tracking-wider block">
                Direct Guest Perks
              </span>
              <div className="space-y-1.5">
                {plan.perks.map((perk, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#4A433D]">
                    <Sparkles className="w-3.5 h-3.5 text-[#4A1D6D] shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 7. Dual Gross / Net Commission Ledger Audit Table */}
      <div className="editorial-card rounded-2xl bg-white border border-slate-200 p-6 lg:p-8 space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-300 mb-1">
              <Globe className="w-3 h-3 text-emerald-700" /> Realized Net ADR Audit
            </div>
            <h3 className="text-xl font-serif font-semibold text-slate-900">
              Cross-Channel Distribution & Margin Bleed Audit
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Dual gross/net comparison tracking exact margin lost to commissions across each external booking channel.
            </p>
          </div>
        </div>

        {/* Channels Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[720px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Published BAR</th>
                <th className="py-3 px-4">Channel Commission</th>
                <th className="py-3 px-4">Net Realized ADR</th>
                <th className="py-3 px-4">Parity & Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="bg-slate-50/50 font-medium">
                <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#4A1D6D]" /> Direct LumenStay Engine
                </td>
                <td className="py-3.5 px-4 font-serif font-bold text-slate-900">$420</td>
                <td className="py-3.5 px-4 text-emerald-700 font-bold">0% ($0 fee)</td>
                <td className="py-3.5 px-4 font-serif font-bold text-emerald-700">$420 / nt (100% Margin)</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Direct Best
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 text-slate-800 font-medium">Booking.com</td>
                <td className="py-3.5 px-4 font-serif text-slate-900 font-semibold">$420</td>
                <td className="py-3.5 px-4 text-rose-600 font-semibold">15% ($63 fee)</td>
                <td className="py-3.5 px-4 font-serif font-bold text-slate-900">$357 / nt</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Live Parity (&lt;3s)
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 text-slate-800 font-medium">Expedia Partner Solutions</td>
                <td className="py-3.5 px-4 font-serif text-slate-900 font-semibold">$420</td>
                <td className="py-3.5 px-4 text-rose-600 font-semibold">18% ($75.60 fee)</td>
                <td className="py-3.5 px-4 font-serif font-bold text-slate-900">$344.40 / nt</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Live Parity (&lt;3s)
                  </span>
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 text-slate-800 font-medium">Airbnb Boutique</td>
                <td className="py-3.5 px-4 font-serif text-slate-900 font-semibold">$420</td>
                <td className="py-3.5 px-4 text-amber-700 font-semibold">3% ($12.60 fee)</td>
                <td className="py-3.5 px-4 font-serif font-bold text-slate-900">$407.40 / nt</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Live Parity (&lt;3s)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueRatePlansTab;
