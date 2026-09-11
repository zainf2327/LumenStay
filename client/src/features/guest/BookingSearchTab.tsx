import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Sparkles,
  Calendar,
  Users,
  Building2,
  ArrowRight,
  Loader2,
  BedDouble,
  ShieldCheck,
  Flame,
  Bath,
  Eye,
} from 'lucide-react';
import type { Property, RoomType } from '../../types';

interface BookingSearchTabProps {
  currentProperty?: Property | null;
}

export const BookingSearchTab: React.FC<BookingSearchTabProps> = ({ currentProperty: propFromParent }) => {
  const navigate = useNavigate();
  const { properties, currentProperty: authProp } = useAuth();
  const property = propFromParent || authProp || properties[0];

  // Default dates: tomorrow to 3 days later
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(property?.id || 'prop_birchwood');
  const [checkInDate, setCheckInDate] = useState<string>(tomorrow.toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState<string>(threeDaysLater.toISOString().split('T')[0]);
  const [adultCount, setAdultCount] = useState<number>(2);
  const [childCount, setChildCount] = useState<number>(0);

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalNights, setTotalNights] = useState<number>(2);

  const activeProperty = properties.find((p) => p.id === selectedPropertyId) || property;

  const fetchSuites = useCallback(async () => {
    if (!selectedPropertyId) return;
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        propertyId: selectedPropertyId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: adultCount.toString(),
        children: childCount.toString(),
      });

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
      console.error('Failed to fetch availability:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedPropertyId, checkInDate, checkOutDate, adultCount, childCount]);

  useEffect(() => {
    fetchSuites();
  }, [fetchSuites]);

  const handleBookSuite = (roomType: RoomType, ratePlan: any, pricing: any) => {
    navigate('/checkout', {
      state: {
        property: activeProperty,
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

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Member Booking Console Header & Perks */}
      <div className="editorial-card rounded-2xl bg-white border border-[#E9E5EE] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E9E5EE]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F3EDF8] text-[#4A1D6D] border border-[#E2D4F0] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LumenStay Direct Member Console • 10% Elite Privilege Included</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#1E1627] tracking-tight">
              Reserve Your Next Sanctuary Stay
            </h2>
            <p className="text-xs text-[#6E6678] mt-1 font-normal">
              Exclusive member rates, guaranteed room allocation, priority room placement, and instant contactless digital key.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-[#FAF9FC] border border-[#E9E5EE] text-xs font-semibold text-[#1E1627] flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#4A1D6D]" /> Best Rate Guarantee
            </span>
          </div>
        </div>

        {/* Search Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Lodge Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6E6678] mb-1.5">
              Sanctuary Lodge
            </label>
            <div className="relative">
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE] text-xs font-semibold text-[#1E1627] focus:outline-hidden focus:border-[#4A1D6D] transition cursor-pointer"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.city}, {p.state})
                  </option>
                ))}
              </select>
              <Building2 className="w-4 h-4 text-[#4A1D6D] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Check-In Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6E6678] mb-1.5">
              Check-In Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE] text-xs font-semibold text-[#1E1627] focus:outline-hidden focus:border-[#4A1D6D] transition"
              />
              <Calendar className="w-4 h-4 text-[#4A1D6D] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Check-Out Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6E6678] mb-1.5">
              Check-Out Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE] text-xs font-semibold text-[#1E1627] focus:outline-hidden focus:border-[#4A1D6D] transition"
              />
              <Calendar className="w-4 h-4 text-[#4A1D6D] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Guests Count & Action */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6E6678] mb-1.5">
              Guests
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={adultCount}
                  onChange={(e) => setAdultCount(Number(e.target.value))}
                  className="w-full pl-8 pr-1 py-2.5 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE] text-xs font-semibold text-[#1E1627] focus:outline-hidden focus:border-[#4A1D6D] transition cursor-pointer"
                >
                  <option value={1}>1 Adult</option>
                  <option value={2}>2 Adults</option>
                  <option value={3}>3 Adults</option>
                  <option value={4}>4 Adults</option>
                  <option value={6}>6 Adults</option>
                </select>
                <Users className="w-3.5 h-3.5 text-[#4A1D6D] absolute left-2.5 top-3 pointer-events-none" />
              </div>
              <div className="relative w-24">
                <select
                  value={childCount}
                  onChange={(e) => setChildCount(Number(e.target.value))}
                  className="w-full px-2 py-2.5 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE] text-xs font-semibold text-[#1E1627] focus:outline-hidden focus:border-[#4A1D6D] transition cursor-pointer"
                >
                  <option value={0}>0 Kids</option>
                  <option value={1}>1 Kid</option>
                  <option value={2}>2 Kids</option>
                  <option value={3}>3 Kids</option>
                </select>
              </div>
              <button
                type="button"
                onClick={fetchSuites}
                disabled={loading}
                className="px-3.5 py-2.5 rounded-xl bg-[#4A1D6D] hover:bg-[#3B1457] text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Search className="w-4 h-4 text-white" />}
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Live Available Suites Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-heading font-bold text-[#1E1627]">
            Available Accommodations at {activeProperty?.name}
          </h3>
          <span className="text-xs text-[#6E6678]">
            {loading ? 'Searching live inventory...' : `${searchResults.length} Suites Available • ${totalNights} Nights`}
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-[#E9E5EE] space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#4A1D6D] mx-auto" />
            <p className="text-xs font-semibold text-[#6E6678]">Querying live suite inventory and member pricing...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-[#E9E5EE] space-y-3">
            <BedDouble className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold text-[#1E1627]">No suites available for these specific dates</h4>
            <p className="text-xs text-[#6E6678] max-w-md mx-auto">
              Try adjusting your check-in dates or selecting a different lodge destination in the dropdown above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((item: any) => {
              const roomType: RoomType = item.roomType;
              const ratePlan = item.ratePlans?.[0] || { id: 'rp_bar', name: 'Best Available Rate' };
              const publicRate = item.pricing?.nightlyPrice || roomType.basePrice || 350;
              const memberRate = Math.round(publicRate * 0.9);
              const totalMemberStay = memberRate * totalNights;

              return (
                <div
                  key={roomType.id}
                  className="editorial-card rounded-2xl bg-white border border-[#E9E5EE] overflow-hidden flex flex-col justify-between transition hover:shadow-md hover:border-[#D4C5E3] group"
                >
                  {/* Room Thumbnail & Badges */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    <img
                      src={
                        roomType.images?.[0] ||
                        'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={roomType.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1E1627]/80 text-white backdrop-blur-md border border-white/20">
                        Alpine Sanctuary
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#4A1D6D] text-white shadow-sm">
                        10% Member Rate
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="text-lg font-heading font-bold text-[#1E1627] leading-tight">
                        {roomType.name}
                      </h4>
                      <p className="text-xs text-[#6E6678] line-clamp-2 leading-relaxed">
                        {roomType.description ||
                          'Architecturally crafted sanctuary with Italian linens, fireplace, and private nature terrace.'}
                      </p>

                      {/* Amenities Pills */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#FAF9FC] border border-[#E9E5EE] text-[#6E6678]">
                          <BedDouble className="w-3 h-3 text-[#4A1D6D]" /> {roomType.bedConfiguration || 'King Bed'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#FAF9FC] border border-[#E9E5EE] text-[#6E6678]">
                          <Flame className="w-3 h-3 text-[#4A1D6D]" /> Fireplace
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#FAF9FC] border border-[#E9E5EE] text-[#6E6678]">
                          <Bath className="w-3 h-3 text-[#4A1D6D]" /> Soaking Tub
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#FAF9FC] border border-[#E9E5EE] text-[#6E6678]">
                          <Eye className="w-3 h-3 text-[#4A1D6D]" /> Mountain View
                        </span>
                      </div>
                    </div>

                    {/* Pricing & CTA */}
                    <div className="pt-4 border-t border-[#E9E5EE] flex items-end justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs line-through text-[#6E6678]">${publicRate}</span>
                          <span className="text-xl font-heading font-extrabold text-[#1E1627]">${memberRate}</span>
                          <span className="text-[11px] text-[#6E6678]">/ nt</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                          Total ${totalMemberStay} for {totalNights} nts (Save ${(publicRate - memberRate) * totalNights})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleBookSuite(roomType, ratePlan, {
                            nightlyPrice: memberRate,
                            totalPrice: totalMemberStay,
                          })
                        }
                        className="px-4 py-2 rounded-xl bg-[#4A1D6D] hover:bg-[#3B1457] text-white font-semibold text-xs transition cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <span>Reserve</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSearchTab;
