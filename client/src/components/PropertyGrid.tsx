import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, ArrowRight, Check, Sparkles, BedDouble } from 'lucide-react';

interface PropertyGridProps {
  onSelectPropertyAndScroll?: (propertyId: string) => void;
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({ onSelectPropertyAndScroll }) => {
  const { properties, currentProperty, setCurrentPropertyId } = useAuth();

  const handleSelect = (propertyId: string) => {
    setCurrentPropertyId(propertyId);
    if (onSelectPropertyAndScroll) {
      onSelectPropertyAndScroll(propertyId);
    } else {
      const elem = document.getElementById('accommodations');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <section id="destinations" className="py-20 bg-[#F8F9FA] scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E7EB] pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-[#0F172A]/5 text-[#0F172A] border border-[#0F172A]/10">
              <Sparkles className="w-3 h-3 text-[#C5A059]" />
              Portfolio Collection
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-[#0F172A] tracking-tight">
              Our Architectural Sanctuaries
            </h2>
            <p className="text-sm text-[#64748B] max-w-2xl leading-relaxed">
              Six handpicked boutique lodges shaped by their natural terrain, quiet luxury principles, and timeless materiality.
            </p>
          </div>

          <div className="text-xs font-semibold text-[#64748B]">
            Showing <span className="text-[#0F172A] font-bold">{properties.length} Destinations</span> across Colorado & Utah
          </div>
        </div>

        {/* 6-Property Architectural Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((lodge) => {
            const isSelected = currentProperty?.id === lodge.id;

            return (
              <div
                key={lodge.id}
                className={`editorial-card rounded-3xl overflow-hidden flex flex-col group transition-all duration-300 ${
                  isSelected
                    ? 'ring-2 ring-[#0F172A] shadow-xl'
                    : 'hover:shadow-xl hover:-translate-y-1'
                }`}
              >
                {/* Visual Imagery Canvas */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  <img
                    src={lodge.heroImage}
                    alt={lodge.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md text-white border border-white/20">
                      {lodge.brandTheme?.mood || 'Boutique Sanctuary'}
                    </span>

                    {isSelected && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C5A059] text-white flex items-center gap-1 shadow-md">
                        <Check className="w-3 h-3" /> Active Lodge
                      </span>
                    )}
                  </div>

                  {/* Bottom Image Details */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center gap-1.5 text-xs text-white/90">
                      <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>{lodge.city}, {lodge.state}</span>
                    </div>
                  </div>
                </div>

                {/* Narrative Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-6 bg-white">
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-heading font-bold text-xl text-[#0F172A] group-hover:text-[#C5A059] transition-colors">
                        {lodge.name}
                      </h3>
                      <span className="text-xs font-semibold text-[#64748B] shrink-0 flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-[#94A3B8]" />
                        {lodge.totalRooms} Suites
                      </span>
                    </div>

                    <p className="text-xs text-[#64748B] leading-relaxed line-clamp-2">
                      {lodge.description}
                    </p>

                    {/* Curated Amenity Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {lodge.amenities.slice(0, 3).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
                        >
                          {amenity}
                        </span>
                      ))}
                      {lodge.amenities.length > 3 && (
                        <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-[#F8F9FA] text-[#94A3B8]">
                          +{lodge.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#94A3B8] block">
                        Direct Direct Rate
                      </span>
                      <span className="text-xs font-semibold text-[#0F172A]">
                        Best Rate Guaranteed
                      </span>
                    </div>

                    <button
                      onClick={() => handleSelect(lodge.id)}
                      className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F172A] text-white shadow-xs'
                          : 'bg-[#F1F5F9] text-[#0F172A] hover:bg-[#0F172A] hover:text-white'
                      }`}
                    >
                      <span>{isSelected ? 'View Suites' : 'Explore & Book'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
