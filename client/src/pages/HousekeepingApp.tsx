import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { useToast } from '../context/ToastContext';
import { HousekeepingChecklistModal } from '../components/HousekeepingChecklistModal';
import { ReportMaintenanceModal } from '../components/ReportMaintenanceModal';
import {
  Brush,
  Wrench,
  Search,
  Check,
  Bed,
  Layers,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { Room, RoomStatus } from '../types';

export const HousekeepingApp: React.FC = () => {
  const { currentProperty, currentUser } = useAuth();
  const { subscribe } = useWebSocket();
  const toast = useToast();
  const isSupervisorOrAbove =
    currentUser?.role === 'housekeeping_supervisor' ||
    currentUser?.role === 'gm' ||
    currentUser?.role === 'owner';

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lang, setLang] = useState<'en' | 'es'>('en');

  // Modals
  const [activeChecklistRoom, setActiveChecklistRoom] = useState<Room | null>(null);
  const [activeMaintenanceRoom, setActiveMaintenanceRoom] = useState<Room | null>(null);

  const fetchRoomsData = useCallback(async () => {
    if (!currentProperty?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/rooms?propertyId=${currentProperty.id}`).then((r) => r.json());
      if (res.success && Array.isArray(res.data)) {
        setRooms(res.data);
      }
    } catch (err) {
      console.error('Failed to load housekeeping rooms:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProperty?.id]);

  useEffect(() => {
    fetchRoomsData();
  }, [fetchRoomsData]);

  // Live WebSocket Listeners
  useEffect(() => {
    const handleLiveUpdate = () => {
      fetchRoomsData();
    };

    const unsubStatus = subscribe('ROOM_STATUS_CHANGED', handleLiveUpdate);
    const unsubCheckOut = subscribe('GUEST_CHECKED_OUT', handleLiveUpdate);
    const unsubCheckIn = subscribe('GUEST_CHECKED_IN', handleLiveUpdate);
    const unsubReassigned = subscribe('ROOM_REASSIGNED', handleLiveUpdate);

    return () => {
      unsubStatus();
      unsubCheckOut();
      unsubCheckIn();
      unsubReassigned();
    };
  }, [subscribe, fetchRoomsData]);

  const handleUpdateStatus = async (roomId: string, newStatus: RoomStatus, notes?: string) => {
    try {
      const res = await fetch(`/api/v1/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          quirks: notes,
        }),
      }).then((r) => r.json());

      if (res.success) {
        toast.success(
          `Room status updated to ${newStatus.replace('_', ' ').toUpperCase()}`,
          'Housekeeping Updated'
        );
        fetchRoomsData();
      } else {
        toast.error(res.error || 'Failed to update status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleMaintenanceSubmit = async (issueData: {
    category: string;
    description: string;
    priority: 'urgent' | 'standard';
    takeOutOfOrder: boolean;
  }) => {
    if (!activeMaintenanceRoom || !currentProperty) return;
    try {
      if (issueData.takeOutOfOrder) {
        await handleUpdateStatus(activeMaintenanceRoom.id, 'out_of_order', issueData.description);
      }
      await fetch('/api/v1/rooms/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: currentProperty.id,
          roomId: activeMaintenanceRoom.id,
          title: `${issueData.category} - Suite #${activeMaintenanceRoom.roomNumber}`,
          priority: issueData.priority === 'urgent' ? 'urgent' : 'medium',
          category: issueData.category,
          description: issueData.description,
          reportedBy: currentUser?.name || 'Housekeeping Staff',
        }),
      });
      toast.success(
        `Maintenance logged for Suite #${activeMaintenanceRoom.roomNumber}`,
        'Issue Reported'
      );
      setActiveMaintenanceRoom(null);
    } catch (err) {
      toast.error('Failed to log maintenance issue');
    }
  };

  // Metrics
  const totalCount = rooms.length;
  const dirtyCount = rooms.filter((r) => r.status === 'dirty').length;
  const cleanCount = rooms.filter((r) => r.status === 'clean').length;
  const inspectedCount = rooms.filter((r) => r.status === 'inspected').length;
  const oooCount = rooms.filter((r) => r.status === 'out_of_order').length;
  const occupiedCount = rooms.filter((r) => r.isOccupied).length;

  // Filtered Rooms
  const filteredRooms = rooms.filter((r) => {
    if (floorFilter !== 'all' && r.floor?.toString() !== floorFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = r.roomNumber?.toLowerCase().includes(q);
      const typeMatch = (r as any).roomTypeName?.toLowerCase().includes(q);
      if (!numMatch && !typeMatch) return false;
    }
    if (statusFilter === 'dirty') return r.status === 'dirty';
    if (statusFilter === 'clean') return r.status === 'clean';
    if (statusFilter === 'inspected') return r.status === 'inspected';
    if (statusFilter === 'out_of_order') return r.status === 'out_of_order';
    if (statusFilter === 'occupied') return r.isOccupied;
    if (statusFilter === 'vacant') return !r.isOccupied;
    return true;
  });

  const floors = Array.from(new Set(rooms.map((r) => r.floor || 1))).sort((a, b) => a - b);

  const t = {
    en: {
      badge: 'Housekeeping Operations',
      liveBoard: 'Live Shift Board',
      syncing: 'Syncing...',
      shiftLead: 'Shift Lead',
      turnoverQueue: 'Turnover Queue',
      turnoverSub: 'Suites requiring clean',
      cleanedSuites: 'Cleaned Suites',
      cleanedSub: 'Awaiting inspection',
      inspectedReady: 'Inspected Ready',
      inspectedSub: 'Ready for check-in',
      inHouse: 'In-House Occupied',
      inHouseSub: 'Stayover guests',
      totalSuites: 'Total Suites',
      oooSub: 'out of order',
      allSuites: 'All Suites',
      turnoverFilter: 'Turnover Needed',
      cleanedFilter: 'Cleaned',
      inspectedFilter: 'Inspected Ready',
      oooFilter: 'Out of Order',
      allFloors: 'All Floors',
      floor: 'Floor',
      searchPlaceholder: 'Search room # or suite type...',
    },
    es: {
      badge: 'Operaciones de Limpieza',
      liveBoard: 'Panel de Turno en Vivo',
      syncing: 'Sincronizando...',
      shiftLead: 'Líder de Turno',
      turnoverQueue: 'Habitaciones Sucias',
      turnoverSub: 'Requieren limpieza',
      cleanedSuites: 'Habitaciones Limpias',
      cleanedSub: 'Esperando inspección',
      inspectedReady: 'Inspeccionadas Listas',
      inspectedSub: 'Listas para check-in',
      inHouse: 'Huéspedes en Casa',
      inHouseSub: 'Huéspedes hospedados',
      totalSuites: 'Total de Suites',
      oooSub: 'fuera de servicio',
      allSuites: 'Todas las Suites',
      turnoverFilter: 'Por Limpiar',
      cleanedFilter: 'Limpias',
      inspectedFilter: 'Inspeccionadas',
      oooFilter: 'Fuera de Servicio',
      allFloors: 'Todos los Pisos',
      floor: 'Piso',
      searchPlaceholder: 'Buscar habitación o tipo...',
    },
  }[lang];

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'dirty':
        return {
          label: lang === 'es' ? 'Sucia / Limpieza Requerida' : 'Dirty / Turnover Needed',
          bg: 'bg-[#FAF0ED] text-[#8C2F22] border-[#EACEC8]',
          dot: 'bg-[#8C2F22]',
        };
      case 'clean':
        return {
          label: lang === 'es' ? 'Limpia (Pendiente Inspección)' : 'Cleaned (Pending Inspection)',
          bg: 'bg-[#EBF4EF] text-[#236446] border-[#C8E3D4]',
          dot: 'bg-[#236446]',
        };
      case 'inspected':
        return {
          label: lang === 'es' ? 'Inspeccionada Lista' : 'Inspected Ready',
          bg: 'bg-[#FDF6E8] text-[#8C621E] border-[#F7E5BD]',
          dot: 'bg-[#8C621E]',
        };
      case 'out_of_order':
        return {
          label: lang === 'es' ? 'Fuera de Servicio' : 'Out of Order',
          bg: 'bg-[#F0EFEF] text-[#5C5855] border-[#DDDCDA]',
          dot: 'bg-[#5C5855]',
        };
      default:
        return {
          label: status,
          bg: 'bg-[#F0EFEF] text-[#5C5855] border-[#DDDCDA]',
          dot: 'bg-[#5C5855]',
        };
    }
  };

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-[#1C1815] bg-[#F7F4EE] font-sans selection:bg-[#B08D57]/20 selection:text-[#1C1815]">
      
      {/* 1. Header Command Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DCD2]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-medium tracking-wider uppercase text-[#236446] bg-[#EBF4EF] border border-[#C8E3D4]">
            <Brush className="w-3.5 h-3.5" />
            <span>{t.badge}</span>
            <span>•</span>
            {loading ? (
              <span className="text-[#8C621E] flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> {t.syncing}
              </span>
            ) : (
              <span>{t.liveBoard}</span>
            )}
          </div>
          <h1 className="text-3xl font-serif font-normal text-[#1C1815] tracking-tight mt-1.5">
            {currentProperty?.name} {lang === 'es' ? 'Limpieza y Operaciones' : 'Housekeeping'}
          </h1>
        </div>

        {/* Right Controls: Shift Lead + Language Toggle */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center rounded-lg bg-white border border-[#DDD7CD] p-0.5 shadow-sm text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                lang === 'en' ? 'bg-[#1C1815] text-white shadow-xs' : 'text-[#736B63] hover:text-[#1C1815]'
              }`}
              title="Switch to English"
            >
              🇺🇸 EN
            </button>
            <button
              type="button"
              onClick={() => setLang('es')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                lang === 'es' ? 'bg-[#236446] text-white shadow-xs' : 'text-[#736B63] hover:text-[#1C1815]'
              }`}
              title="Cambiar a Español"
            >
              🇪🇸 Español
            </button>
          </div>

          {/* Supervisor Tag */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-white border border-[#DDD7CD] text-xs text-[#4A433D] shadow-sm">
            <div className="w-2 h-2 rounded-full bg-[#236446]" />
            <span>
              {t.shiftLead}: <strong className="text-[#1C1815] font-semibold">{currentUser?.name || 'Rosa Mendez (Supervisor)'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-[#EACEC8] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#736B63] text-xs">
            <span>{t.turnoverQueue}</span>
            <div className="w-2 h-2 rounded-full bg-[#8C2F22]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#8C2F22]">{dirtyCount}</div>
          <span className="text-[10px] text-[#8C2F22] block">{t.turnoverSub}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#C8E3D4] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#736B63] text-xs">
            <span>{t.cleanedSuites}</span>
            <Brush className="w-4 h-4 text-[#236446]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#236446]">{cleanCount}</div>
          <span className="text-[10px] text-[#236446] block">{t.cleanedSub}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#F7E5BD] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#736B63] text-xs">
            <span>{t.inspectedReady}</span>
            <ShieldCheck className="w-4 h-4 text-[#8C621E]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#8C621E]">{inspectedCount}</div>
          <span className="text-[10px] text-[#8C621E] block">{t.inspectedSub}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#DDD7CD] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#736B63] text-xs">
            <span>{t.inHouse}</span>
            <Bed className="w-4 h-4 text-[#B08D57]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1815]">{occupiedCount}</div>
          <span className="text-[10px] text-[#736B63] block">{t.inHouseSub}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#DDD7CD] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[#736B63] text-xs">
            <span>{t.totalSuites}</span>
            <Layers className="w-4 h-4 text-[#736B63]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1815]">{totalCount}</div>
          <span className="text-[10px] text-[#736B63] block">{oooCount} {t.oooSub}</span>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="p-3.5 rounded-xl bg-white border border-[#DDD7CD] flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: `${t.allSuites} (${totalCount})` },
            { id: 'dirty', label: `${t.turnoverFilter} (${dirtyCount})` },
            { id: 'clean', label: `${t.cleanedFilter} (${cleanCount})` },
            { id: 'inspected', label: `${t.inspectedFilter} (${inspectedCount})` },
            { id: 'out_of_order', label: `${t.oooFilter} (${oooCount})` },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer border ${
                  isActive
                    ? 'bg-[#FAF6EE] text-[#1C1815] border-[#B08D57] font-semibold'
                    : 'bg-white text-[#736B63] hover:text-[#1C1815] border-[#E5E0D8]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Floor & Search Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-white border border-[#DDD7CD] text-xs text-[#1C1815] focus:outline-none"
          >
            <option value="all">{t.allFloors}</option>
            {floors.map((f) => (
              <option key={f} value={f.toString()}>
                {t.floor} {f}
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#736B63]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#1C1815] placeholder-[#A69E95] focus:outline-none focus:border-[#B08D57] focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* 4. Room Turnover Cards Grid */}
      <div className="space-y-6">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-16 rounded-xl bg-white border border-[#DDD7CD] space-y-3">
            <Brush className="w-8 h-8 text-[#736B63] mx-auto" />
            <h3 className="text-base font-serif text-[#1C1815]">No rooms match your filter criteria</h3>
            <p className="text-xs text-[#736B63]">Try adjusting your status or floor selection</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => {
              const badge = getStatusBadge(room.status);
              const isDirty = room.status === 'dirty';
              const isClean = room.status === 'clean';
              const isInspected = room.status === 'inspected';

              return (
                <div
                  key={room.id}
                  className={`editorial-card rounded-xl bg-white border p-5 shadow-sm transition space-y-4 flex flex-col justify-between ${
                    isDirty
                      ? 'border-[#EACEC8]'
                      : isClean
                      ? 'border-[#C8E3D4]'
                      : isInspected
                      ? 'border-[#F7E5BD]'
                      : 'border-[#DDD7CD] hover:border-[#B08D57]'
                  }`}
                >
                  {/* Top: Room Number & Status */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-2xl font-bold text-[#1C1815] tracking-tight">
                            #{room.roomNumber}
                          </span>
                          <span className="text-[11px] text-[#736B63] px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8]">
                            Floor {room.floor || 1}
                          </span>
                        </div>
                        <p className="text-xs text-[#736B63] mt-0.5">{(room as any).roomTypeName || 'Deluxe Suite'}</p>
                      </div>

                      {/* Status Tag */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-medium ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </div>

                    {/* Occupancy Indicator */}
                    <div className="text-xs flex items-center gap-2 pt-1 text-[#4A433D]">
                      {room.isOccupied ? (
                        <span className="px-2 py-0.5 rounded bg-[#FAF6EE] border border-[#ECE2CE] text-[#8C621E] text-[10px] font-medium flex items-center gap-1">
                          <Bed className="w-3 h-3" /> {lang === 'es' ? 'Huésped Hospedado' : 'Stayover Guest In-House'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[#736B63] text-[10px]">
                          {lang === 'es' ? 'Disponible' : 'Vacant'}
                        </span>
                      )}
                      {room.quirks && (
                        <span className="text-[10px] text-[#736B63] italic truncate max-w-[180px]" title={room.quirks}>
                          {lang === 'es' ? 'Nota: ' : 'Note: '}{room.quirks}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Action Ribbon */}
                  <div className="pt-3 border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* Open Checklist */}
                      <button
                        type="button"
                        onClick={() => setActiveChecklistRoom(room)}
                        className="px-3 py-1.5 rounded-md bg-white hover:bg-[#FAF8F5] border border-[#DDD7CD] text-[#1C1815] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        title={lang === 'es' ? 'Abrir Lista de Control' : 'Open Linen & Cleaning Checklist'}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#B08D57]" />
                        <span>{lang === 'es' ? 'Lista' : 'Checklist'}</span>
                      </button>

                      {/* Report Maintenance */}
                      <button
                        type="button"
                        onClick={() => setActiveMaintenanceRoom(room)}
                        className="p-1.5 rounded-md bg-white hover:bg-[#FAF8F5] border border-[#DDD7CD] text-[#736B63] hover:text-[#1C1815] transition cursor-pointer"
                        title={lang === 'es' ? 'Reportar Problema de Mantenimiento' : 'Flag Maintenance Issue'}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Action Buttons based on Role & Status */}
                    <div className="flex items-center gap-2">
                      {isDirty && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(room.id, 'clean')}
                          className="px-3.5 py-1.5 rounded-md bg-[#236446] hover:bg-[#1C5138] text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{lang === 'es' ? 'Marcar Limpia' : 'Mark Clean'}</span>
                        </button>
                      )}

                      {isClean && (
                        <>
                          {isSupervisorOrAbove ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(room.id, 'dirty', 'Supervisor requested re-cleaning')}
                                className="px-2.5 py-1.5 rounded-md bg-white hover:bg-[#FAF0ED] text-[#8C2F22] border border-[#EACEC8] text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                                title="Reject inspection & flag for re-cleaning"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{lang === 'es' ? 'Re-limpiar' : 'Re-clean'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(room.id, 'inspected')}
                                className="px-3.5 py-1.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-[#B08D57]" />
                                <span>{lang === 'es' ? 'Aprobar' : 'Approve Inspect'}</span>
                              </button>
                            </div>
                          ) : (
                            <span className="px-2.5 py-1 text-[11px] font-medium text-[#236446] bg-[#EBF4EF] rounded border border-[#C8E3D4] flex items-center gap-1">
                              <Check className="w-3 h-3" /> {lang === 'es' ? 'Limpia' : 'Cleaned'}
                            </span>
                          )}
                        </>
                      )}

                      {isInspected && (
                        <>
                          {isSupervisorOrAbove ? (
                            <button
                               type="button"
                              onClick={() => handleUpdateStatus(room.id, 'dirty', 'Reset by supervisor for turnover')}
                              className="px-3 py-1.5 rounded-md bg-white hover:bg-[#FAF0ED] text-[#736B63] hover:text-[#8C2F22] border border-[#DDD7CD] text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                              title="Reset to Dirty for new turnover"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{lang === 'es' ? 'Reiniciar' : 'Reset'}</span>
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 text-[11px] font-medium text-[#8C621E] bg-[#FAF6EE] rounded border border-[#ECE2CE] flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-[#B08D57]" /> {lang === 'es' ? 'Inspeccionada' : 'Inspected'}
                            </span>
                          )}
                        </>
                      )}

                      {room.status === 'out_of_order' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(room.id, 'clean')}
                          className="px-3.5 py-1.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>{lang === 'es' ? 'Reintegrar' : 'Return to Service'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Modals */}
      {activeChecklistRoom && (
        <HousekeepingChecklistModal
          room={activeChecklistRoom}
          onClose={() => setActiveChecklistRoom(null)}
          onComplete={(notes) => {
            handleUpdateStatus(activeChecklistRoom.id, 'clean', notes);
            setActiveChecklistRoom(null);
          }}
        />
      )}

      {activeMaintenanceRoom && (
        <ReportMaintenanceModal
          room={activeMaintenanceRoom}
          onClose={() => setActiveMaintenanceRoom(null)}
          onSubmit={handleMaintenanceSubmit}
        />
      )}
    </div>
  );
};

export default HousekeepingApp;
