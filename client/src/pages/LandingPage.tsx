import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { GuestNavbar } from '../components/GuestNavbar';
import { BrandFooter } from '../components/BrandFooter';
import { LumenStayMark } from '../components/LumenStayLogo';
import { BookingSearchBar } from '../components/BookingSearchBar';
import { PropertyGrid } from '../components/PropertyGrid';
import { RoomCard } from '../components/RoomCard';
import type { RoomType, RatePlan } from '../types';
import {
  MapPin,
  ShieldCheck,
  Compass,
  Loader2,
  ArrowRight,
  Search,
  Sun,
  Flame,
  Wind,
  Quote,
} from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';

export const LandingPage: React.FC = () => {
  const { currentProperty, properties, setCurrentPropertyId } = useAuth();
  const { subscribe } = useWebSocket();
  const navigate = useNavigate();

  // Search parameters
  const [checkInDate, setCheckInDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [checkOutDate, setCheckOutDate] = useState<string>(format(addDays(new Date(), 2), 'yyyy-MM-dd'));
  const [adultCount, setAdultCount] = useState<number>(2);
  const [childCount, setChildCount] = useState<number>(0);
  const [promoCode, setPromoCode] = useState<string>('');

  // Results state
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [totalNights, setTotalNights] = useState<number>(2);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Lookup state
  const [lookupCode, setLookupCode] = useState('');

  const fetchAvailability = useCallback(async () => {
    if (!currentProperty?.id) return;
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        propertyId: currentProperty.id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: adultCount.toString(),
        children: childCount.toString(),
      });
      if (promoCode.trim()) {
        queryParams.append('promoCode', promoCode.trim());
      }

      const res = await fetch(`/api/v1/availability?${queryParams.toString()}`).then((r) => r.json());
      if (res.success && res.data) {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.results)
          ? res.data.results
          : [];
        setSearchResults(list);
      } else {
        setSearchResults([]);
      }

      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      setTotalNights(nights);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentProperty?.id, checkInDate, checkOutDate, adultCount, childCount, promoCode]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Real-time synchronization
  useEffect(() => {
    const handleInventoryChange = (payload: any) => {
      if (!payload?.propertyId || payload.propertyId === currentProperty?.id) {
        fetchAvailability();
      }
    };

    const unsubCreate = subscribe('RESERVATION_CREATED', handleInventoryChange);
    const unsubCancel = subscribe('RESERVATION_CANCELLED', handleInventoryChange);
    const unsubReassign = subscribe('ROOM_REASSIGNED', handleInventoryChange);
    const unsubStatus = subscribe('ROOM_STATUS_CHANGED', handleInventoryChange);

    return () => {
      unsubCreate();
      unsubCancel();
      unsubReassign();
      unsubStatus();
    };
  }, [currentProperty?.id, fetchAvailability, subscribe]);

  const handleBook = (roomType: RoomType, ratePlan: RatePlan, pricing: any) => {
    navigate('/checkout', {
      state: {
        property: currentProperty,
        roomType,
        ratePlan,
        pricing,
        checkInDate,
        checkOutDate,
        adults: adultCount,
        children: childCount,
        totalNights,
      },
    });
  };

  const handleSelectPropertyAndScroll = (propId: string) => {
    setCurrentPropertyId(propId);
    setTimeout(() => {
      const elem = document.getElementById('accommodations');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEE, MMM d');
    } catch {
      return dateStr;
    }
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupCode.trim()) return;
    navigate(`/lookup?code=${encodeURIComponent(lookupCode.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] selection:bg-[#C5A059]/20 selection:text-[#0F172A] font-sans antialiased flex flex-col">
      {/* 1. Modern Frosted Top Navigation Bar */}
      <GuestNavbar />

      {/* 2. Full-Bleed Cinematic Hero Section */}
      <section className="relative min-h-[640px] sm:min-h-[700px] flex items-center justify-center overflow-hidden bg-[#0F172A]">
        {/* Background Image */}
        <img
          src={
            currentProperty?.heroImage ||
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=80'
          }
          alt={currentProperty?.name || 'LumenStay Luxury Hotel'}
          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.48] scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Soft Modern Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-black/30 to-black/50 pointer-events-none" />

        {/* Hero Content Narrative */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-12 pb-24">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase text-white/95 bg-white/10 backdrop-blur-md border border-white/20 shadow-sm">
            <LumenStayMark size={18} framed={false} className="shrink-0" />
            <span>LumenStay Boutique Sanctuaries</span>
            <span className="text-white/40">•</span>
            <span>Est. 2026</span>
          </div>

          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-heading font-extrabold !text-white tracking-tight leading-[1.08] drop-shadow-md"
            style={{ color: '#FFFFFF' }}
          >
            Architectural Sanctuaries Crafted for Stillness & Light.
          </h1>

          <p
            className="text-base sm:text-lg !text-white/90 font-normal max-w-2xl mx-auto leading-relaxed drop-shadow-sm"
            style={{ color: 'rgba(255, 255, 255, 0.9)' }}
          >
            Intimate boutique retreats tucked across the American West. Experience handcrafted hospitality, clean architectural design, and serene natural terrain.
          </p>

          {/* Active Lodge Badge */}
          <div className="pt-2 flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs text-white">
              <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="font-semibold">{currentProperty?.name}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/80">{currentProperty?.city}, {currentProperty?.state}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Floating Horizontal Architectural Search Console */}
      <div className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20">
        <BookingSearchBar
          currentProperty={currentProperty}
          properties={properties}
          onSelectProperty={setCurrentPropertyId}
          checkInDate={checkInDate}
          onCheckInDateChange={setCheckInDate}
          checkOutDate={checkOutDate}
          onCheckOutDateChange={setCheckOutDate}
          adultCount={adultCount}
          onAdultCountChange={setAdultCount}
          childCount={childCount}
          onChildCountChange={setChildCount}
          promoCode={promoCode}
          onPromoCodeChange={setPromoCode}
          onSearch={fetchAvailability}
          isLoading={isLoading}
        />
      </div>

      {/* 4. Portfolio Showcase: 6 Handcrafted Lodges */}
      <PropertyGrid onSelectPropertyAndScroll={handleSelectPropertyAndScroll} />

      {/* 5. Live Accommodations & Available Suites Section */}
      <section id="accommodations" className="py-20 bg-white border-y border-[#E5E7EB] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-[#0F172A]/5 text-[#0F172A]">
                <span>{currentProperty?.name}</span>
                <span>•</span>
                <span>{currentProperty?.city}, {currentProperty?.state}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-[#0F172A] tracking-tight">
                Available Suites & Accommodations
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Live availability for <span className="font-bold text-[#0F172A]">{totalNights} {totalNights === 1 ? 'Night' : 'Nights'}</span> ({formatDisplayDate(checkInDate)} → {formatDisplayDate(checkOutDate)})
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#047857] bg-[#ECFDF5] px-4 py-2 rounded-full border border-[#A7F3D0] self-start md:self-auto">
              <ShieldCheck className="w-4 h-4 text-[#047857]" />
              <span>Best Direct Rate Guarantee</span>
            </div>
          </div>

          {/* Suites List */}
          {isLoading ? (
            <div className="py-24 text-center space-y-4">
              <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-[#64748B] tracking-wide">
                Checking live suite availability at {currentProperty?.name}...
              </p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-8">
              {searchResults.map((item) => (
                <RoomCard
                  key={item.roomType.id}
                  roomType={item.roomType}
                  availableCount={item.availableCount}
                  nightlyRates={item.nightlyRates}
                  totalNights={totalNights}
                  onBook={handleBook}
                />
              ))}
            </div>
          ) : (
            <div className="editorial-card p-14 text-center rounded-3xl space-y-4 bg-[#F8F9FA] border border-[#E5E7EB]">
              <Compass className="w-10 h-10 text-[#64748B] mx-auto" />
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-heading font-bold text-xl text-[#0F172A]">
                  No Available Suites for Selected Dates
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  All suites at {currentProperty?.name} are currently reserved for these dates. Try selecting alternative dates in the search console above or discover one of our other five boutique lodges.
                </p>
              </div>
              <button
                onClick={() => {
                  const elem = document.getElementById('destinations');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                }}
                className="astra-btn-primary px-6 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Browse Other Sanctuaries</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 6. Architectural Philosophy & Experience Pillars */}
      <section id="philosophy" className="py-24 bg-[#F8F9FA] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#C5A059]">
              The LumenStay Ethos
            </span>
            <h2 className="text-3xl sm:text-5xl font-heading font-extrabold text-[#0F172A] tracking-tight">
              Hospitality Rooted in Quiet Materiality & Place
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed">
              We reject the friction of corporate hotel chains. LumenStay properties are intentionally compact, architecturally pure, and intimately connected to the geology of their landscapes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="editorial-card rounded-3xl p-8 bg-white border border-[#E5E7EB] space-y-4 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center">
                <Sun className="w-6 h-6 text-[#C5A059]" />
              </div>
              <h3 className="font-heading font-bold text-xl text-[#0F172A]">
                Natural Light & Form
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Every suite is oriented towards morning sunrise or alpine sunset. Large-format glazed glass, hand-hewn timbers, and mineral plaster walls welcome natural light throughout the seasons.
              </p>
            </div>

            <div className="editorial-card rounded-3xl p-8 bg-white border border-[#E5E7EB] space-y-4 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center">
                <Flame className="w-6 h-6 text-[#C5A059]" />
              </div>
              <h3 className="font-heading font-bold text-xl text-[#0F172A]">
                Unhurried Hospitality
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                No lines at a crowded lobby desk. Effortless digital room access, fireside apéritifs, curated trail guides, and bespoke private dining arranged at your leisure.
              </p>
            </div>

            <div className="editorial-card rounded-3xl p-8 bg-white border border-[#E5E7EB] space-y-4 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center">
                <Wind className="w-6 h-6 text-[#C5A059]" />
              </div>
              <h3 className="font-heading font-bold text-xl text-[#0F172A]">
                Terrain Stewardship
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                We operate with minimal ecological impact. Carbon-neutral heating, certified dark-sky night preserves, locally harvested farm partnerships, and Tesla charging at every property.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Press Accolades & Guest Praise */}
      <section className="py-20 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#94A3B8]">
              Critical Praise
            </span>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[#0F172A]">
              Recognized Across the Hospitality Vanguard
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-4 flex flex-col justify-between">
              <Quote className="w-8 h-8 text-[#C5A059]/40" />
              <p className="text-sm font-medium text-[#1E293B] italic leading-relaxed">
                "The new benchmark for American quiet luxury. Intimate, restorative, and architecturally breathtaking."
              </p>
              <div className="pt-2 border-t border-[#E5E7EB]">
                <p className="text-xs font-bold text-[#0F172A]">Architectural Digest</p>
                <p className="text-[10px] text-[#64748B]">Sanctuary Design Feature</p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-4 flex flex-col justify-between">
              <Quote className="w-8 h-8 text-[#C5A059]/40" />
              <p className="text-sm font-medium text-[#1E293B] italic leading-relaxed">
                "LumenStay redefines what a boutique mountain retreat should feel like—effortless, deeply human, and completely free from noise."
              </p>
              <div className="pt-2 border-t border-[#E5E7EB]">
                <p className="text-xs font-bold text-[#0F172A]">Condé Nast Traveler</p>
                <p className="text-[10px] text-[#64748B]">Gold List 2026</p>
              </div>
            </div>

            <div className="p-8 rounded-3xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-4 flex flex-col justify-between">
              <Quote className="w-8 h-8 text-[#C5A059]/40" />
              <p className="text-sm font-medium text-[#1E293B] italic leading-relaxed">
                "From the cedar saunas to the private stargazing decks, each sanctuary feels like a bespoke private residence."
              </p>
              <div className="pt-2 border-t border-[#E5E7EB]">
                <p className="text-xs font-bold text-[#0F172A]">Wallpaper* Magazine</p>
                <p className="text-[10px] text-[#64748B]">Boutique Hotels Review</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Direct Reservation Lookup Console */}
      <section id="lookup" className="py-20 bg-[#F8F9FA] scroll-mt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="editorial-card rounded-3xl p-8 sm:p-12 bg-white border border-[#E5E7EB] shadow-sm text-center space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center mx-auto shadow-sm">
              <Search className="w-5 h-5 text-[#C5A059]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-heading font-bold text-[#0F172A]">
                Manage Your Existing Reservation
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
                Check in online, review your folio voucher, request suite enhancements, or adjust your dates.
              </p>
            </div>

            <form onSubmit={handleLookupSubmit} className="max-w-md mx-auto space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  value={lookupCode}
                  onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                  placeholder="Enter confirmation code (e.g. RES-1001)"
                  className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059] uppercase tracking-wider"
                  required
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto astra-btn-primary px-6 py-3 rounded-xl text-xs font-bold tracking-wide shrink-0 cursor-pointer"
                >
                  Lookup
                </button>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Lost your confirmation code? Please check your booking confirmation email.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* 9. Minimalist Luxury Footer */}
      <BrandFooter />
    </div>
  );
};

export default LandingPage;
