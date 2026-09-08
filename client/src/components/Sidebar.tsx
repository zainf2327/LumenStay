import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LumenStayLogo, LumenStayMark } from './LumenStayLogo';
import {
  BedDouble,
  Search,
  LogIn,
  LogOut,
  ChevronDown,
  Building2,
  Check,
  X,
  Brush,
  ShieldCheck,
  Key,
  TrendingUp,
  Wrench,
  Sparkles,
  Users,
  Layers,
  UserPlus,
  AlertTriangle,
  Calendar,
  Tag,
  Receipt,
} from 'lucide-react';
import type { Property, UserRole } from '../types';

interface RoleTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface RoleConfig {
  basePath: string;
  title: string;
  defaultTab: string;
  tabs: RoleTab[];
  allowedRoles: UserRole[];
}

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  guest: {
    basePath: '/guest',
    title: 'Guest Member Portal',
    defaultTab: 'search',
    allowedRoles: ['guest', 'gm', 'owner'],
    tabs: [
      { id: 'search', label: 'Book a Sanctuary', icon: Sparkles },
      { id: 'stays', label: 'My Stays & Mobile Key', icon: Key },
      { id: 'lookup', label: 'Lookup Reservation', icon: Search },
    ],
  },
  front_desk: {
    basePath: '/frontdesk',
    title: 'Front Desk Hub',
    defaultTab: 'arrivals',
    allowedRoles: ['front_desk', 'gm', 'owner'],
    tabs: [
      { id: 'arrivals', label: "Today's Arrivals", icon: Key },
      { id: 'inhouse', label: 'In-House Stays', icon: Users },
      { id: 'departures', label: 'Departures', icon: LogOut },
      { id: 'status', label: 'Suite Status Matrix', icon: Layers },
      { id: 'walkin', label: 'Walk-In Registration', icon: UserPlus },
    ],
  },
  housekeeping: {
    basePath: '/housekeeper',
    title: 'Housekeeping Hub',
    defaultTab: 'queue',
    allowedRoles: ['housekeeping', 'housekeeping_supervisor', 'gm', 'owner'],
    tabs: [
      { id: 'queue', label: 'Cleaning Queue', icon: Brush },
      { id: 'status', label: 'Suite Status Overview', icon: Layers },
      { id: 'defect', label: 'Report Defect', icon: Wrench },
    ],
  },
  housekeeping_supervisor: {
    basePath: '/supervisor',
    title: 'Supervisor Hub',
    defaultTab: 'inspection',
    allowedRoles: ['housekeeping_supervisor', 'gm', 'owner'],
    tabs: [
      { id: 'inspection', label: 'Inspection Queue', icon: ShieldCheck },
      { id: 'matrix', label: 'Suite Condition Board', icon: Layers },
      { id: 'tasks', label: 'Attendant Shift Roster', icon: Users },
    ],
  },
  gm: {
    basePath: '/gm',
    title: 'GM Executive Hub',
    defaultTab: 'kpis',
    allowedRoles: ['gm', 'owner'],
    tabs: [
      { id: 'kpis', label: 'Executive KPIs', icon: TrendingUp },
      { id: 'operations', label: 'Front Desk Flow', icon: Key },
      { id: 'rooms', label: 'Room Health', icon: Layers },
      { id: 'crm', label: 'Guest VIP CRM', icon: Users },
      { id: 'staff', label: 'Staff & Team', icon: UserPlus },
    ],
  },
  owner: {
    basePath: '/owner',
    title: 'Ownership Portfolio',
    defaultTab: 'portfolio',
    allowedRoles: ['owner'],
    tabs: [
      { id: 'portfolio', label: 'Properties Portfolio', icon: Building2 },
      { id: 'analytics', label: 'Yield & ADR Analytics', icon: TrendingUp },
      { id: 'ledger', label: 'Ledger & Folio Audit', icon: Receipt },
      { id: 'staff', label: 'Staff & Governance', icon: Users },
    ],
  },
  maintenance: {
    basePath: '/maintenance',
    title: 'Maintenance Hub',
    defaultTab: 'tickets',
    allowedRoles: ['maintenance', 'gm', 'owner'],
    tabs: [
      { id: 'tickets', label: 'Work Order Tickets', icon: Wrench },
      { id: 'ooo', label: 'Out of Order Suites', icon: AlertTriangle },
      { id: 'schedule', label: 'Preventative Schedule', icon: Calendar },
    ],
  },
  revenue_manager: {
    basePath: '/revenue',
    title: 'Revenue Strategy Hub',
    defaultTab: 'yield',
    allowedRoles: ['revenue_manager', 'gm', 'owner'],
    tabs: [
      { id: 'yield', label: 'Yield & ADR Optimization', icon: TrendingUp },
      { id: 'rates', label: 'Rate Plans & Channels', icon: Tag },
      { id: 'forecast', label: '90-Day Pacing Forecast', icon: Calendar },
    ],
  },
};

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onMobileClose,
}) => {
  const {
    currentProperty,
    setCurrentProperty,
    properties,
    currentUser,
    currentRole,
    logout,
  } = useAuth();

  const location = useLocation();
  const [isPropDropdownOpen, setIsPropDropdownOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const propDropdownRef = useRef<HTMLDivElement>(null);

  // Full width when hovered on desktop or when mobile drawer is open
  const isExpanded = isMobileOpen || isHovered;

  // Close hotel dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (propDropdownRef.current && !propDropdownRef.current.contains(event.target as Node)) {
        setIsPropDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [searchParams] = useSearchParams();

  // Find the role config that matches current path (e.g. /guest, /frontdesk),
  // fallback to user's assigned role config, fallback to guest
  const activeRoleConfig =
    Object.values(ROLE_CONFIGS).find((cfg) => location.pathname === cfg.basePath) ||
    ROLE_CONFIGS[currentRole] ||
    ROLE_CONFIGS.guest;

  const currentTab = searchParams.get('tab') || activeRoleConfig.defaultTab;

  // Find other modules that this user has permission to access (e.g. GM, Owner)
  const otherAccessibleModules = Object.values(ROLE_CONFIGS).filter(
    (cfg) => cfg.basePath !== activeRoleConfig.basePath && cfg.allowedRoles.includes(currentRole)
  );

  const roleLabels: Record<string, string> = {
    owner: 'Ownership',
    gm: 'General Manager',
    front_desk: 'Front Desk Operations',
    housekeeping_supervisor: 'HK Supervisor',
    housekeeping: 'Room Attendant',
    maintenance: 'Lead Engineer',
    revenue_manager: 'Revenue Director',
    guest: 'Guest',
  };

  const handleSelectProperty = (property: Property) => {
    setCurrentProperty(property);
    setIsPropDropdownOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container with Hover Expansion */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPropDropdownOpen(false);
        }}
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-[#E5E7EB] transition-[width,transform,box-shadow] duration-300 ease-in-out font-sans overflow-x-hidden no-scrollbar ${isExpanded ? 'w-[270px] shadow-2xl ring-1 ring-black/5' : 'w-[76px] shadow-xs'
          } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        {/* Top: Brand Wordmark Header */}
        <div className={`h-16 flex items-center border-b border-[#E5E7EB] shrink-0 bg-white transition-all duration-300 ${isExpanded ? 'px-5 justify-between' : 'px-0 justify-center'
          }`}>
          <Link to="/" className="flex items-center overflow-hidden group">
            {isExpanded ? (
              <LumenStayLogo
                size="sm"
                theme="dark"
                showWordmark={true}
                subtitle="Operations PMS"
              />
            ) : (
              <LumenStayMark size={32} />
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onMobileClose}
            className="lg:hidden text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Property Selector Widget */}
        <div className="p-3 border-b border-[#E5E7EB] relative" ref={propDropdownRef}>
          {(() => {
            const isPropertyFixed = currentRole !== 'owner' && currentRole !== 'guest';

            if (isPropertyFixed) {
              return !isExpanded ? (
                <div
                  title={`${currentProperty?.name} (Assigned Property)`}
                  className="w-10 h-10 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#64748B] cursor-default mx-auto"
                >
                  <Building2 className="w-4 h-4 text-[#C5A059]" />
                </div>
              ) : (
                <div className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E5E7EB]">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-[#94A3B8] mb-1.5">
                    <span>Property</span>
                    <span className="text-[9px] font-semibold text-[#0F172A] px-2 py-0.5 rounded-full bg-white border border-[#E5E7EB] shadow-2xs">
                      Assigned Hotel
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-[#C5A059] shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-[#0F172A] truncate leading-none">
                        {currentProperty?.name || 'Birchwood Manor'}
                      </p>
                      <p className="text-[10px] text-[#64748B] truncate mt-0.5">
                        {currentProperty?.city}, {currentProperty?.state}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <>
                {!isExpanded ? (
                  <button
                    onClick={() => setIsPropDropdownOpen(!isPropDropdownOpen)}
                    title={currentProperty?.name}
                    className="w-10 h-10 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] hover:border-[#CBD5E1] flex items-center justify-center text-[#0F172A] transition cursor-pointer mx-auto shadow-2xs"
                  >
                    <Building2 className="w-4 h-4 text-[#C5A059]" />
                  </button>
                ) : (
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-wider text-[#94A3B8] mb-1 px-1">
                      Active Hotel
                    </label>
                    <button
                      onClick={() => setIsPropDropdownOpen(!isPropDropdownOpen)}
                      className="w-full px-3 py-2 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#E5E7EB] hover:border-[#CBD5E1] flex items-center justify-between transition text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Building2 className="w-4 h-4 text-[#C5A059] shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-[#0F172A] truncate leading-none">
                            {currentProperty?.name || 'Select Property'}
                          </p>
                          <p className="text-[10px] text-[#64748B] truncate mt-0.5">
                            {currentProperty?.city}, {currentProperty?.state}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-[#64748B] transition-transform shrink-0 ${isPropDropdownOpen ? 'rotate-180' : ''
                          }`}
                      />
                    </button>
                  </div>
                )}

                {/* Property Dropdown Menu */}
                {isPropDropdownOpen && (
                  <div className="absolute top-full left-3 right-3 mt-1.5 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-1.5 z-50 animate-fadeIn">
                    <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold border-b border-[#F1F5F9] mb-1">
                      Portfolio Lodges
                    </p>
                    {properties.map((prop) => (
                      <button
                        key={prop.id}
                        onClick={() => handleSelectProperty(prop)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs rounded-xl transition cursor-pointer ${currentProperty?.id === prop.id
                            ? 'bg-[#0F172A] font-semibold text-white'
                            : 'text-[#334155] hover:bg-[#F8F9FA]'
                          }`}
                      >
                        <div className="truncate">
                          <p className="truncate leading-none font-semibold">{prop.name}</p>
                          <p className={`text-[10px] mt-0.5 ${currentProperty?.id === prop.id ? 'text-slate-300' : 'text-[#64748B]'}`}>
                            {prop.city}, {prop.state} • {prop.totalRooms} rooms
                          </p>
                        </div>
                        {currentProperty?.id === prop.id && (
                          <Check className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Navigation Links - no visible scrollbar */}
        <nav className="flex-1 p-3 space-y-4 overflow-y-auto no-scrollbar">
          {/* 1. Primary Active Role Tabs */}
          <div className="space-y-1">
            {isExpanded && (
              <p className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-[#94A3B8] truncate">
                {activeRoleConfig.title}
              </p>
            )}

            {activeRoleConfig.tabs.map((tab) => {
              const Icon = tab.icon;
              const isTabActive =
                location.pathname === activeRoleConfig.basePath && currentTab === tab.id;

              return (
                <Link
                  key={tab.id}
                  to={`${activeRoleConfig.basePath}?tab=${tab.id}`}
                  title={!isExpanded ? tab.label : undefined}
                  className={`flex items-center rounded-xl text-xs font-medium transition-all ${
                    isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center w-10 h-10 mx-auto'
                  } ${
                    isTabActive
                      ? 'bg-[#0F172A] text-white font-semibold shadow-xs'
                      : 'text-[#475569] hover:bg-[#F8F9FA] hover:text-[#0F172A]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isTabActive ? 'text-[#C5A059]' : 'text-[#64748B]'}`} />
                  {isExpanded && <span className="truncate">{tab.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* 2. Public Direct Booking Link (for Guest) */}
          {currentRole === 'guest' && (
            <div className="pt-3 border-t border-[#E5E7EB] space-y-1">
              {isExpanded && (
                <p className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-[#94A3B8] truncate">
                  Public Experience
                </p>
              )}
              <Link
                to="/"
                title={!isExpanded ? 'Explore Sanctuaries' : undefined}
                className={`flex items-center rounded-xl text-xs font-medium text-[#475569] hover:bg-[#F8F9FA] hover:text-[#0F172A] transition-all ${
                  isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center w-10 h-10 mx-auto'
                }`}
              >
                <BedDouble className="w-4 h-4 shrink-0 text-[#64748B]" />
                {isExpanded && <span>Explore Sanctuaries</span>}
              </Link>
              <Link
                to="/lookup"
                title={!isExpanded ? 'Find Reservation' : undefined}
                className={`flex items-center rounded-xl text-xs font-medium text-[#475569] hover:bg-[#F8F9FA] hover:text-[#0F172A] transition-all ${
                  isExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center w-10 h-10 mx-auto'
                }`}
              >
                <Search className="w-4 h-4 shrink-0 text-[#64748B]" />
                {isExpanded && <span>Find Reservation</span>}
              </Link>
            </div>
          )}

          {/* 3. Other Accessible Operations Modules (for GM, Owner, Supervisor, etc.) */}
          {otherAccessibleModules.length > 0 && (
            <div className="pt-3 border-t border-[#E5E7EB] space-y-1">
              {isExpanded && (
                <p className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-[#94A3B8] truncate">
                  Other Modules
                </p>
              )}
              {otherAccessibleModules.map((module) => {
                const FirstTabIcon = module.tabs[0]?.icon || Layers;
                return (
                  <Link
                    key={module.basePath}
                    to={`${module.basePath}?tab=${module.defaultTab}`}
                    title={!isExpanded ? module.title : undefined}
                    className={`flex items-center rounded-xl text-xs font-medium text-[#475569] hover:bg-[#F8F9FA] hover:text-[#0F172A] transition-all ${
                      isExpanded ? 'gap-3 px-3 py-2' : 'justify-center w-10 h-10 mx-auto'
                    }`}
                  >
                    <FirstTabIcon className="w-3.5 h-3.5 shrink-0 text-[#64748B]" />
                    {isExpanded && <span className="truncate">{module.title}</span>}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* User Account / Footer Card */}
        <div className={`p-3 border-t border-[#E5E7EB] bg-white transition-all duration-300 ${isExpanded ? '' : 'flex flex-col items-center px-2'}`}>
          {currentUser ? (
            <div className={`flex items-center justify-between w-full ${!isExpanded ? 'flex-col gap-2' : ''}`}>
              {isExpanded && (
                <div className="truncate pr-2">
                  <p className="text-xs font-bold text-[#0F172A] truncate leading-none">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-[#64748B] truncate mt-1">
                    {roleLabels[currentUser.role] || currentUser.role}
                  </p>
                </div>
              )}
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl text-[#64748B] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              title={!isExpanded ? 'Sign In' : undefined}
              className={`rounded-xl astra-btn-primary text-xs font-semibold flex items-center justify-center cursor-pointer transition-all ${
                isExpanded ? 'w-full py-2.5 px-3 gap-2' : 'w-10 h-10 p-0'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              {isExpanded && <span>Sign In</span>}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
