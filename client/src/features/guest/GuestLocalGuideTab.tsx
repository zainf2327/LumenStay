import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Utensils,
  Mountain,
  Music,
  Camera,
  Sparkles,
  Clock,
  CloudSnow,
  Sun,
  PhoneCall,
  Bell,
  Star,
} from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  category: 'dining' | 'outdoors' | 'culture' | 'scenic';
  tag: string;
  description: string;
  proximity: string;
  insiderTip: string;
  priceRange?: '$$' | '$$$' | '$$$$';
  highlight: string;
  reservationRecommended: boolean;
}

interface PropertyGuide {
  id: string;
  name: string;
  city: string;
  state: string;
  altitude: string;
  weatherTemp: string;
  weatherCondition: string;
  trailStatus: string;
  shuttleStatus: string;
  experiences: Experience[];
}

const DESTINATION_GUIDES: Record<string, PropertyGuide> = {
  prop_birchwood: {
    id: 'prop_birchwood',
    name: 'The Birchwood',
    city: 'Aspen',
    state: 'CO',
    altitude: '7,908 ft',
    weatherTemp: '34°F',
    weatherCondition: 'Powder Flurries',
    trailStatus: '100% Slopes Open • 42" Base',
    shuttleStatus: 'Complimentary Lodge Cadillac Escalade (On Demand)',
    experiences: [
      {
        id: 'asp_1',
        title: 'The Little Nell Private Wine Cellar',
        category: 'dining',
        tag: 'Sommelier Experience',
        description: 'Private candlelit sommelier tasting featuring rare vintage Burgundy and Champagne in Aspen’s famed 20,000-bottle subterranean cellar.',
        proximity: '3 blocks (4 min walk or lodge private driver)',
        insiderTip: 'Mention you are a Lumen Elite member for access to the private collector’s salon.',
        priceRange: '$$$$',
        highlight: 'Forbes 5-Star Wine Program',
        reservationRecommended: true,
      },
      {
        id: 'asp_2',
        title: 'Ajax Mountain Silver Queen Gondola & Ski Valet',
        category: 'outdoors',
        tag: 'Alpine Skiing',
        description: 'Direct slope access with our complimentary ski valet. Boots pre-warmed each morning with direct gondola drop-off.',
        proximity: '2 min lodge private shuttle',
        insiderTip: 'First Tracks program leaves at 8:00 AM before the public lifts open.',
        highlight: 'Premier Alpine Skiing',
        reservationRecommended: false,
      },
      {
        id: 'asp_3',
        title: 'Maroon Bells Sunrise Alpine Expedition',
        category: 'scenic',
        tag: 'Iconic Scenic Vista',
        description: 'Witness the most photographed peaks in North America reflecting on Maroon Lake at daybreak before the daytime visitor shuttles run.',
        proximity: '20 min private scenic drive',
        insiderTip: 'Our kitchen prepares an insulated thermos of artisanal pour-over coffee and fresh brioche for 5:30 AM departures.',
        highlight: 'Glacial Reflection Vistas',
        reservationRecommended: true,
      },
      {
        id: 'asp_4',
        title: 'Belly Up Aspen Intimate Concert Sanctuary',
        category: 'culture',
        tag: 'Live Music & Nightlife',
        description: 'World-renowned 450-capacity intimate venue hosting legendary acoustic sets and international artists.',
        proximity: '5 min walk in downtown Aspen',
        insiderTip: 'Concierge holds reserved elevated booth tickets for select weekend shows.',
        priceRange: '$$$',
        highlight: 'Legendary Intimate Acoustics',
        reservationRecommended: true,
      },
    ],
  },
  prop_copperline: {
    id: 'prop_copperline',
    name: 'Copperline Inn',
    city: 'Breckenridge',
    state: 'CO',
    altitude: '9,600 ft',
    weatherTemp: '31°F',
    weatherCondition: 'Clear Alpine Skies',
    trailStatus: 'Imperial Express Open • Peak 8 Live',
    shuttleStatus: 'Breckenridge Ski Express (Every 15 mins)',
    experiences: [
      {
        id: 'brk_1',
        title: 'Briar Rose Chophouse & Historic Saloon',
        category: 'dining',
        tag: 'Heritage Chophouse',
        description: 'Breckenridge institution with preserved 1800s tin ceilings, serving aged Colorado elk medallions and heritage beef.',
        proximity: 'Walking distance (Main St.)',
        insiderTip: 'The back saloon serves the full dinner menu with half the wait time and local craft spirits.',
        priceRange: '$$$',
        highlight: 'Authentic 1890s Mining Saloon',
        reservationRecommended: true,
      },
      {
        id: 'brk_2',
        title: 'Imperial Express SuperChair (Peak 8)',
        category: 'outdoors',
        tag: 'Extreme Terrain',
        description: 'Ride the highest chairlift in North America up to 12,840 feet for high-alpine bowl skiing above the tree line.',
        proximity: '8 min scenic shuttle to Peak 8 base',
        insiderTip: 'Ski Imperial Bowl down into Whale’s Tail for untouched wind-blown snow.',
        highlight: 'Highest Lift in North America',
        reservationRecommended: false,
      },
      {
        id: 'brk_3',
        title: 'Continental Divide Fat Bike & Snowshoe Trail',
        category: 'outdoors',
        tag: 'Nordic Adventure',
        description: 'Groomed pine forest singletrack along the Continental Divide trail network with mountain views of the Tenmile Range.',
        proximity: '5 min lodge shuttle to Gold Run Nordic Center',
        insiderTip: 'Complimentary lodge Nordic passes available at the Front Desk concierge.',
        highlight: 'Tenmile Range Panorama',
        reservationRecommended: false,
      },
    ],
  },
  prop_wren: {
    id: 'prop_wren',
    name: 'The Wren House',
    city: 'Telluride',
    state: 'CO',
    altitude: '8,750 ft',
    weatherTemp: '36°F',
    weatherCondition: 'Sunny Alpine Air',
    trailStatus: 'Plunge & Gold Hill Open',
    shuttleStatus: 'Free Telluride Gondola (Connected to Lodge)',
    experiences: [
      {
        id: 'tel_1',
        title: 'Allred’s Panoramic Mountain Crest Restaurant',
        category: 'dining',
        tag: 'Fine Mountain Dining',
        description: 'Perched at Station St. Sophia at 10,540 ft, offering floor-to-ceiling views of the Telluride box canyon sunset.',
        proximity: 'Ride the free gondola to the summit station',
        insiderTip: 'Request Window Table 12 at 6:45 PM for the golden hour alpine glow over Ajax Peak.',
        priceRange: '$$$$',
        highlight: '10,540 ft Summit Elevation',
        reservationRecommended: true,
      },
      {
        id: 'tel_2',
        title: 'Bridal Veil Falls & Box Canyon Trail',
        category: 'scenic',
        tag: 'Waterfall Hike',
        description: 'Colorado’s tallest free-falling waterfall at 365 feet, framed by the historic 1907 hydro-electric powerplant perched on the cliff.',
        proximity: '10 min scenic drive to canyon trailhead',
        insiderTip: 'Micro-spikes recommended in spring/fall; lodge concierge stocks gear for guest check-out.',
        highlight: '365 ft Free-Falling Cascade',
        reservationRecommended: false,
      },
      {
        id: 'tel_3',
        title: 'Historic Sheridan Opera House & Vaudeville Hall',
        category: 'culture',
        tag: 'Historic Arts',
        description: 'Built in 1913 for mining tycoons, this crown jewel of Colorado theaters showcases indie film, jazz, and folk artists.',
        proximity: '4 min stroll down Colorado Ave',
        insiderTip: 'Check with our concierge for opening night film festival badge reservations.',
        highlight: '1913 Century Heritage Theater',
        reservationRecommended: true,
      },
    ],
  },
  prop_sundowner: {
    id: 'prop_sundowner',
    name: 'Sundowner Lodge',
    city: 'Park City',
    state: 'UT',
    altitude: '7,000 ft',
    weatherTemp: '38°F',
    weatherCondition: 'Bluebird Mountain Skies',
    trailStatus: 'Jupiter Peak & McConkey’s Open',
    shuttleStatus: 'Historic Main Street Trolley & Private SUV',
    experiences: [
      {
        id: 'pk_1',
        title: 'Riverhorse on Main & Acoustic Loft',
        category: 'dining',
        tag: 'Historic Fine Dining',
        description: 'Park City’s premier four-star culinary destination with live nightly acoustic guitar, macadamia-crusted halibut, and wild game.',
        proximity: 'Historic Main Street (2 blocks)',
        insiderTip: 'The outdoor atrium balcony is heated year-round with fire pits and Main Street views.',
        priceRange: '$$$$',
        highlight: 'Forbes 4-Star Distinction',
        reservationRecommended: true,
      },
      {
        id: 'pk_2',
        title: 'Utah Olympic Park Bobsled Rocket Ride',
        category: 'outdoors',
        tag: 'Olympic Thrill',
        description: 'Experience 5 Gs of centrifugal force alongside a professional bobsled pilot down the 2002 Winter Games sliding track.',
        proximity: '12 min private lodge shuttle',
        insiderTip: 'Summer bobsled runs on wheels, winter uses live ice. Inquire with concierge for pilot bookings.',
        highlight: 'Official Olympic Sliding Track',
        reservationRecommended: true,
      },
      {
        id: 'pk_3',
        title: 'High West Saloon — World’s Only Ski-In Gastro-Distillery',
        category: 'dining',
        tag: 'Artisan Distillery',
        description: 'Ski directly into the Town Lift plaza and step into the Western saloon for craft whiskey flights and camp bacon pretzels.',
        proximity: 'Ski-in via Town Lift run',
        insiderTip: 'Order the Midwinter Night’s Dram reserve pour if available.',
        priceRange: '$$$',
        highlight: 'World’s First Ski-In Saloon',
        reservationRecommended: true,
      },
    ],
  },
  prop_cedar_salt: {
    id: 'prop_cedar_salt',
    name: 'Cedar & Salt',
    city: 'Moab',
    state: 'UT',
    altitude: '4,026 ft',
    weatherTemp: '68°F',
    weatherCondition: 'Crisp Desert Starlight',
    trailStatus: 'Arches & Canyonlands Trails Dry & Clear',
    shuttleStatus: 'Sunrise National Park Shuttle (Departs 5:45 AM)',
    experiences: [
      {
        id: 'moab_1',
        title: 'Delicate Arch Stargazing & Milky Way Expedition',
        category: 'scenic',
        tag: 'Dark Sky Reserve',
        description: 'Hike under the guidance of our naturalist guide into the slickrock sandstone amphitheater for unpolluted views of the Milky Way.',
        proximity: '25 min drive into Arches National Park',
        insiderTip: 'Lodge provides high-powered red-light headlamps and astrophotography tripods upon request.',
        highlight: 'Certified International Dark Sky',
        reservationRecommended: true,
      },
      {
        id: 'moab_2',
        title: 'Desert Bistro & Red Rock Courtyard',
        category: 'dining',
        tag: 'Southwestern Fine Dining',
        description: 'Gourmet French-Southwestern fusion set inside a historic stone home featuring grilled Utah elk chop and blackberry port reduction.',
        proximity: '4 min walk from lodge',
        insiderTip: 'Dine under the outdoor cottonwood trees on the garden patio with house-infused tequila.',
        priceRange: '$$$',
        highlight: 'Artisanal Desert Cuisine',
        reservationRecommended: true,
      },
      {
        id: 'moab_3',
        title: 'Hell’s Revenge Slickrock 4x4 Expedition',
        category: 'outdoors',
        tag: 'Desert Adventure',
        description: 'Navigate steep petrified dunes and narrow sandstone fins overlooking the Colorado River in custom expedition vehicles.',
        proximity: '10 min drive to Sand Flats Recreation Area',
        insiderTip: 'Opt for the sunset departure when the red rock canyons glow deep crimson.',
        highlight: 'Iconic Petrified Sand Dunes',
        reservationRecommended: true,
      },
    ],
  },
  prop_ledger: {
    id: 'prop_ledger',
    name: 'The Ledger',
    city: 'Salt Lake City',
    state: 'UT',
    altitude: '4,226 ft',
    weatherTemp: '55°F',
    weatherCondition: 'Clear Urban Sunset',
    trailStatus: 'Wasatch Mountain Foothill Trails Open',
    shuttleStatus: 'Downtown Light Rail & Airport Executive SUV',
    experiences: [
      {
        id: 'slc_1',
        title: 'Valter’s Osteria Tuscan Fine Dining',
        category: 'dining',
        tag: 'Legendary Tuscan Dining',
        description: 'Beloved white-tablecloth temple of authentic Tuscan fare, featuring Valter’s multi-course pasta sampler and tableside zabaglione.',
        proximity: '5 min walk from The Ledger',
        insiderTip: 'Reservations release 30 days in advance; our front desk maintains a house table for in-house guests.',
        priceRange: '$$$$',
        highlight: 'Acclaimed Tableside Service',
        reservationRecommended: true,
      },
      {
        id: 'slc_2',
        title: 'Big Cottonwood Canyon Scenic Alpine Drive',
        category: 'scenic',
        tag: 'Mountain Escape',
        description: 'Twisting 15-mile glacial canyon climbing to Solitude and Brighton resorts with dramatic quartzite cliffs and alpine lakes.',
        proximity: '25 min drive from downtown Salt Lake City',
        insiderTip: 'Pack walking shoes for the Silver Lake boardwalk loop around the high-alpine beaver ponds.',
        highlight: 'Dramatic Glacial Box Canyon',
        reservationRecommended: false,
      },
      {
        id: 'slc_3',
        title: 'Utah Museum of Contemporary Art & Symphony Hall',
        category: 'culture',
        tag: 'Downtown Culture',
        description: 'Award-winning regional and international modern art installations alongside the acoustic marvel of Maurice Abravanel Hall.',
        proximity: '3 blocks from the hotel',
        insiderTip: 'Complimentary museum passes available for all Lumen Elite members at Front Desk.',
        highlight: 'Acoustic Architectural Marvel',
        reservationRecommended: false,
      },
    ],
  },
};

