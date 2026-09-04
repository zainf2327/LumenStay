import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { ShieldCheck, Building2, UserCircle2, Wifi, WifiOff, LogIn } from 'lucide-react';
import type { UserRole } from '../types';

export const QuickSwitcherBar: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    currentRole,
    currentProperty,
    properties,
    setCurrentProperty,
  } = useAuth();

  const { isConnected } = useWebSocket();

  const roleLabels: Record<UserRole, { label: string; bg: string }> = {
    owner: { label: 'Owner / Executive', bg: 'bg-purple-950/80 text-purple-200 border-purple-700/50' },
    gm: { label: 'General Manager', bg: 'bg-emerald-950/80 text-emerald-200 border-emerald-700/50' },
    front_desk: { label: 'Front Desk Lead', bg: 'bg-amber-950/80 text-amber-200 border-amber-700/50' },
    housekeeping_supervisor: { label: 'Housekeeping Supervisor', bg: 'bg-teal-950/80 text-teal-200 border-teal-700/50' },
    housekeeping: { label: 'Housekeeping (ES/EN)', bg: 'bg-cyan-950/80 text-cyan-200 border-cyan-700/50' },
    maintenance: { label: 'Maintenance Engineer', bg: 'bg-orange-950/80 text-orange-200 border-orange-700/50' },
    revenue_manager: { label: 'Revenue & Pricing', bg: 'bg-rose-950/80 text-rose-200 border-rose-700/50' },
    guest: { label: 'Guest Traveler', bg: 'bg-blue-950/80 text-blue-200 border-blue-700/50' },
  };

  const activeRoleBadge = roleLabels[currentRole] || roleLabels.guest;

  return (
    <div className="bg-[#080b0f] border-b border-slate-800 text-xs py-1.5 px-4 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand Badge & Active Hotel Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="uppercase tracking-widest text-[10px] font-semibold text-amber-400">
              LumenStay Multi-Property
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

          {/* Hotel Property Selector */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 hidden sm:inline">Active Hotel:</span>
            <select
              value={currentProperty?.id || ''}
              onChange={(e) => {
                const selected = properties.find(p => p.id === e.target.value);
                if (selected) setCurrentProperty(selected);
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2.5 py-0.5 text-xs text-amber-200 focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city}, {p.state} • {p.totalRooms} rms)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Authenticated User Status & WebSocket Indicator */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-slate-300">
                <UserCircle2 className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-white">{currentUser.name}</span>
              </div>
              <button
                onClick={() => navigate('/login')}
                className={`px-2.5 py-0.5 rounded-full border text-[10px] font-medium transition hover:brightness-125 flex items-center gap-1 ${activeRoleBadge.bg}`}
              >
                <ShieldCheck className="w-3 h-3 inline" />
                {activeRoleBadge.label}
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>
          )}

          {/* WebSocket Live Status */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 pl-2 border-l border-slate-800 hidden sm:flex">
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Live WS</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-500/80" />
                <span className="text-slate-400">Polling</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
