import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { AlertTriangle, AlertCircle, Info, X, Trash2, Radio } from 'lucide-react';

export interface BroadcastNotice {
  id: string;
  propertyId: string;
  message: string;
  priority: 'info' | 'warning' | 'urgent';
  author: string;
  createdAt: string;
}

export const StaffBroadcastBanner: React.FC = () => {
  const { currentProperty, currentRole } = useAuth();
  const { subscribe } = useWebSocket();
  const [broadcast, setBroadcast] = useState<BroadcastNotice | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  // Fetch initial active broadcast for current property
  useEffect(() => {
    if (!currentProperty?.id) return;

    let isMounted = true;
    fetch(`/api/v1/properties/${currentProperty.id}/broadcast`)
      .then(res => res.json())
      .then(json => {
        if (isMounted && json.success && json.data) {
          setBroadcast(json.data);
        } else if (isMounted) {
          setBroadcast(null);
        }
      })
      .catch(err => console.error('Failed to fetch staff broadcast:', err));

    return () => {
      isMounted = false;
    };
  }, [currentProperty?.id]);

  // Subscribe to real-time broadcast events
  useEffect(() => {
    const unsubBroadcast = subscribe('STAFF_BROADCAST', (payload: BroadcastNotice) => {
      if (payload && payload.propertyId === currentProperty?.id) {
        setBroadcast(payload);
        setDismissedId(null); // Un-dismiss if a fresh notice arrives
      }
    });

    const unsubCleared = subscribe('STAFF_BROADCAST_CLEARED', (payload: { propertyId: string }) => {
      if (payload && payload.propertyId === currentProperty?.id) {
        setBroadcast(null);
      }
    });

    return () => {
      unsubBroadcast();
      unsubCleared();
    };
  }, [subscribe, currentProperty?.id]);

  const handleClearBroadcast = async () => {
    if (!currentProperty?.id) return;
    setIsClearing(true);
    try {
      const res = await fetch(`/api/v1/properties/${currentProperty.id}/broadcast`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setBroadcast(null);
      }
    } catch (e) {
      console.error('Failed to clear broadcast:', e);
    } finally {
      setIsClearing(false);
    }
  };

  if (!broadcast || dismissedId === broadcast.id) {
    return null;
  }

  const isGMOrOwner = currentRole === 'gm' || currentRole === 'owner';

  const priorityStyles = {
    urgent: {
      bar: 'bg-rose-600 text-white shadow-md border-b border-rose-700',
      badge: 'bg-rose-800 text-rose-100 border border-rose-500',
      badgeText: 'EMERGENCY BROADCAST',
      icon: <AlertTriangle className="w-4 h-4 text-white animate-pulse shrink-0" />,
      btnDismiss: 'hover:bg-rose-700 text-rose-200 hover:text-white',
      btnClear: 'bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md transition',
    },
    warning: {
      bar: 'bg-amber-500 text-slate-900 shadow-md border-b border-amber-600',
      badge: 'bg-amber-700 text-amber-100 border border-amber-400',
      badgeText: 'OPERATIONAL ALERT',
      icon: <AlertCircle className="w-4 h-4 text-slate-950 shrink-0" />,
      btnDismiss: 'hover:bg-amber-600/30 text-slate-800 hover:text-slate-950',
      btnClear: 'bg-slate-900/15 hover:bg-slate-900/25 text-slate-950 text-[11px] font-semibold px-2.5 py-1 rounded-md transition',
    },
    info: {
      bar: 'bg-[#4A1D6D] text-white shadow-md border-b border-[#3B1457]',
      badge: 'bg-[#351250] text-purple-200 border border-purple-400/40',
      badgeText: 'STAFF NOTICE',
      icon: <Info className="w-4 h-4 text-purple-200 shrink-0" />,
      btnDismiss: 'hover:bg-[#3B1457] text-purple-200 hover:text-white',
      btnClear: 'bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md transition',
    },
  }[broadcast.priority || 'info'];

  const formattedTime = new Date(broadcast.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <aside aria-label="Staff Broadcast Alert" className={`relative z-20 px-4 py-2.5 flex items-center justify-between gap-4 transition-all duration-300 ${priorityStyles.bar}`}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex items-center gap-2 shrink-0">
          <Radio className="w-3.5 h-3.5 animate-ping text-white opacity-75 hidden sm:inline-block" />
          {priorityStyles.icon}
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${priorityStyles.badge}`}>
            {priorityStyles.badgeText}
          </span>
        </div>

        <div className="flex items-center gap-2.5 min-w-0 text-xs sm:text-sm font-medium leading-tight truncate">
          <span className="truncate">{broadcast.message}</span>
          <span className="opacity-75 text-[11px] shrink-0 hidden md:inline">
            — {broadcast.author} ({formattedTime})
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isGMOrOwner && (
          <button
            onClick={handleClearBroadcast}
            disabled={isClearing}
            className={`${priorityStyles.btnClear} flex items-center gap-1 cursor-pointer`}
            title="End broadcast for all staff screens"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">End Broadcast</span>
          </button>
        )}

        <button
          onClick={() => setDismissedId(broadcast.id)}
          className={`p-1 rounded-md transition cursor-pointer ${priorityStyles.btnDismiss}`}
          title="Dismiss from my screen"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default StaffBroadcastBanner;
