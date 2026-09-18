import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { useToast } from '../../context/ToastContext';
import {
  Radio,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckSquare,
  Square,
  Send,
  Trash2,
  Plus,
  RefreshCw,
  Save,
  Sun,
  Moon,
  BookOpen,
  CheckCircle2,
  Clock,
  UserCheck,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

interface PropertyChecklists {
  amChecklist: ChecklistItem[];
  pmChecklist: ChecklistItem[];
  handoverNotes: string;
  lastUpdated: string;
  activeShift: 'AM' | 'PM';
}

interface BroadcastNotice {
  id: string;
  propertyId: string;
  message: string;
  priority: 'info' | 'warning' | 'urgent';
  author: string;
  createdAt: string;
}

export const GMShiftChecklistTab: React.FC = () => {
  const { currentProperty, currentUser } = useAuth();
  const { subscribe } = useWebSocket();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  // Checklists State
  const [checklists, setChecklists] = useState<PropertyChecklists>({
    amChecklist: [],
    pmChecklist: [],
    handoverNotes: '',
    lastUpdated: new Date().toISOString(),
    activeShift: 'AM',
  });

  const [handoverDraft, setHandoverDraft] = useState('');
  const [activeShiftView, setActiveShiftView] = useState<'AM' | 'PM'>('AM');

  // New item inputs
  const [newAmItemLabel, setNewAmItemLabel] = useState('');
  const [newPmItemLabel, setNewPmItemLabel] = useState('');

  // Broadcast state
  const [broadcast, setBroadcast] = useState<BroadcastNotice | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'info' | 'warning' | 'urgent'>('urgent');

  const propertyId = currentProperty?.id;

  // Load checklists and active broadcast
  const loadData = useCallback(async () => {
    if (!propertyId) return;
    try {
      setLoading(true);
      const [checklistsRes, broadcastRes] = await Promise.all([
        fetch(`/api/v1/properties/${propertyId}/checklists`).then((r) => r.json()),
        fetch(`/api/v1/properties/${propertyId}/broadcast`).then((r) => r.json()),
      ]);

      if (checklistsRes.success && checklistsRes.data) {
        const data = checklistsRes.data;
        const amList = Array.isArray(data.amChecklist)
          ? data.amChecklist
          : Array.isArray(data.amAudit)
          ? data.amAudit
          : [];
        const pmList = Array.isArray(data.pmChecklist)
          ? data.pmChecklist
          : Array.isArray(data.pmTurnover)
          ? data.pmTurnover
          : [];

        setChecklists({
          amChecklist: amList,
          pmChecklist: pmList,
          handoverNotes: data.handoverNotes || '',
          lastUpdated: data.date || data.lastUpdated || new Date().toISOString(),
          activeShift: data.activeShift || 'AM',
        });
        setHandoverDraft(data.handoverNotes || '');
        if (data.activeShift) {
          setActiveShiftView(data.activeShift);
        }
      }

      if (broadcastRes.success && broadcastRes.data) {
        setBroadcast(broadcastRes.data);
      } else {
        setBroadcast(null);
      }
    } catch (err) {
      console.error('Failed to load checklists/broadcast:', err);
      toast.error('Failed to load shift audit data');
    } finally {
      setLoading(false);
    }
  }, [propertyId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time broadcast subscriptions
  useEffect(() => {
    const unsubBroadcast = subscribe('STAFF_BROADCAST', (payload: BroadcastNotice) => {
      if (payload && payload.propertyId === propertyId) {
        setBroadcast(payload);
      }
    });

    const unsubCleared = subscribe('STAFF_BROADCAST_CLEARED', (payload: { propertyId: string }) => {
      if (payload && payload.propertyId === propertyId) {
        setBroadcast(null);
      }
    });

    return () => {
      unsubBroadcast();
      unsubCleared();
    };
  }, [subscribe, propertyId]);

  // Toggle checklist item
  const handleToggleItem = async (shift: 'AM' | 'PM', itemId: string) => {
    const targetKey = shift === 'AM' ? 'amChecklist' : 'pmChecklist';
    const currentList = checklists[targetKey];
    const authorName = currentUser?.name || 'General Manager';
    const nowIso = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedList = currentList.map((item) => {
      if (item.id === itemId) {
        const nextCompleted = !item.completed;
        return {
          ...item,
          completed: nextCompleted,
          completedAt: nextCompleted ? nowIso : undefined,
          completedBy: nextCompleted ? authorName : undefined,
        };
      }
      return item;
    });

    const newChecklists = {
      ...checklists,
      [targetKey]: updatedList,
    };

    setChecklists(newChecklists);

    try {
      await fetch(`/api/v1/properties/${propertyId}/checklists`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [targetKey]: updatedList }),
      });
    } catch (err) {
      console.error('Failed to update checklist item:', err);
      toast.error('Error saving checklist update');
    }
  };

  // Add custom checklist item
  const handleAddItem = async (shift: 'AM' | 'PM') => {
    const label = (shift === 'AM' ? newAmItemLabel : newPmItemLabel).trim();
    if (!label) return;

    const newItem: ChecklistItem = {
      id: `custom_${Date.now()}`,
      label,
      category: 'General Audit',
      completed: false,
    };

    const targetKey = shift === 'AM' ? 'amChecklist' : 'pmChecklist';
    const updatedList = [...checklists[targetKey], newItem];

    const newChecklists = {
      ...checklists,
      [targetKey]: updatedList,
    };

    setChecklists(newChecklists);
    if (shift === 'AM') setNewAmItemLabel('');
    else setNewPmItemLabel('');

    try {
      await fetch(`/api/v1/properties/${propertyId}/checklists`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [targetKey]: updatedList }),
      });
      toast.success(`Added custom audit checkpoint to ${shift} shift`);
    } catch (err) {
      console.error('Failed to add checklist item:', err);
      toast.error('Failed to save new item');
    }
  };

  // Save Handover Notes
  const handleSaveHandover = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/v1/properties/${propertyId}/checklists`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handoverNotes: handoverDraft,
          activeShift: activeShiftView,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChecklists((prev) => ({
          ...prev,
          handoverNotes: handoverDraft,
          lastUpdated: data.data?.lastUpdated || new Date().toISOString(),
        }));
        toast.success('Manager shift handover notes saved successfully');
      } else {
        toast.error(data.message || 'Failed to save notes');
      }
    } catch (err) {
      console.error('Failed to save handover notes:', err);
      toast.error('Network error saving handover notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // Reset shift checklist for a new shift
  const handleResetShift = async (shift: 'AM' | 'PM') => {
    const targetKey = shift === 'AM' ? 'amChecklist' : 'pmChecklist';
    const resetList = checklists[targetKey].map((item) => ({
      ...item,
      completed: false,
      completedAt: undefined,
      completedBy: undefined,
    }));

    const newChecklists = {
      ...checklists,
      [targetKey]: resetList,
    };
    setChecklists(newChecklists);

    try {
      await fetch(`/api/v1/properties/${propertyId}/checklists`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [targetKey]: resetList }),
      });
      toast.info(`Reset ${shift} shift checklist for incoming team`);
    } catch (err) {
      console.error('Failed to reset checklist:', err);
      toast.error('Failed to reset checklist');
    }
  };

  // Send Broadcast
  const handlePublishBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) {
      toast.warning('Please enter a broadcast announcement message');
      return;
    }

    setBroadcasting(true);
    try {
      const res = await fetch(`/api/v1/properties/${propertyId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: broadcastMessage.trim(),
          priority: broadcastPriority,
          author: currentUser?.name ? `GM ${currentUser.name}` : 'General Manager',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBroadcast(data.data);
        setBroadcastMessage('');
        toast.success('Broadcast published live across all staff screens!');
      } else {
        toast.error(data.message || 'Failed to dispatch broadcast');
      }
    } catch (err) {
      console.error('Failed to dispatch broadcast:', err);
      toast.error('Network error dispatching broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  // Terminate Broadcast
  const handleTerminateBroadcast = async () => {
    try {
      const res = await fetch(`/api/v1/properties/${propertyId}/broadcast`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setBroadcast(null);
        toast.info('Staff emergency broadcast ended and cleared');
      }
    } catch (err) {
      console.error('Failed to clear broadcast:', err);
      toast.error('Failed to clear broadcast');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-[#0F172A]" />
        <p className="text-sm font-medium">Loading shift audit logbook & broadcasts...</p>
      </div>
    );
  }

  // Calculate completion percentages defensively
  const amList = Array.isArray(checklists?.amChecklist) ? checklists.amChecklist : [];
  const pmList = Array.isArray(checklists?.pmChecklist) ? checklists.pmChecklist : [];

  const amCompletedCount = amList.filter((i) => i?.completed).length;
  const amTotal = amList.length || 1;
  const amPercent = Math.round((amCompletedCount / amTotal) * 100);

  const pmCompletedCount = pmList.filter((i) => i?.completed).length;
  const pmTotal = pmList.length || 1;
  const pmPercent = Math.round((pmCompletedCount / pmTotal) * 100);

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Emergency Staff Broadcast Center Card */}
      <section className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-heading font-bold text-[#0F172A]">
                  Staff Emergency Broadcast Dispatcher
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  WebSocket Bus
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Instantly pins a high-visibility alert banner across all active staff screens (Front Desk, Housekeeping, Supervisors, Maintenance).
              </p>
            </div>
          </div>

          {broadcast ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Active Broadcast Live
              </div>
              <button
                onClick={handleTerminateBroadcast}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                End Broadcast
              </button>
            </div>
          ) : (
            <span className="text-xs text-[#64748B] font-medium bg-[#F8F9FA] px-3 py-1 rounded-full border border-[#E5E7EB]">
              No Active Announcement
            </span>
          )}
        </div>

        {/* Live Active Notice Preview (if active) */}
        {broadcast && (
          <div
            className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
              broadcast.priority === 'urgent'
                ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                : broadcast.priority === 'warning'
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-purple-50/80 border-purple-200 text-purple-900'
            }`}
          >
            <div className="flex items-start gap-3">
              {broadcast.priority === 'urgent' ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : broadcast.priority === 'warning' ? (
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/75 border border-current">
                    {broadcast.priority} Alert
                  </span>
                  <span className="text-xs font-semibold">{broadcast.author}</span>
                  <span className="text-[11px] opacity-75">
                    ({new Date(broadcast.createdAt).toLocaleTimeString()})
                  </span>
                </div>
                <p className="text-sm font-medium">{broadcast.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Dispatch Form */}
        <form onSubmit={handlePublishBroadcast} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1.5">
              Compose Staff Alert or Urgent Announcement
            </label>
            <div className="relative">
              <input
                type="text"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="e.g. VIP Senator arriving at 14:00. Executive suite 304 priority turnover requested."
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] text-sm text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#0F172A] transition"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#64748B]">Urgency Level:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBroadcastPriority('info')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    broadcastPriority === 'info'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-[#64748B] border-[#CBD5E1] hover:text-[#0F172A]'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" /> Info
                </button>

                <button
                  type="button"
                  onClick={() => setBroadcastPriority('warning')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    broadcastPriority === 'warning'
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-[#64748B] border-[#CBD5E1] hover:text-[#0F172A]'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" /> Warning
                </button>

                <button
                  type="button"
                  onClick={() => setBroadcastPriority('urgent')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    broadcastPriority === 'urgent'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-[#64748B] border-[#CBD5E1] hover:text-[#0F172A]'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Urgent / Emergency
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={broadcasting || !broadcastMessage.trim()}
              className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              {broadcasting ? 'Publishing...' : 'Dispatch Live Announcement'}
            </button>
          </div>
        </form>
      </section>

      {/* 2. Shift Checklists Section (AM vs PM) */}
      <section className="space-y-6">
        {/* Shift Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs">
            <button
              onClick={() => setActiveShiftView('AM')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeShiftView === 'AM'
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-400" />
              <span>AM Opening Shift ({amCompletedCount}/{amList.length})</span>
            </button>

            <button
              onClick={() => setActiveShiftView('PM')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeShiftView === 'PM'
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>PM Turnover Shift ({pmCompletedCount}/{pmList.length})</span>
            </button>
          </div>

          <button
            onClick={() => handleResetShift(activeShiftView)}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F8F9FA] text-[#64748B] hover:text-[#0F172A] text-xs font-semibold border border-[#E5E7EB] transition cursor-pointer flex items-center gap-1.5"
            title="Reset checked items for incoming shift"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset {activeShiftView} Checklist</span>
          </button>
        </div>

        {/* Active Checklist Card */}
        <div className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm space-y-6">
          {/* Header & Progress Bar */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-heading font-bold text-[#0F172A] flex items-center gap-2">
                  {activeShiftView === 'AM' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-500" /> Morning Property Opening & Quality Audit
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-500" /> Evening Operations Turnover & Security Audit
                    </>
                  )}
                </h3>
                <p className="text-xs text-[#64748B]">
                  Required daily operational checkpoints for {currentProperty?.name}. All checks log supervisor timestamps.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xl font-heading font-extrabold text-[#0F172A]">
                  {activeShiftView === 'AM' ? amPercent : pmPercent}%
                </span>
                <span className="text-xs text-[#64748B] ml-1">Completed</span>
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (activeShiftView === 'AM' ? amPercent : pmPercent) === 100
                    ? 'bg-emerald-500'
                    : 'bg-[#0F172A]'
                }`}
                style={{
                  width: `${activeShiftView === 'AM' ? amPercent : pmPercent}%`,
                }}
              />
            </div>
          </div>

          {/* Checklist Items List */}
          <div className="space-y-2">
            {(activeShiftView === 'AM' ? amList : pmList).map(
              (item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleItem(activeShiftView, item.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 select-none ${
                    item.completed
                      ? 'bg-emerald-50/50 border-emerald-200/80 text-[#0F172A]'
                      : 'bg-[#FAF9FC] border-[#E5E7EB] hover:border-[#CBD5E1] text-[#1E293B]'
                  }`}
                >
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 transition"
                    aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {item.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-[#94A3B8]" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        item.completed ? 'line-through text-[#64748B]' : 'text-[#0F172A]'
                      }`}
                    >
                      {item.label}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-[#64748B]">
                      <span className="px-2 py-0.2 rounded-md bg-white border border-[#E5E7EB] text-[10px] font-semibold text-[#475569]">
                        {item.category}
                      </span>
                      {item.completed && item.completedAt && (
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Done at {item.completedAt} {item.completedBy ? `by ${item.completedBy}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Add custom audit item */}
          <div className="pt-2 border-t border-[#F1F5F9] flex items-center gap-2">
            <input
              type="text"
              value={activeShiftView === 'AM' ? newAmItemLabel : newPmItemLabel}
              onChange={(e) =>
                activeShiftView === 'AM'
                  ? setNewAmItemLabel(e.target.value)
                  : setNewPmItemLabel(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddItem(activeShiftView);
                }
              }}
              placeholder={`Add custom audit item to ${activeShiftView} shift...`}
              className="flex-1 px-3.5 py-2 rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] text-xs text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#0F172A]"
            />
            <button
              type="button"
              onClick={() => handleAddItem(activeShiftView)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8F9FA] text-[#0F172A] text-xs font-bold border border-[#CBD5E1] transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>
        </div>
      </section>

      {/* 3. Manager Handover Logbook & Shift Briefing Notes */}
      <section className="editorial-card rounded-2xl bg-white border border-[#E5E7EB] p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-heading font-bold text-[#0F172A]">
                General Manager Shift Handover Logbook
              </h3>
              <p className="text-xs text-[#64748B]">
                Persistent briefing notes between Morning and Evening leadership (VIP requirements, maintenance hold-overs, staffing notes).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Last logged: {new Date(checklists.lastUpdated).toLocaleDateString()} at{' '}
              {new Date(checklists.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div>
          <textarea
            rows={5}
            value={handoverDraft}
            onChange={(e) => setHandoverDraft(e.target.value)}
            placeholder="Document shift notes, special VIP guest requests, unfulfilled laundry turnovers, or mechanical items for the incoming manager..."
            className="w-full p-4 rounded-xl border border-[#CBD5E1] bg-[#F8F9FA] text-sm text-[#0F172A] focus:bg-white focus:outline-hidden focus:border-[#0F172A] transition"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Author: {currentUser?.name || 'General Manager'}</span>
          </div>

          <button
            type="button"
            onClick={handleSaveHandover}
            disabled={savingNotes}
            className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            {savingNotes ? 'Saving Notes...' : 'Save Handover Briefing'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default GMShiftChecklistTab;
