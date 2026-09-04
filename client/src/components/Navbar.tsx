import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import {
  BedDouble,
  CalendarCheck,
  Sparkles,
  ClipboardList,
  Search,
  LogIn,
  LogOut,
  ChevronDown,
  Building2,
  Check,
} from 'lucide-react';
import type { Property, UserRole } from '../types';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    label: 'Guest Booking',
    icon: BedDouble,
    roles: ['guest'],
  },
  {
    path: '/pms',
    label: 'Front Desk',
    icon: CalendarCheck,
    roles: ['front_desk', 'gm', 'owner'],
  },
  {
    path: '/housekeeping',
    label: 'Housekeeping',
    icon: Sparkles,
    roles: ['housekeeping', 'housekeeping_supervisor', 'gm', 'owner'],
  },
  {
    path: '/guests',
    label: 'Guest History',
    icon: ClipboardList,
    roles: ['front_desk', 'gm', 'owner'],
  },
  {
    path: '/lookup',
    label: 'Find Reservation',
    icon: Search,
    roles: ['guest', 'front_desk', 'gm', 'owner'],
  },
];

export const Navbar: React.FC = () => {
  const {
    currentProperty,
    setCurrentProperty,
    properties,
    currentUser,
    currentRole,
    logout,
  } = useAuth();

  const { isConnected } = useWebSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [isPropDropdownOpen, setIsPropDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const propDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (propDropdownRef.current && !propDropdownRef.current.contains(event.target as Node)) {
        setIsPropDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter navigation links strictly for the authenticated user's role
  const visibleNavLinks = NAV_ITEMS.filter((item: NavItem) =>
    item.roles.includes(currentRole)
  );

  const roleBadgeStyles: Record<string, string> = {
    owner: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    gm: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    front_desk: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    housekeeping: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    maintenance: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    revenue_manager: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    guest: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
  };

  const handleSelectProperty = (property: Property) => {
    setCurrentProperty(property);
    setIsPropDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0c1017]/95 backdrop-blur-lg border-b border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Constant Brand Identity + Hotel Selector */}
          <div className="flex items-center gap-3 relative" ref={propDropdownRef}>
            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-md group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#0d121a] rounded-[10px] flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#c5a059"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4.5 h-4.5"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </div>
              <span className="font-heading font-bold text-lg text-white tracking-wide hidden sm:inline">
                LumenStay
              </span>
            </Link>

            <span className="text-slate-700 hidden sm:inline">|</span>

            {/* Hotel Selector Pill */}
            <div className="relative">
              <button
                onClick={() => setIsPropDropdownOpen(!isPropDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 hover:border-amber-500/40 transition group text-left"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-medium text-xs sm:text-sm text-slate-200 group-hover:text-amber-300 transition truncate max-w-[160px] sm:max-w-[200px]">
                  {currentProperty?.name || 'Select Hotel'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 ${
                    isPropDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Options */}
              {isPropDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-[#101622] border border-slate-700/90 rounded-2xl shadow-2xl py-2 z-50 animate-scaleUp">
                  <div className="px-3.5 py-2 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Switch Hotel Property
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">6 Locations</span>
                  </div>
                  <div className="py-1 max-h-72 overflow-y-auto">
                    {properties.map((prop) => {
                      const isSelected = prop.id === currentProperty?.id;
                      return (
                        <button
                          key={prop.id}
                          onClick={() => handleSelectProperty(prop)}
                          className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between transition hover:bg-slate-800/60 ${
                            isSelected ? 'bg-amber-500/10 text-amber-300' : 'text-slate-200'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-semibold">{prop.name}</p>
                            <p className="text-[11px] text-slate-400">
                              {prop.city}, {prop.state} • {prop.totalRooms} Rooms
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Dynamic Role-Filtered Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {visibleNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="hidden md:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Live Connection Dot & User Account */}
          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 hidden lg:flex"
              title={isConnected ? 'Live Real-Time WebSocket Connected' : 'Connecting...'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-[10px] font-medium tracking-wide">
                {isConnected ? 'LIVE' : 'SYNCING'}
              </span>
            </div>

            {/* User Account / Profile */}
            {currentUser ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:border-slate-600 transition group"
                >
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover border border-white/10"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold text-white leading-none group-hover:text-amber-300 transition">
                      {currentUser.name}
                    </p>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border inline-block mt-0.5 ${
                        roleBadgeStyles[currentRole] || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {currentRole}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Account Dropdown */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#111722] border border-slate-700/90 rounded-2xl shadow-2xl py-2 z-50 animate-scaleUp">
                    <div className="px-4 py-2.5 border-b border-slate-800">
                      <p className="text-xs font-bold text-white">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        navigate('/login');
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs text-slate-300 hover:text-amber-300 hover:bg-slate-800/60 flex items-center gap-2 transition"
                    >
                      <LogIn className="w-4 h-4 text-amber-400" /> Switch Account
                    </button>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
