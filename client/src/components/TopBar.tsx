import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePropertyTheme } from '../context/PropertyThemeContext';
import { useWebSocket } from '../context/WebSocketContext';
import { Menu, Building2 } from 'lucide-react';

interface TopBarProps {
  onMobileMenuOpen: () => void;
}

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Direct Guest Booking', subtitle: 'Live Suite Availability & Instant Reservations' },
  '/pms': { title: 'Front Desk Operations', subtitle: 'Room Turnover, Arrivals & Folio Ledger' },
  '/housekeeping': { title: 'Housekeeping Operations', subtitle: 'Turnover Matrix, Room Inspections & Linen Prep' },
  '/guests': { title: 'Guest CRM & Stay History', subtitle: 'VIP Profiles, Preferences & Past Visits' },
  '/lookup': { title: 'Reservation Self-Service', subtitle: 'Search, Manage & Print Stay Itineraries' },
};

export const TopBar: React.FC<TopBarProps> = ({ onMobileMenuOpen }) => {
  const { currentProperty } = useAuth();
  const { activePropertyTheme } = usePropertyTheme();
  const { isConnected } = useWebSocket();
  const location = useLocation();

  const routeInfo = ROUTE_TITLES[location.pathname] || {
    title: 'LumenStay Platform',
    subtitle: 'Hospitality Management',
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-[#E9E5EE] px-4 sm:px-6 flex items-center justify-between transition-all duration-300 shrink-0 font-sans shadow-2xs">
      {/* Left: Mobile Hamburger & Page Context */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden p-2 rounded-lg text-[#6E6678] hover:text-[#4A1D6D] hover:bg-[#F3EDF8] transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-bold text-base sm:text-lg text-[#1E1627] tracking-tight">
              {routeInfo.title}
            </h1>
            <span 
              className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border hidden md:inline-block shadow-2xs"
              style={{
                backgroundColor: activePropertyTheme.heritageBg,
                color: activePropertyTheme.heritageColor,
                borderColor: activePropertyTheme.heritageBorder,
              }}
            >
              {currentProperty?.name}
            </span>
          </div>
          <p className="text-[11px] text-[#6E6678] hidden sm:block leading-none mt-0.5">
            {routeInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Active Hotel & Live Status */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF9FC] border border-[#E9E5EE] text-xs text-[#334155] shadow-2xs">
          <Building2 className="w-3.5 h-3.5 text-[#4A1D6D]" />
          <span className="font-semibold text-[#1E1627]">{currentProperty?.city}, {currentProperty?.state}</span>
          <span className="text-[#CBD5E1]">•</span>
          <span className="text-[#6E6678]">{currentProperty?.totalRooms} Rooms</span>
        </div>

        {/* Live WebSocket Indicator */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9FC] border border-[#E9E5EE] text-[11px] text-[#6E6678] shadow-2xs"
          title={isConnected ? 'Live WebSocket Connected' : 'Syncing...'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="text-[10px] font-semibold tracking-wide text-[#334155]">
            {isConnected ? 'LIVE' : 'SYNCING'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
