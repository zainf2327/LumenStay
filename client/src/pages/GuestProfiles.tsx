import React, { useState, useEffect } from 'react';
import type { Guest } from '../types';
import {
  Users,
  Search,
  Award,
  Calendar,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Star,
  Loader2,
} from 'lucide-react';

export const GuestProfiles: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/guests').then((r) => r.json());
      if (res.success && Array.isArray(res.data)) {
        setGuests(res.data);
        if (res.data.length > 0 && !selectedGuest) {
          fetchGuestDetails(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch guests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuestDetails = async (guestId: string) => {
    try {
      const res = await fetch(`/api/v1/guests/${guestId}`).then((r) => r.json());
      if (res.success && res.data) {
        setSelectedGuest(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch guest details:', err);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleToggleVip = async (guestId: string, currentVip: boolean) => {
    try {
      const res = await fetch(`/api/v1/guests/${guestId}/vip`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vipStatus: !currentVip }),
      }).then((r) => r.json());

      if (res.success) {
        fetchGuestDetails(guestId);
        fetchGuests();
      }
    } catch (err) {
      console.error('Failed to toggle VIP:', err);
    }
  };

  const filteredGuests = guests.filter((g) => {
    const fullName = `${g.firstName} ${g.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      g.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.phone.includes(searchQuery);

    const matchesTier = tierFilter === 'all' || g.loyaltyTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return { bg: 'bg-[#FAF6EE]', text: 'text-[#8C621E]', border: 'border-[#ECE2CE]' };
      case 'gold':
        return { bg: 'bg-[#FAF6EE]', text: 'text-[#8C621E]', border: 'border-[#ECE2CE]' };
      case 'silver':
        return { bg: 'bg-[#F4EFE6]', text: 'text-[#4A433D]', border: 'border-[#DDD7CD]' };
      default:
        return { bg: 'bg-[#EBF4EF]', text: 'text-[#236446]', border: 'border-[#C8E3D4]' };
    }
  };

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-[#1C1815] bg-[#F7F4EE] font-sans selection:bg-[#B08D57]/20 selection:text-[#1C1815]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E2DCD2]">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#8C621E]">
            Cross-Property Guest Intelligence
          </span>
          <h1 className="text-3xl font-serif font-normal text-[#1C1815] tracking-tight mt-0.5">
            Guest CRM & VIP Profiles
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#4A433D] bg-white px-3.5 py-1.5 rounded-md border border-[#DDD7CD] shadow-sm">
          <Users className="w-4 h-4 text-[#B08D57]" />
          <span>{guests.length} Profiles Recorded</span>
        </div>
      </div>

      {/* Grid Layout: Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search & Directory List */}
        <div className="space-y-4">
          <div className="editorial-card p-4 rounded-xl border border-[#DDD7CD] bg-white space-y-3 shadow-sm">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#736B63]" />
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-xs text-[#1C1815] placeholder-[#A69E95] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
              />
            </div>

            {/* Tier Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['all', 'platinum', 'gold', 'silver', 'member'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider transition cursor-pointer ${
                    tierFilter === t
                      ? 'bg-[#FAF6EE] text-[#1C1815] border border-[#B08D57] font-semibold'
                      : 'bg-white text-[#736B63] hover:text-[#1C1815] border border-[#E5E0D8]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Directory List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-12 text-center text-[#736B63] text-xs">
                <Loader2 className="w-5 h-5 text-[#B08D57] animate-spin mx-auto mb-2" />
                Loading guest directory...
              </div>
            ) : filteredGuests.length > 0 ? (
              filteredGuests.map((g) => {
                const isSelected = selectedGuest?.id === g.id;
                const badge = getTierBadge(g.loyaltyTier);

                return (
                  <div
                    key={g.id}
                    onClick={() => fetchGuestDetails(g.id)}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer space-y-2.5 bg-white shadow-sm ${
                      isSelected
                        ? 'border-[#B08D57] ring-1 ring-[#B08D57] bg-[#FAF8F5]'
                        : 'border-[#DDD7CD] hover:border-[#B08D57]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-serif font-bold text-base text-[#1C1815]">
                            {g.firstName} {g.lastName}
                          </span>
                          {g.vipStatus && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#FAF6EE] text-[#8C621E] border border-[#ECE2CE]">
                              VIP
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#736B63] truncate block mt-0.5">{g.email}</span>
                      </div>

                      <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {g.loyaltyTier}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#736B63] pt-2 border-t border-[#E5E0D8]">
                      <span>{g.totalStays ?? 0} {(g.totalStays ?? 0) === 1 ? 'Stay' : 'Stays'} Recorded</span>
                      <span className="font-serif text-[#1C1815] font-bold">${(g.totalSpend ?? 0).toLocaleString()} Spent</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="editorial-card p-8 text-center text-[#736B63] text-xs rounded-xl bg-white border border-[#DDD7CD]">
                No matching guest profiles found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Guest Dossier */}
        <div className="lg:col-span-2">
          {selectedGuest ? (
            <div className="editorial-card p-6 sm:p-7 rounded-xl border border-[#DDD7CD] bg-white space-y-6 shadow-sm">
              {/* Profile Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5E0D8]">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#1C1815]">
                      {selectedGuest.firstName} {selectedGuest.lastName}
                    </h2>
                    <button
                      onClick={() => handleToggleVip(selectedGuest.id, selectedGuest.vipStatus)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                        selectedGuest.vipStatus
                          ? 'bg-[#FAF6EE] text-[#8C621E] border border-[#ECE2CE]'
                          : 'bg-white text-[#736B63] hover:text-[#1C1815] border border-[#DDD7CD]'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" />
                      {selectedGuest.vipStatus ? 'VIP Guest' : 'Mark as VIP'}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#736B63] pt-1">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#B08D57]" />
                      <span>{selectedGuest.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#B08D57]" />
                      <span>{selectedGuest.phone}</span>
                    </div>
                    {selectedGuest.city && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#B08D57]" />
                        <span>{selectedGuest.city}, {selectedGuest.state} ({selectedGuest.country})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Loyalty Tier Badge */}
                <div className="bg-[#FAF8F5] border border-[#DDD7CD] rounded-xl p-4 text-right">
                  <span className="text-[10px] uppercase font-medium text-[#736B63] block">Lumen Elite Tier</span>
                  <div className="text-lg font-serif font-bold text-[#1C1815] uppercase flex items-center justify-end gap-1.5 mt-0.5">
                    <Award className="w-4 h-4 text-[#B08D57]" /> {selectedGuest.loyaltyTier}
                  </div>
                  <span className="text-xs text-[#736B63]">
                    {selectedGuest.loyaltyPoints?.toLocaleString()} Lifetime Points
                  </span>
                </div>
              </div>

              {/* Preferences & Quirk Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1.5">
                  <h4 className="text-xs font-semibold text-[#1C1815] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#B08D57]" /> Preferences & Amenity Requests
                  </h4>
                  <p className="text-xs text-[#4A433D] leading-relaxed">
                    {selectedGuest.specialPreferences || 'No specific preferences recorded yet.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1.5">
                  <h4 className="text-xs font-semibold text-[#736B63] uppercase tracking-wider">
                    Internal Staff Notes
                  </h4>
                  <p className="text-xs text-[#4A433D] leading-relaxed">
                    {selectedGuest.notes || 'Direct guest without operational flags.'}
                  </p>
                </div>
              </div>

              {/* Cross-Property Stay History */}
              <div className="space-y-3">
                <h3 className="text-sm font-serif font-semibold text-[#1C1815] tracking-tight flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#B08D57]" /> Multi-Property Stay History ({selectedGuest.stays?.length || 0})
                </h3>

                {selectedGuest.stays && selectedGuest.stays.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedGuest.stays.map((stay: any) => (
                      <div
                        key={stay.id}
                        className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#1C1815] text-sm">{stay.propertyName}</div>
                          <div className="text-[#736B63] text-xs mt-0.5">
                            {stay.roomTypeName} • Confirmation: <span className="font-mono text-[#1C1815] font-bold">{stay.confirmationCode}</span>
                          </div>
                        </div>

                        <div className="text-[#4A433D]">
                          <span>{stay.checkInDate} → {stay.checkOutDate} ({stay.totalNights} nights)</span>
                        </div>

                        <div className="text-right">
                          <span className="font-serif font-bold text-[#1C1815] text-sm block">${stay.totalAmount}</span>
                          <span className={`text-[10px] uppercase font-medium px-2 py-0.5 rounded border ${
                            stay.status === 'checked_in'
                              ? 'bg-[#EBF4EF] text-[#236446] border-[#C8E3D4]'
                              : 'bg-white text-[#736B63] border-[#DDD7CD]'
                          }`}>
                            {stay.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#736B63] italic">No past stay history recorded yet.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="editorial-card p-16 text-center text-[#736B63] rounded-xl bg-white border border-[#DDD7CD]">
              Select a guest profile on the left to view cross-property stay records and VIP preferences.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestProfiles;
