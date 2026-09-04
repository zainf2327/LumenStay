import React, { useState } from 'react';
import type { RoomType, RatePlan } from '../types';
import { Users, Bed, Maximize, ArrowRight, Coffee, ShieldCheck } from 'lucide-react';

interface NightlyRateOption {
  ratePlan: RatePlan;
  calculatedNightlyPrice: number;
  calculatedTotalPrice: number;
  taxAmount: number;
  resortFee: number;
  grandTotal: number;
}

interface RoomCardProps {
  roomType: RoomType;
  availableCount: number;
  nightlyRates: NightlyRateOption[];
  totalNights: number;
  onBook: (roomType: RoomType, ratePlan: RatePlan, pricing: any) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  roomType,
  availableCount,
  nightlyRates,
  totalNights,
  onBook,
}) => {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const isSoldOut = availableCount <= 0;
  const isLowInventory = availableCount > 0 && availableCount <= 3;

  const images =
    roomType.images && roomType.images.length > 0
      ? roomType.images
      : ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'];

  return (
    <div className="editorial-card rounded-3xl overflow-hidden border border-[#E5E7EB] hover:border-[#D1D5DB] transition-all duration-300 shadow-sm flex flex-col lg:flex-row group bg-white font-sans">
      {/* Left: Architectural Photography (44% width on Desktop) */}
      <div className="lg:w-[44%] relative min-h-[300px] sm:min-h-[360px] overflow-hidden bg-slate-100">
        <img
          src={images[activeImageIdx]}
          alt={roomType.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-white/90 backdrop-blur-md text-[#0F172A] border border-white/40 shadow-xs">
            {roomType.code}
          </span>

          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide backdrop-blur-md border shadow-xs flex items-center gap-1.5 ${
              isSoldOut
                ? 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]'
                : isLowInventory
                ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                : 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSoldOut ? 'bg-[#BE123C]' : isLowInventory ? 'bg-[#B45309]' : 'bg-[#047857]'
              }`}
            />
            {isSoldOut ? 'Sold Out' : isLowInventory ? `Only ${availableCount} Left` : `${availableCount} Available`}
          </span>
        </div>

        {/* Multi-Photo Carousel Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIdx(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeImageIdx ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white'
                }`}
                aria-label={`View photo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right: Suite Narrative, Specs & Rate Plans */}
      <div className="lg:w-[56%] p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white">
        {/* Suite Details & Specs */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-2xl font-bold text-[#0F172A] tracking-tight">
                {roomType.name}
              </h3>
            </div>
            <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
              {roomType.description}
            </p>
          </div>

          {/* Key Architectural Specs Row */}
          <div className="flex flex-wrap gap-2 text-xs text-[#334155]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <Users className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="font-medium">Up to {roomType.capacityAdults + roomType.capacityChildren} guests</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <Bed className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="font-medium">{roomType.bedConfiguration}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB]">
              <Maximize className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="font-medium">{roomType.sizeSqFt} sq ft</span>
            </div>
          </div>
        </div>

        {/* Rate Plans & Pricing Selection */}
        <div className="space-y-3 pt-4 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Available Rate Options
            </p>
            <span className="text-[11px] font-semibold text-[#047857] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Direct Booking Perk
            </span>
          </div>

          <div className="space-y-2.5">
            {nightlyRates.map((opt) => (
              <div
                key={opt.ratePlan.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-[#E5E7EB] bg-[#FAF8F5]/50 hover:bg-white hover:border-[#C5A059] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group/rate"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#0F172A]">
                      {opt.ratePlan.name}
                    </span>
                    {opt.ratePlan.includesBreakfast && (
                      <span className="text-[10px] font-bold text-[#047857] px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center gap-1">
                        <Coffee className="w-3 h-3" /> Breakfast Included
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B]">
                    {opt.ratePlan.cancellationPolicy}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
                  <div className="text-left sm:text-right">
                    <div className="text-base font-heading font-extrabold text-[#0F172A]">
                      ${opt.calculatedNightlyPrice}
                      <span className="text-xs font-normal text-[#64748B]"> / night</span>
                    </div>
                    {totalNights > 1 && (
                      <div className="text-[11px] text-[#64748B]">
                        ${opt.calculatedTotalPrice} total ({totalNights} nights)
                      </div>
                    )}
                  </div>

                  <button
                    disabled={isSoldOut}
                    onClick={() => onBook(roomType, opt.ratePlan, opt)}
                    className="astra-btn-primary py-2.5 px-5 rounded-full text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>Reserve</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
