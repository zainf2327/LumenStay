import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  MapPin,
  Calendar,
  Users,
  Search,
  Loader2,
  X,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import type { Property } from '../types';
import { DateRangePicker } from './DateRangePicker';

interface BookingSearchBarProps {
  currentProperty: Property | null;
  properties: Property[];
  onSelectProperty: (propertyId: string) => void;
  checkInDate: string;
  onCheckInDateChange: (date: string) => void;
  checkOutDate: string;
  onCheckOutDateChange: (date: string) => void;
  adultCount: number;
  onAdultCountChange: (count: number) => void;
  childCount: number;
  onChildCountChange: (count: number) => void;
  promoCode: string;
  onPromoCodeChange: (code: string) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export const BookingSearchBar: React.FC<BookingSearchBarProps> = ({
  currentProperty,
  properties,
  onSelectProperty,
  checkInDate,
  onCheckInDateChange,
  checkOutDate,
  onCheckOutDateChange,
  adultCount,
  onAdultCountChange,
  childCount,
  onChildCountChange,
  promoCode,
  onPromoCodeChange,
  onSearch,
  isLoading = false,
}) => {
  const [isHotelDropdownOpen, setIsHotelDropdownOpen] = useState(false);
  const [isGuestsDropdownOpen, setIsGuestsDropdownOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const hotelDropdownRef = useRef<HTMLDivElement>(null);
  const guestsDropdownRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (hotelDropdownRef.current && !hotelDropdownRef.current.contains(e.target as Node)) {
        setIsHotelDropdownOpen(false);
      }
      if (guestsDropdownRef.current && !guestsDropdownRef.current.contains(e.target as Node)) {
        setIsGuestsDropdownOpen(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const formatDisplayDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const nightsCount = (() => {
    try {
      if (!checkInDate || !checkOutDate) return 1;
      const start = parseISO(checkInDate);
      const end = parseISO(checkOutDate);
      return Math.max(1, differenceInDays(end, start));
    } catch {
      return 1;
    }
  })();

  const handleDatesSelected = (inDate: string, outDate: string) => {
    onCheckInDateChange(inDate);
    onCheckOutDateChange(outDate);
    setIsDatePickerOpen(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto font-sans">
      {/* Floating Horizontal Architectural Console Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl lg:rounded-full border border-[#E5E7EB] shadow-xl p-2 sm:p-2.5 flex flex-col lg:flex-row items-stretch lg:items-center divide-y lg:divide-y-0 lg:divide-x divide-[#F1F5F9] transition-all">

        {/* 1. Destination Segment */}
        <div ref={hotelDropdownRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => {
              setIsHotelDropdownOpen(!isHotelDropdownOpen);
              setIsGuestsDropdownOpen(false);
              setIsDatePickerOpen(false);
            }}
            className="w-full text-left px-4 py-3 rounded-xl lg:rounded-full hover:bg-[#F8F9FA] transition flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-[#E5E7EB]">
                {currentProperty?.heroImage ? (
                  <img
                    src={currentProperty.heroImage}
                    alt={currentProperty.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <MapPin className="w-5 h-5 m-2.5 text-[#C5A059]" />
                )}
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                  Destination
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                  {currentProperty?.name || 'Select Sanctuary'}
                </p>
                <p className="text-[11px] text-[#64748B] truncate">
                  {currentProperty ? `${currentProperty.city}, ${currentProperty.state}` : 'Explore our 6 lodges'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0 group-hover:text-[#0F172A] transition" />
          </button>

          {/* Destination Dropdown Popover */}
          {isHotelDropdownOpen && (
            <div className="absolute left-0 top-full mt-3 w-full sm:w-96 bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl p-3 z-50 animate-fadeIn">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] border-b border-[#F1F5F9]">
                Select Boutique Sanctuary
              </div>
              <div className="mt-2 max-h-80 overflow-y-auto space-y-1.5 pr-1">
                {properties.map((p) => {
                  const isSelected = currentProperty?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectProperty(p.id);
                        setIsHotelDropdownOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F172A] text-white'
                          : 'hover:bg-[#F8F9FA] text-[#0F172A]'
                      }`}
                    >
                      <img
                        src={p.heroImage}
                        alt={p.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold truncate">{p.name}</p>
                          {isSelected && (
                            <span className="text-[10px] bg-[#C5A059] text-white px-2 py-0.5 rounded-full font-semibold">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-[#64748B]'}`}>
                          {p.city}, {p.state} • {p.totalRooms} Suites
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 2. Dates Segment (Check-In & Check-Out) */}
        <div ref={datePickerRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => {
              setIsDatePickerOpen(!isDatePickerOpen);
              setIsHotelDropdownOpen(false);
              setIsGuestsDropdownOpen(false);
            }}
            className="w-full text-left px-4 py-3 rounded-xl lg:rounded-full hover:bg-[#F8F9FA] transition flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-[#C5A059]" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                  Dates & Duration
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                  {formatDisplayDate(checkInDate)} — {formatDisplayDate(checkOutDate)}
                </p>
                <p className="text-[11px] text-[#64748B]">
                  {nightsCount} {nightsCount === 1 ? 'Night' : 'Nights Stay'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0 group-hover:text-[#0F172A] transition" />
          </button>

          {/* Date Range Picker Popover */}
          {isDatePickerOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[320px] sm:w-[640px] bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl p-4 sm:p-6 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#F1F5F9]">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                    Select Travel Dates
                  </h4>
                  <p className="text-[11px] text-[#64748B]">
                    Minimum 1 night stay • Real-time rates guaranteed
                  </p>
                </div>
                <button
                  onClick={() => setIsDatePickerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <DateRangePicker
                checkInDate={checkInDate}
                checkOutDate={checkOutDate}
                onSelectRange={handleDatesSelected}
                onClose={() => setIsDatePickerOpen(false)}
              />
            </div>
          )}
        </div>

        {/* 3. Guests Segment */}
        <div ref={guestsDropdownRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => {
              setIsGuestsDropdownOpen(!isGuestsDropdownOpen);
              setIsHotelDropdownOpen(false);
              setIsDatePickerOpen(false);
            }}
            className="w-full text-left px-4 py-3 rounded-xl lg:rounded-full hover:bg-[#F8F9FA] transition flex items-center justify-between gap-3 group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#C5A059]" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#94A3B8]">
                  Guests
                </span>
                <p className="text-xs sm:text-sm font-bold text-[#0F172A] truncate">
                  {adultCount} {adultCount === 1 ? 'Adult' : 'Adults'}
                  {childCount > 0 ? `, ${childCount} ${childCount === 1 ? 'Child' : 'Children'}` : ''}
                </p>
                <p className="text-[11px] text-[#64748B]">
                  1 Suite
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0 group-hover:text-[#0F172A] transition" />
          </button>

          {/* Guests Selector Popover */}
          {isGuestsDropdownOpen && (
            <div className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl border border-[#E5E7EB] shadow-2xl p-5 z-50 animate-fadeIn space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                  Occupancy
                </h4>
                <button
                  onClick={() => setIsGuestsDropdownOpen(false)}
                  className="text-xs font-semibold text-[#C5A059] hover:underline cursor-pointer"
                >
                  Done
                </button>
              </div>

              {/* Adults Counter */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#0F172A]">Adults</p>
                  <p className="text-[11px] text-[#64748B]">Ages 13 and above</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={adultCount <= 1}
                    onClick={() => onAdultCountChange(Math.max(1, adultCount - 1))}
                    className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center font-bold text-sm text-[#0F172A] hover:bg-[#F8F9FA] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-4 text-center text-xs font-bold text-[#0F172A]">
                    {adultCount}
                  </span>
                  <button
                    type="button"
                    disabled={adultCount >= 6}
                    onClick={() => onAdultCountChange(adultCount + 1)}
                    className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center font-bold text-sm text-[#0F172A] hover:bg-[#F8F9FA] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Children Counter */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#0F172A]">Children</p>
                  <p className="text-[11px] text-[#64748B]">Ages 0 to 12</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={childCount <= 0}
                    onClick={() => onChildCountChange(Math.max(0, childCount - 1))}
                    className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center font-bold text-sm text-[#0F172A] hover:bg-[#F8F9FA] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-4 text-center text-xs font-bold text-[#0F172A]">
                    {childCount}
                  </span>
                  <button
                    type="button"
                    disabled={childCount >= 4}
                    onClick={() => onChildCountChange(childCount + 1)}
                    className="w-8 h-8 rounded-full border border-[#E5E7EB] flex items-center justify-center font-bold text-sm text-[#0F172A] hover:bg-[#F8F9FA] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Promo Code Shortcut Inside Guests Popover */}
              <div className="pt-3 border-t border-[#F1F5F9]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Special Offer / Promo Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => onPromoCodeChange(e.target.value.toUpperCase())}
                    placeholder="e.g. VIPLUMEN"
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059]"
                  />
                  {promoCode && (
                    <button
                      onClick={() => onPromoCodeChange('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Action Button CTA */}
        <div className="p-1 lg:pl-3 shrink-0 flex items-center">
          <button
            type="button"
            onClick={onSearch}
            disabled={isLoading}
            className="w-full lg:w-auto astra-btn-primary px-7 py-3.5 rounded-xl lg:rounded-full text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                <span>Checking...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-[#C5A059]" />
                <span>Check Availability</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
