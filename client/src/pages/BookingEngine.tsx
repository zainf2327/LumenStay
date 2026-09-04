import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';
import { RoomCard } from '../components/RoomCard';
import { BookingSearchBar } from '../components/BookingSearchBar';
import type { RoomType, RatePlan } from '../types';
import {
  MapPin,
  Phone,
  Mail, 
  ShieldCheck,
  Compass,
  Loader2,
} from 'lucide-react';
import { format, addDays, parseISO } from 'date-fns';

export const BookingEngine: React.FC = () => {
  const { currentProperty, properties, setCurrentPropertyId } = useAuth();
  const { subscribe } = useWebSocket();

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

  const fetchAvailability = React.useCallback(async () => {
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

  const navigate = useNavigate();

  const handleOpenDrawer = (roomType: RoomType, ratePlan: RatePlan, pricing: any) => {
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

  const formatDisplayDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEE, MMM d');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen pb-24 text-[#1C1815] bg-[#F7F4EE] font-sans selection:bg-[#B08D57]/20 selection:text-[#1C1815]">
      {/* 1. Cinematic Hero Section */}
      <div className="relative min-h-[440px] sm:min-h-[480px] flex items-center justify-center overflow-hidden bg-[#1C1815]">
        <img
          src={currentProperty?.heroImage}
          alt={currentProperty?.name}
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.55] scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/40 pointer-events-none" />

        {/* Hero Narrative */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center space-y-3.5 pt-12 pb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-white/90 bg-white/10 backdrop-blur-md border border-white/20">
            <span>{currentProperty?.city}, {currentProperty?.state}</span>
            <span>•</span>
            <span>{currentProperty?.totalRooms} Suites</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-serif font-normal text-white tracking-tight drop-shadow-sm">
            {currentProperty?.name}
          </h1>

          <p className="text-sm sm:text-base text-white/90 font-light max-w-xl mx-auto leading-relaxed drop-shadow-sm">
            {currentProperty?.description}
          </p>

          {/* Property Contact Info */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-white/80 pt-1">
            <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/15 backdrop-blur-md">
              <MapPin className="w-3.5 h-3.5 text-[#f3e5ab]" />
              <span>{currentProperty?.address}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/15 backdrop-blur-md">
              <Phone className="w-3.5 h-3.5 text-[#f3e5ab]" />
              <span>{currentProperty?.phone}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/15 backdrop-blur-md">
              <Mail className="w-3.5 h-3.5 text-[#f3e5ab]" />
              <span>{currentProperty?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Floating Search Console */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 relative z-20">
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

      {/* 3. Available Accommodations Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-14 space-y-6">
        {/* Section Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-3 border-b border-[#E2DCD2]">
          <div>
            <h2 className="text-2xl font-serif font-normal text-[#1C1815] tracking-tight">
              Available Accommodations
            </h2>
            <p className="text-xs text-[#736B63] mt-0.5">
              Showing real-time rates for <span className="font-semibold text-[#1C1815]">{totalNights} {totalNights === 1 ? 'night' : 'nights'}</span> ({formatDisplayDate(checkInDate)} → {formatDisplayDate(checkOutDate)})
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#236446] font-medium bg-[#EBF4EF] px-3 py-1 rounded-full border border-[#C8E3D4]">
            <ShieldCheck className="w-3.5 h-3.5" /> Best Direct Booking Guarantee
          </div>
        </div>

        {/* Suites Showcase Feed */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-6 h-6 text-[#B08D57] animate-spin mx-auto" />
            <p className="text-xs text-[#736B63]">Checking live suite inventory for {currentProperty?.name}...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-6">
            {searchResults.map((item) => (
              <RoomCard
                key={item.roomType.id}
                roomType={item.roomType}
                availableCount={item.availableCount}
                nightlyRates={item.nightlyRates}
                totalNights={totalNights}
                onBook={handleOpenDrawer}
              />
            ))}
          </div>
        ) : (
          <div className="editorial-card p-12 text-center rounded-2xl space-y-3 bg-white border border-[#DDD7CD]">
            <Compass className="w-8 h-8 text-[#736B63] mx-auto" />
            <div className="space-y-1">
              <h3 className="font-serif text-lg text-[#1C1815]">No Suites Available for Selected Dates</h3>
              <p className="text-xs text-[#736B63] max-w-md mx-auto">
                All accommodations at {currentProperty?.name} are currently reserved for these dates. Try adjusting your dates or select another lodge in our portfolio above.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingEngine;