interface GuestLocalGuideTabProps {
  currentPropertyId?: string;
  onRequestConciergeBooking: (experienceTitle: string, category: string) => void;
}

export const GuestLocalGuideTab: React.FC<GuestLocalGuideTabProps> = ({
  currentPropertyId = 'prop_birchwood',
  onRequestConciergeBooking,
}) => {
  const [selectedPropId, setSelectedPropId] = useState<string>(
    DESTINATION_GUIDES[currentPropertyId] ? currentPropertyId : 'prop_birchwood'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const guide = DESTINATION_GUIDES[selectedPropId] || DESTINATION_GUIDES.prop_birchwood;

  const filteredExperiences = guide.experiences.filter((exp) => {
    if (selectedCategory === 'all') return true;
    return exp.category === selectedCategory;
  });

  const getCategoryIcon = (cat: Experience['category']) => {
    switch (cat) {
      case 'dining':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'outdoors':
        return <Mountain className="w-4 h-4 text-emerald-600" />;
      case 'culture':
        return <Music className="w-4 h-4 text-[#4A1D6D]" />;
      case 'scenic':
      default:
        return <Camera className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Destination Property Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-[#E9E5EE] shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#F3EDF8] text-[#4A1D6D] flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6678] block">
              Curated Destination Sanctuary
            </span>
            <h3 className="font-heading font-extrabold text-lg text-[#1E1627]">
              {guide.name} — {guide.city}, {guide.state}
            </h3>
          </div>
        </div>

        {/* Property Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {Object.values(DESTINATION_GUIDES).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPropId(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedPropId === p.id
                  ? 'bg-[#4A1D6D] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {p.city}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Live Sanctuary & Mountain Conditions Ribbon */}
      <div
        style={{
          background: 'linear-gradient(135deg, #241437 0%, #1A0E28 50%, #11091A 100%)',
          color: '#FFFFFF',
        }}
        className="rounded-3xl p-6 sm:p-7 shadow-xl border border-[#582582]/40 space-y-5 relative overflow-hidden text-white"
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#7B3FA2]/25 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-400/20 pb-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/12 text-purple-200 border border-white/20">
              <CloudSnow className="w-3.5 h-3.5 text-purple-300" />
              <span>Live Sanctuary & Mountain Conditions</span>
            </div>
            <h4 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
              {guide.city} Alpine Weather & Trail Report
            </h4>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-heading font-extrabold text-3xl text-white tracking-tight drop-shadow-xs">
                {guide.weatherTemp}
              </div>
              <div className="text-xs text-purple-200/90 flex items-center justify-end gap-1.5 font-medium mt-0.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> {guide.weatherCondition}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-purple-100 relative z-10">
          <div
            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
            className="p-4 rounded-2xl border border-white/15 backdrop-blur-md"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300 block mb-1">
              Base Elevation
            </span>
            <span className="font-mono font-bold text-base text-white block">{guide.altitude}</span>
            <span className="text-[11px] text-purple-200/80 block mt-1">Alpine Hydration Recommended</span>
          </div>

          <div
            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
            className="p-4 rounded-2xl border border-white/15 backdrop-blur-md"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300 block mb-1">
              Terrain & Slopes
            </span>
            <span className="font-semibold text-sm text-white block">{guide.trailStatus}</span>
            <span className="text-[11px] text-emerald-300 font-semibold block mt-1">Ski Valet Live</span>
          </div>

          <div
            style={{ background: 'rgba(255, 255, 255, 0.08)' }}
            className="p-4 rounded-2xl border border-white/15 backdrop-blur-md"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300 block mb-1">
              Lodge Transit Service
            </span>
            <span className="font-semibold text-sm text-white block">{guide.shuttleStatus}</span>
            <span className="text-[11px] text-purple-200/80 block mt-1">Call Valet (Ext. 0)</span>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'all', label: 'All Curated Experiences' },
            { key: 'dining', label: 'Bespoke Dining & Cellars' },
            { key: 'outdoors', label: 'Skiing & Mountain Trails' },
            { key: 'scenic', label: 'Scenic Vistas & Wellness' },
            { key: 'culture', label: 'Arts & Nightlife' },
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-[#4A1D6D] text-white shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-semibold text-[#6E6678]">
          Showing {filteredExperiences.length} hand-selected sanctuaries
        </span>
      </div>

      {/* 4. Experience Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredExperiences.map((exp) => (
          <div
            key={exp.id}
            className="editorial-card rounded-3xl bg-white border border-[#E9E5EE] p-6 space-y-4 shadow-xs hover:border-[#D4C5E3] transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Top Tags & Category */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {getCategoryIcon(exp.category)}
                    <span>{exp.tag}</span>
                  </span>

                  {exp.priceRange && (
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {exp.priceRange}
                    </span>
                  )}
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                  <Star className="w-3 h-3 text-[#4A1D6D] fill-[#4A1D6D]" /> {exp.highlight}
                </span>
              </div>

              {/* Title & Proximity */}
              <div>
                <h4 className="font-heading text-xl font-bold text-[#1E1627] tracking-tight">
                  {exp.title}
                </h4>
                <p className="text-xs text-[#6E6678] flex items-center gap-1.5 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#4A1D6D]" /> {exp.proximity}
                </p>
              </div>

              {/* Description */}
              <p className="text-xs text-[#4A4353] leading-relaxed">
                {exp.description}
              </p>

              {/* Insider Curator Note */}
              <div className="p-3.5 rounded-2xl bg-[#F3EDF8]/50 border border-[#E2D4F0] text-xs space-y-1">
                <div className="flex items-center gap-1 text-[#4A1D6D] font-bold text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>Curator’s Tribal Note</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {exp.insiderTip}
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#E9E5EE] flex items-center justify-between gap-3">
              <span className="text-[11px] text-[#6E6678] flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {exp.reservationRecommended ? 'Concierge Reservation Recommended' : 'Direct Walk-In Welcome'}
              </span>

              <button
                type="button"
                onClick={() => onRequestConciergeBooking(exp.title, exp.category)}
                className="px-4 py-2 rounded-xl bg-[#4A1D6D] hover:bg-[#3B1457] text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0"
              >
                <Bell className="w-3.5 h-3.5 text-purple-200" />
                <span>Book via Concierge</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Custom Destination Request Banner */}
      <div className="p-6 rounded-3xl bg-white border border-[#E9E5EE] flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <h4 className="font-heading font-extrabold text-base text-[#1E1627]">
            Seeking a Bespoke Mountain Itinerary or Helicopter Charter?
          </h4>
          <p className="text-xs text-[#6E6678] max-w-xl">
            Our Head Concierge maintains exclusive relationships with regional ski instructors, private aircraft charters, and secluded fly-fishing guides across Colorado and Utah.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRequestConciergeBooking('Custom Mountain Itinerary / Guide', 'dining')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
        >
          <PhoneCall className="w-4 h-4 text-purple-300" />
          <span>Dispatch Custom Request</span>
        </button>
      </div>
    </div>
  );
};
