import React, { useState } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  Sparkles,
  Crown,
  Receipt,
  Check,
  UserCheck,
  XCircle,
  Coffee,
  Wrench,
  Shirt,
  Compass,
  Filter,
} from 'lucide-react';

export interface ServiceRequest {
  id: string;
  reservationId: string;
  propertyId: string;
  roomId?: string | null;
  roomNumber?: string;
  guestId: string;
  guestName: string;
  category: 'housekeeping' | 'maintenance' | 'front_desk' | 'dining';
  requestType: string;
  details: string;
  status: 'pending' | 'in_progress' | 'completed' | 'declined';
  priority: 'normal' | 'high';
  isVip: boolean;
  assignedTo?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface FrontDeskRequestsTabProps {
  requests: ServiceRequest[];
  onUpdateStatus: (requestId: string, status: ServiceRequest['status'], assignedTo?: string) => Promise<void>;
  onAddCharge: (chargeData: any) => void;
  staffName?: string;
}

export const FrontDeskRequestsTab: React.FC<FrontDeskRequestsTabProps> = ({
  requests,
  onUpdateStatus,
  onAddCharge,
  staffName = 'Front Desk Agent',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Metrics
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const inProgressCount = requests.filter((r) => r.status === 'in_progress').length;
  const completedCount = requests.filter((r) => r.status === 'completed').length;
  const vipCount = requests.filter((r) => r.isVip).length;

  // Filtered requests
  const filtered = requests.filter((r) => {
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    return matchesCategory && matchesStatus;
  });

  const handleAction = async (requestId: string, newStatus: ServiceRequest['status']) => {
    try {
      setUpdatingId(requestId);
      await onUpdateStatus(requestId, newStatus, staffName);
    } finally {
      setUpdatingId(null);
    }
  };

  const getCategoryIcon = (cat: ServiceRequest['category']) => {
    switch (cat) {
      case 'housekeeping':
        return <Shirt className="w-4 h-4 text-purple-600" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'dining':
        return <Coffee className="w-4 h-4 text-emerald-600" />;
      case 'front_desk':
      default:
        return <Compass className="w-4 h-4 text-[#4A1D6D]" />;
    }
  };

  const getStatusBadge = (status: ServiceRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
            Pending Triage
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">
            <Clock className="w-3 h-3 text-blue-600" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
            <Check className="w-3 h-3 text-emerald-600" />
            Fulfilled
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
            <XCircle className="w-3 h-3 text-slate-500" />
            Declined
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Metric Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Triage</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{pendingCount}</span>
            {pendingCount > 0 && (
              <span className="text-[11px] font-semibold text-amber-700">Requires Action</span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active / In Progress</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{inProgressCount}</span>
            <span className="text-[11px] font-medium text-slate-500">Dispatched</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Resolved Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{completedCount}</span>
            <span className="text-[11px] font-medium text-emerald-700">Guest Satisfied</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">VIP Requests</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#4A1D6D] flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{vipCount}</span>
            <span className="text-[11px] font-semibold text-[#4A1D6D]">Lumen Elite Priority</span>
          </div>
        </div>
      </div>

      {/* 2. Control Bar (Category & Status Filters) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Department:
          </span>
          {[
            { key: 'all', label: 'All Requests' },
            { key: 'front_desk', label: 'Front Desk / Concierge' },
            { key: 'housekeeping', label: 'Housekeeping' },
            { key: 'dining', label: 'Dining & Minibar' },
            { key: 'maintenance', label: 'Maintenance' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedCategory(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedCategory === tab.key
                  ? 'bg-[#4A1D6D] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
          {['all', 'pending', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition cursor-pointer ${
                selectedStatus === status
                  ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Requests Feed List */}
      {filtered.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="font-serif font-bold text-lg text-slate-900">All Concierge Requests Triaged</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no matching in-stay guest requests in this view. When in-house guests submit requests from their mobile portal, they will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const isLateCheckout = req.requestType === 'late_checkout';
            const isPending = req.status === 'pending';
            const isUpdating = updatingId === req.id;

            return (
              <div
                key={req.id}
                className={`p-5 rounded-2xl border transition shadow-2xs ${
                  req.isVip
                    ? 'bg-gradient-to-r from-purple-50/40 via-white to-white border-purple-200 hover:border-purple-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Guest & Request Meta */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif font-bold text-slate-900 text-base flex items-center gap-1.5">
                        Suite #{req.roomNumber || '—'}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="font-semibold text-slate-800 text-sm">{req.guestName}</span>

                      {req.isVip && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F3EDF8] text-[#4A1D6D] border border-[#E2D4F0]">
                          <Crown className="w-3 h-3 text-[#4A1D6D]" /> Lumen Elite VIP
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                        {getCategoryIcon(req.category)}
                        <span>{req.category.replace('_', ' ')}</span>
                      </span>

                      {getStatusBadge(req.status)}
                    </div>

                    {/* Request Details */}
                    <div className="flex items-start gap-2">
                      <div className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 max-w-2xl">
                        <span className="font-bold text-slate-900 capitalize block mb-0.5">
                          {req.requestType.replace('_', ' ')}
                        </span>
                        {req.details}
                      </div>
                    </div>

                    {/* Timestamp & Assigned meta */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      {req.assignedTo && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <UserCheck className="w-3 h-3 text-blue-600" />
                            Handled by: {req.assignedTo}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Staff Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
                    {/* Special 1-Click Action for Late Checkout */}
                    {isLateCheckout && isPending && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleAction(req.id, 'completed')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                        title="Approve 2:00 PM late checkout and notify guest"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Approve 2PM Late Checkout</span>
                      </button>
                    )}

                    {/* Pending Action: Mark In Progress */}
                    {isPending && !isLateCheckout && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleAction(req.id, 'in_progress')}
                        className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    {/* In Progress Action: Mark Completed */}
                    {req.status === 'in_progress' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleAction(req.id, 'completed')}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Fulfilled</span>
                      </button>
                    )}

                    {/* Decline Option for pending */}
                    {isPending && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleAction(req.id, 'declined')}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300 font-semibold text-xs transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Decline</span>
                      </button>
                    )}

                    {/* Post Folio Incidental Charge Modal */}
                    <button
                      type="button"
                      onClick={() =>
                        onAddCharge({
                          id: req.reservationId,
                          roomNumber: req.roomNumber,
                          guestName: req.guestName,
                          defaultDescription: `${req.category.replace('_', ' ').toUpperCase()}: ${req.requestType.replace('_', ' ')}`,
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="Post incidental or minibar charge to guest folio"
                    >
                      <Receipt className="w-3.5 h-3.5 text-slate-500" />
                      <span>Post Charge</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
