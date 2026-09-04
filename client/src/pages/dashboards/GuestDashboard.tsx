import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DigitalKeyModal } from '../../components/DigitalKeyModal';
import { Sparkles, Key, Search, Crown, Compass } from 'lucide-react';

// Modular Feature Tabs
import { BookingSearchTab } from '../../features/guest/BookingSearchTab';
import { GuestStaysTab } from '../../features/guest/GuestStaysTab';
import { ReservationLookupTab } from '../../features/guest/ReservationLookupTab';

export const GuestDashboard: React.FC = () => {
  const { currentUser, currentProperty } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab State driven by URL ?tab= (Default is 'search')
  const validTabs = ['search', 'stays', 'lookup'] as const;
  type GuestTab = typeof validTabs[number];

  const rawTab = searchParams.get('tab') as GuestTab | null;
  const activeTab: GuestTab = rawTab && validTabs.includes(rawTab) ? rawTab : 'search';

  useEffect(() => {
    if (!searchParams.get('tab')) {
      setSearchParams({ tab: 'search' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setActiveTab = (tab: GuestTab) => {
    setSearchParams({ tab });
  };

  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-[#0F172A] bg-[#F8F9FA] font-sans selection:bg-[#C5A059]/20 selection:text-[#0F172A]">
      {/* 1. Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-[#0F172A] bg-white border border-[#E5E7EB] shadow-xs">
            <span>Guest Member Portal</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-bold text-[#C5A059]">
              <Crown className="w-3 h-3 text-[#C5A059]" /> Astra Signature Member
            </span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-[#0F172A] tracking-tight mt-2">
            Welcome back, {currentUser?.name || 'Valued Guest'}
          </h1>
          <p className="text-xs text-[#64748B] mt-1 font-normal">
            Direct reservations, mobile Salto digital room key, and stay itinerary management.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F1F5F9] text-[#0F172A] font-semibold text-xs border border-[#E5E7EB] flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Compass className="w-4 h-4 text-[#64748B]" />
            <span>Explore Sanctuaries</span>
          </button>
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Key className="w-4 h-4 text-[#C5A059]" />
            <span>Mobile Digital Key</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Tabs Ribbon */}
      <div className="p-1.5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-wrap gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'search' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Book a Sanctuary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stays')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'stays' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>My Stays & Mobile Key</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lookup')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'lookup' ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Look Up Reservation</span>
        </button>
      </div>

      {/* 3. Active Tab View */}
      {activeTab === 'search' && (
        <BookingSearchTab currentProperty={currentProperty} />
      )}

      {activeTab === 'stays' && (
        <GuestStaysTab onOpenMobileKey={() => setShowKeyModal(true)} />
      )}

      {activeTab === 'lookup' && (
        <ReservationLookupTab />
      )}

      {/* 4. Digital Key Modal */}
      {showKeyModal && (
        <DigitalKeyModal
          reservationId="res_demo_key"
          roomNumber="204"
          guestName={currentUser?.name || 'Eleanor Vance'}
          propertyName={currentProperty?.name || 'Birchwood Manor'}
          checkInDate="2026-09-02"
          checkOutDate="2026-09-05"
          onClose={() => setShowKeyModal(false)}
        />
      )}
    </div>
  );
};

export default GuestDashboard;
