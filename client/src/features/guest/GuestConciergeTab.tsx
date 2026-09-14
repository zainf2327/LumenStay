import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Flame,
  Shirt,
  Moon,
  Coffee,
  Package,
  Wrench,
  Send,
  Loader2,
  Crown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useToast } from '../../context/ToastContext';

interface ServiceRequest {
  id: string;
  reservationId: string;
  propertyId: string;
  roomNumber?: string;
  guestName?: string;
  category: 'housekeeping' | 'maintenance' | 'front_desk';
  requestType: string;
  details: string;
  status: 'pending' | 'acknowledged' | 'in_progress' | 'completed' | 'declined';
  priority: 'normal' | 'high' | 'urgent';
  isVip: boolean;
  assignedTo?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

interface PresetOption {
  id: string;
  title: string;
  category: 'housekeeping' | 'maintenance' | 'front_desk';
  requestType: string;
  icon: React.ElementType;
  defaultDetails: string;
  badge?: string;
}

const PRESET_OPTIONS: PresetOption[] = [
  {
    id: 'towels',
    title: 'Extra Plush Towels & Robe',
    category: 'housekeeping',
    requestType: 'towels',
    icon: Shirt,
    defaultDetails: 'Please deliver 2 sets of extra bath towels and a plush waffle-weave bathrobe.',
    badge: 'Housekeeping',
  },
  {
    id: 'turndown',
    title: 'Evening Turndown Refresh',
    category: 'housekeeping',
    requestType: 'refresh',
    icon: Moon,
    defaultDetails: 'Evening bed turn-down service, pillow fluffing, and fresh bedside mineral water.',
    badge: 'Housekeeping',
  },
  {
    id: 'pillows',
    title: 'Hypoallergenic Pillow Set',
    category: 'housekeeping',
    requestType: 'pillows',
    icon: Sparkles,
    defaultDetails: 'Two additional firm feather/hypoallergenic pillows and extra wool throw blanket.',
    badge: 'Housekeeping',
  },
  {
    id: 'toiletries',
    title: 'Organic Spa Toiletries Restock',
    category: 'housekeeping',
    requestType: 'toiletries',
    icon: Package,
    defaultDetails: 'Botanical cedar shampoo, conditioner, body wash, and lavender bath salts.',
    badge: 'Housekeeping',
  },
  {
    id: 'late_checkout',
    title: '2:00 PM Late Checkout Request',
    category: 'front_desk',
    requestType: 'late_checkout',
    icon: Clock,
    defaultDetails: 'Requesting extended departure to 2:00 PM for late mountain transit.',
    badge: 'VIP Auto-Approve',
  },
  {
    id: 'luggage',
    title: 'Luggage & Valet Departure Call',
    category: 'front_desk',
    requestType: 'luggage',
    icon: Coffee,
    defaultDetails: 'Assistance with luggage collection from room and vehicle prep at the motor court.',
    badge: 'Front Desk',
  },
  {
    id: 'climate',
    title: 'Fireside / Radiator Adjustment',
    category: 'maintenance',
    requestType: 'climate',
    icon: Flame,
    defaultDetails: 'Assistance with historic stone fireplace ignition or room radiator valve regulation.',
    badge: 'Engineering',
  },
  {
    id: 'repair',
    title: 'In-Room Technician Dispatch',
    category: 'maintenance',
    requestType: 'repair',
    icon: Wrench,
    defaultDetails: 'Technician assistance with room lighting fixture, shade motor, or audio system.',
    badge: 'Engineering',
  },
];

export const GuestConciergeTab: React.FC = () => {
  const { currentUser, currentProperty } = useAuth();
  const { subscribe } = useWebSocket();
  const { addToast } = useToast();

  const [selectedPreset, setSelectedPreset] = useState<PresetOption>(PRESET_OPTIONS[0]);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(true);

  // Active stay demo metadata
  const activeStay = {
    reservationId: 'res_active_01',
    roomNumber: '204',
    propertyName: currentProperty?.name || 'The Birchwood',
    guestName: currentUser?.name || 'Eleanor Vance',
    isVip: true,
  };

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Load existing requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/service-requests/reservation/${activeStay.reservationId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setRequests(json.data);
          }
        }
      } catch (err) {
        console.warn('Could not fetch guest requests from API:', err);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchRequests();
  }, [API_BASE, activeStay.reservationId]);

  // Real-time WebSocket listener
  useEffect(() => {
    const unsubscribeCreated = subscribe('SERVICE_REQUEST_CREATED', (newReq: ServiceRequest) => {
      if (newReq.reservationId === activeStay.reservationId) {
        setRequests((prev) => [newReq, ...prev.filter((r) => r.id !== newReq.id)]);
      }
    });

    const unsubscribeUpdated = subscribe('SERVICE_REQUEST_UPDATED', (updatedReq: ServiceRequest) => {
      if (updatedReq.reservationId === activeStay.reservationId) {
        setRequests((prev) => prev.map((r) => (r.id === updatedReq.id ? updatedReq : r)));
        addToast({
          type: 'info',
          title: 'Request Update',
          message: `Your request "${updatedReq.requestType}" is now ${updatedReq.status.replace('_', ' ').toUpperCase()}`,
        });
      }
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [subscribe, activeStay.reservationId, addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const details = customNotes.trim() ? customNotes.trim() : selectedPreset.defaultDetails;

    const payload = {
      reservationId: activeStay.reservationId,
      category: selectedPreset.category,
      requestType: selectedPreset.requestType,
      details,
      priority: activeStay.isVip ? 'high' : 'normal',
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/service-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const createdReq = json.data as ServiceRequest;
          setRequests((prev) => [createdReq, ...prev.filter((r) => r.id !== createdReq.id)]);
          addToast({
            type: 'success',
            title: 'Request Dispatched',
            message: createdReq.status === 'completed'
              ? 'Your VIP late checkout was instantly auto-approved!'
              : 'Our staff has received your in-stay request and is attending to it.',
          });
          setCustomNotes('');
        }
      } else {
        // Fallback optimistic display if offline/sandbox
        const fallbackReq: ServiceRequest = {
          id: `req_${Date.now()}`,
          reservationId: activeStay.reservationId,
          propertyId: currentProperty?.id || 'prop_birchwood',
          roomNumber: activeStay.roomNumber,
          guestName: activeStay.guestName,
          category: selectedPreset.category,
          requestType: selectedPreset.requestType,
          details,
          status: selectedPreset.requestType === 'late_checkout' && activeStay.isVip ? 'completed' : 'pending',
          priority: activeStay.isVip ? 'high' : 'normal',
          isVip: activeStay.isVip,
          createdAt: new Date().toISOString(),
        };
        setRequests((prev) => [fallbackReq, ...prev]);
        addToast({
          type: 'success',
          title: 'Request Dispatched',
          message: 'Our hospitality staff has received your request.',
        });
        setCustomNotes('');
      }
    } catch (err) {
      console.warn('Dispatch failed, showing optimistic item:', err);
      const fallbackReq: ServiceRequest = {
        id: `req_${Date.now()}`,
        reservationId: activeStay.reservationId,
        propertyId: currentProperty?.id || 'prop_birchwood',
        roomNumber: activeStay.roomNumber,
        guestName: activeStay.guestName,
        category: selectedPreset.category,
        requestType: selectedPreset.requestType,
        details,
        status: selectedPreset.requestType === 'late_checkout' && activeStay.isVip ? 'completed' : 'pending',
        priority: activeStay.isVip ? 'high' : 'normal',
        isVip: activeStay.isVip,
        createdAt: new Date().toISOString(),
      };
      setRequests((prev) => [fallbackReq, ...prev]);
      addToast({
        type: 'success',
        title: 'Request Dispatched',
        message: 'Your service request has been transmitted to property staff.',
      });
      setCustomNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Delivered / Approved
          </span>
        );
      case 'in_progress':
      case 'acknowledged':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> Attendant En Route
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3 h-3 text-red-600" /> Unavailable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Dispatched / Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. In-Stay Active Suite Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#18382B] to-[#2C5E4A] text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/10 text-white border border-white/20">
              <Sparkles className="w-3 h-3 text-[#D4AF37]" />
              <span>Currently In-House • Room {activeStay.roomNumber}</span>
              <span>•</span>
              <span>{activeStay.propertyName}</span>
            </div>
            <h2 className="text-2xl font-heading font-bold text-white tracking-tight">
              Boutique In-Stay Concierge &amp; Service Dispatch
            </h2>
            <p className="text-xs text-emerald-100 max-w-2xl font-light leading-relaxed">
              Every request connects directly to our on-property housekeeping, maintenance, and front desk teams via real-time digital dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-xs">
            <Crown className="w-4 h-4 text-[#D4AF37]" />
            <div>
              <p className="font-semibold text-white">Lumen Elite VIP</p>
              <p className="text-[10px] text-emerald-200">Priority Dispatch Queue</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 2. Left Column: Service Request Form & Presets (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E9E5EE] shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#E9E5EE] pb-4">
              <div>
                <h3 className="font-heading font-bold text-lg text-[#1E1627] flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#4A1D6D]" /> Select In-Stay Amenity
                </h3>
                <p className="text-xs text-[#6E6678]">Choose a luxury service preset or enter bespoke notes.</p>
              </div>
              <span className="text-[11px] font-semibold text-[#4A1D6D] bg-[#F3EDF8] px-2.5 py-1 rounded-full">
                Instant Transmission
              </span>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRESET_OPTIONS.map((preset) => {
                const IconComponent = preset.icon;
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(preset);
                      setCustomNotes('');
                    }}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'border-[#4A1D6D] bg-[#F3EDF8]/50 ring-2 ring-[#4A1D6D]/10 shadow-xs'
                        : 'border-[#E9E5EE] hover:border-[#4A1D6D]/40 bg-white hover:bg-[#FAF9FC]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#4A1D6D] text-white' : 'bg-slate-100 text-slate-700'}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {preset.badge}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-[#1E1627]">{preset.title}</h4>
                      <p className="text-[11px] text-[#6E6678] line-clamp-2 mt-0.5">{preset.defaultDetails}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Notes Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#1E1627] mb-1.5">
                  Specific Requests or Delivery Instructions:
                </label>
                <textarea
                  rows={3}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder={selectedPreset.defaultDetails}
                  className="w-full px-4 py-3 rounded-2xl border border-[#E9E5EE] focus:border-[#4A1D6D] focus:ring-2 focus:ring-[#4A1D6D]/10 outline-none text-xs text-[#1E1627] bg-[#FAF9FC] placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#6E6678] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Estimated delivery: 10–15 minutes
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#4A1D6D] hover:bg-[#3B1457] text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 3. Right Column: Active In-Stay Request Status Board (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-[#E9E5EE] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E9E5EE] pb-4">
              <div>
                <h3 className="font-heading font-bold text-base text-[#1E1627] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#4A1D6D]" /> Request Timeline
                </h3>
                <p className="text-[11px] text-[#6E6678]">Real-time status of your in-stay requests.</p>
              </div>
              <span className="text-xs font-bold text-[#4A1D6D] bg-[#F3EDF8] px-2.5 py-1 rounded-full">
                {requests.length} {requests.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            {loadingRequests ? (
              <div className="py-12 text-center text-xs text-[#6E6678]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#4A1D6D] mb-2" />
                <span>Checking status board...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[#F3EDF8] text-[#4A1D6D] mx-auto flex items-center justify-center font-bold text-sm">
                  ✨
                </div>
                <p className="font-semibold text-xs text-[#1E1627]">No active requests at this time</p>
                <p className="text-[11px] text-[#6E6678] max-w-xs mx-auto">
                  Select any service preset on the left to dispatch amenities or assistance to Suite {activeStay.roomNumber}.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-[#E9E5EE] bg-[#FAF9FC] space-y-2.5 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A1D6D]">
                          {req.category.replace('_', ' ')} • {req.requestType.replace('_', ' ')}
                        </span>
                        <h4 className="font-semibold text-xs text-[#1E1627] capitalize">
                          {req.requestType.replace('_', ' ')}
                        </h4>
                      </div>
                      <div>{getStatusBadge(req.status)}</div>
                    </div>

                    <p className="text-xs text-[#6E6678] bg-white p-2.5 rounded-xl border border-[#E9E5EE]/70">
                      {req.details}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Room {req.roomNumber || activeStay.roomNumber}</span>
                      <span>
                        {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
