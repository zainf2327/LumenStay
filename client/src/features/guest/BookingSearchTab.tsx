import React from 'react';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BookingSearchTabProps {
  currentProperty?: any;
}

export const BookingSearchTab: React.FC<BookingSearchTabProps> = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="editorial-card rounded-2xl bg-[#1C1815] text-[#F7F4EE] p-8 sm:p-12 relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#B08D57]/20 text-[#D8BC84] border border-[#B08D57]/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Guaranteed Best Direct Rate & Loyalty Upgrades</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight">
            Reserve Your Next Historic Sanctuary
          </h2>
          <p className="text-sm text-[#A69E95] leading-relaxed">
            Experience curated mountain lodges, heritage wood-burning fireplaces, custom Italian linens, and contactless Salto BLE digital room keys.
          </p>

          <button
            type="button"
            onClick={() => navigate('/search')}
            className="mt-4 px-6 py-3 rounded-lg bg-[#B08D57] hover:bg-[#8C621E] text-white font-medium text-xs inline-flex items-center gap-2 transition cursor-pointer shadow-md"
          >
            <Search className="w-4 h-4" />
            <span>Browse Available Suites & Dates</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSearchTab;
