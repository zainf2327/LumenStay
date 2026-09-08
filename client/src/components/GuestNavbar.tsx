import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  X,
  MapPin,
  ChevronDown,
  User,
  LogOut,
} from 'lucide-react';
import type { UserRole } from '../types';
import { LumenStayLogo } from './LumenStayLogo';

export const GuestNavbar: React.FC = () => {
  const {
    currentRole,
    currentProperty,
    properties,
    setCurrentPropertyId,
    isAuthenticated,
    logout,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const routeForRole = (role: UserRole): string => {
    switch (role) {
      case 'housekeeping':
        return '/housekeeper';
      case 'housekeeping_supervisor':
        return '/supervisor';
      case 'front_desk':
        return '/frontdesk';
      case 'gm':
        return '/gm';
      case 'owner':
        return '/owner';
      case 'maintenance':
        return '/maintenance';
      case 'revenue_manager':
        return '/revenue';
      default:
        return '/guest';
    }
  };

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      return;
    }
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] shadow-xs'
          : 'bg-white/85 backdrop-blur-sm border-b border-[#E5E7EB]/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Identity */}
          <div className="flex items-center gap-8">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center cursor-pointer"
            >
              <LumenStayLogo
                size="md"
                theme="dark"
                showWordmark={true}
                subtitle="Boutique Sanctuaries"
              />
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-7">
              <button
                onClick={() => scrollToSection('destinations')}
                className="text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                Destinations
              </button>
              <button
                onClick={() => scrollToSection('accommodations')}
                className="text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                Suites & Rates
              </button>
              <button
                onClick={() => scrollToSection('philosophy')}
                className="text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                Philosophy
              </button>
              <button
                onClick={() => scrollToSection('lookup')}
                className="text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                My Reservation
              </button>
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Property Quick Selector */}
            <div className="relative">
              <button
                onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#CBD5E1] transition text-xs font-medium text-[#1E293B]"
              >
                <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="max-w-[140px] truncate">{currentProperty?.name || 'Select Lodge'}</span>
                <ChevronDown className="w-3 h-3 text-[#64748B]" />
              </button>

              {isPropertyDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#E5E7EB] shadow-xl p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 text-[11px] font-semibold tracking-wider uppercase text-[#94A3B8] border-b border-[#F1F5F9]">
                    Select Boutique Lodge
                  </div>
                  <div className="py-1 max-h-64 overflow-y-auto space-y-1">
                    {properties.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setCurrentPropertyId(p.id);
                          setIsPropertyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                          currentProperty?.id === p.id
                            ? 'bg-[#0F172A] text-white font-medium'
                            : 'text-[#1E293B] hover:bg-[#F8F9FA]'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className={`text-[10px] ${currentProperty?.id === p.id ? 'text-slate-300' : 'text-[#64748B]'}`}>
                            {p.city}, {p.state}
                          </p>
                        </div>
                        {currentProperty?.id === p.id && (
                          <span className="text-[10px] bg-[#C5A059] text-white px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auth / Profile Actions */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(routeForRole(currentRole))}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0F172A] text-white text-xs font-semibold hover:bg-[#1E293B] transition shadow-xs"
                >
                  <User className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>
                    {currentRole === 'guest'
                      ? 'My Bookings'
                      : `${currentRole.replace('_', ' ').toUpperCase()} PMS`}
                  </span>
                </button>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => scrollToSection('lookup')}
                  className="text-xs font-medium text-[#475569] hover:text-[#0F172A] px-3 py-2 transition cursor-pointer"
                >
                  Lookup Stay
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="astra-btn-primary px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#0F172A] text-white cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E5E7EB] px-4 pt-3 pb-6 space-y-4 animate-fadeIn">
          {/* Active Lodge Tag */}
          <div className="p-3 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB]">
            <p className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-wider mb-1">
              Active Lodge Destination
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A]">{currentProperty?.name}</span>
              <span className="text-[11px] text-[#64748B]">{currentProperty?.city}, {currentProperty?.state}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => scrollToSection('destinations')}
              className="text-left px-3 py-2 text-sm font-medium text-[#1E293B] hover:bg-[#F1F5F9] rounded-xl transition cursor-pointer"
            >
              Destinations Portfolio
            </button>
            <button
              onClick={() => scrollToSection('accommodations')}
              className="text-left px-3 py-2 text-sm font-medium text-[#1E293B] hover:bg-[#F1F5F9] rounded-xl transition cursor-pointer"
            >
              Suites & Live Availability
            </button>
            <button
              onClick={() => scrollToSection('philosophy')}
              className="text-left px-3 py-2 text-sm font-medium text-[#1E293B] hover:bg-[#F1F5F9] rounded-xl transition cursor-pointer"
            >
              Architectural Philosophy
            </button>
            <button
              onClick={() => scrollToSection('lookup')}
              className="text-left px-3 py-2 text-sm font-medium text-[#1E293B] hover:bg-[#F1F5F9] rounded-xl transition cursor-pointer"
            >
              Manage / Lookup Reservation
            </button>
          </div>

          <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
            {isAuthenticated ? (
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate(routeForRole(currentRole));
                  }}
                  className="px-4 py-2.5 bg-[#0F172A] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Go to {currentRole.replace('_', ' ')} Dashboard
                </button>
                <button
                  onClick={logout}
                  className="text-xs font-medium text-[#E11D48] hover:underline cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigate('/login');
                }}
                className="w-full py-3 bg-[#0F172A] text-white text-xs font-bold rounded-xl tracking-wide cursor-pointer"
              >
                Sign In (Guest & Staff Portal)
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
