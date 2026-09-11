import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Key,
  MapPin,
  CheckCircle2,
  Wifi,
  PhoneCall,
  ArrowRight,
  Sparkles,
  Receipt,
} from 'lucide-react';

interface GuestStaysTabProps {
  onOpenMobileKey: () => void;
}

export const GuestStaysTab: React.FC<GuestStaysTabProps> = ({ onOpenMobileKey }) => {
  const navigate = useNavigate();
  const [selectedFolioModal, setSelectedFolioModal] = useState<any | null>(null);

  // Stays data model for demo/guest experience
  const activeStay = {
    id: 'res_active_01',
    propertyName: 'Birchwood Manor & Lodge',
    propertyCity: 'Aspen',
    propertyState: 'CO',
    roomNumber: '204',
    roomTypeName: 'Heritage Fireplace Suite',
    confirmationCode: 'BW-782914',
    checkInDate: '2026-09-09',
    checkOutDate: '2026-09-12',
    nights: 3,
    guests: '2 Adults',
    keyStatus: 'Active & Provisioned',
    status: 'In-House',
    wifiNetwork: 'LumenStay-Guest',
    wifiPassword: 'Sanctuary2026',
    totalAmount: 1134.0,
  };

  const upcomingStays = [
    {
      id: 'res_up_02',
      propertyName: 'Telluride Crest Sanctuary',
      propertyCity: 'Telluride',
      propertyState: 'CO',
      roomTypeName: 'Alpine Vista Balcony Suite',
      confirmationCode: 'TL-948201',
      checkInDate: '2026-10-18',
      checkOutDate: '2026-10-21',
      nights: 3,
      guests: '2 Adults',
      status: 'Confirmed',
      totalAmount: 1260.0,
      daysAway: 38,
    },
    {
      id: 'res_up_03',
      propertyName: 'Copperline Inn & Spa',
      propertyCity: 'Park City',
      propertyState: 'UT',
      roomTypeName: 'Executive Mountain Chalet',
      confirmationCode: 'CP-430192',
      checkInDate: '2026-12-04',
      checkOutDate: '2026-12-08',
      nights: 4,
      guests: '2 Adults, 1 Child',
      status: 'Confirmed',
      totalAmount: 1840.0,
      daysAway: 85,
    },
  ];

  const pastStays = [
    {
      id: 'res_past_01',
      propertyName: 'Redwood Valley Lodge',
      propertyCity: 'Telluride',
      propertyState: 'CO',
      roomTypeName: 'Master Forest King Suite',
      confirmationCode: 'RW-619283',
      stayPeriod: 'June 14 – June 17, 2026',
      nights: 3,
      totalAmount: 990.0,
    },
    {
      id: 'res_past_02',
      propertyName: 'Birchwood Manor & Lodge',
      propertyCity: 'Aspen',
      propertyState: 'CO',
      roomTypeName: 'Deluxe Alpine King',
      confirmationCode: 'BW-510294',
      stayPeriod: 'February 20 – February 24, 2026',
      nights: 4,
      totalAmount: 1680.0,
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Active In-House Stay Card */}
      <div className="editorial-card rounded-2xl bg-white border border-[#E9E5EE] p-6 sm:p-8 space-y-6 shadow-xs relative overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E9E5EE]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EBF5F0] text-[#1E5631] border border-[#C8E3D4] mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active In-House Sanctuary Stay</span>
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1E1627] tracking-tight">
              {activeStay.propertyName}
            </h3>
            <p className="text-xs text-[#6E6678] flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-[#4A1D6D]" /> {activeStay.propertyCity}, {activeStay.propertyState} • Floor 2, East Wing
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenMobileKey}
              className="px-5 py-3 rounded-xl bg-[#4A1D6D] hover:bg-[#3B1457] text-white text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <Key className="w-4 h-4 text-purple-200" />
              <span>Open Salto Digital Key</span>
            </button>
          </div>
        </div>

        {/* Room & Stay Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div className="p-3.5 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6E6678] block">
              Assigned Suite
            </span>
            <span className="font-heading font-extrabold text-xl text-[#1E1627] mt-0.5 block">
              Suite #{activeStay.roomNumber}
            </span>
            <span className="text-[10px] text-[#4A1D6D] font-medium">{activeStay.roomTypeName}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6E6678] block">
              Stay Itinerary
            </span>
            <span className="font-semibold text-xs text-[#1E1627] mt-0.5 block">
              {activeStay.checkInDate} → {activeStay.checkOutDate}
            </span>
            <span className="text-[10px] text-[#6E6678]">{activeStay.nights} Nights • Late 2PM Check-out</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6E6678] block">
              Confirmation Code
            </span>
            <span className="font-mono font-bold text-sm text-[#1E1627] mt-0.5 block">
              {activeStay.confirmationCode}
            </span>
            <span className="text-[10px] text-[#1E5631] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Fully Guaranteed
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE]">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6E6678] block">
              Guest Wi-Fi Access
            </span>
            <span className="font-mono font-bold text-xs text-[#1E1627] mt-0.5 block flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-[#4A1D6D]" /> {activeStay.wifiNetwork}
            </span>
            <span className="text-[10px] text-[#6E6678] font-mono">PW: {activeStay.wifiPassword}</span>
          </div>
        </div>

        {/* In-House Guest Services Banner */}
        <div className="p-4 rounded-xl bg-[#F3EDF8] border border-[#E2D4F0] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#4A1D6D] font-medium">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Need extra down pillows, turndown service, or dinner reservations?</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:9705550199"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2D4F0] text-[#4A1D6D] font-semibold shadow-2xs hover:bg-white/80 transition"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call Front Desk (Ext. 0)
            </a>
          </div>
        </div>
      </div>

      {/* 2. Upcoming Reservations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-heading font-bold text-[#1E1627]">
              Upcoming Confirmed Itineraries
            </h3>
            <p className="text-xs text-[#6E6678]">
              Your booked mountain retreats with guaranteed member rates and direct cancellation flexibility.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FAF9FC] border border-[#E9E5EE] text-[#1E1627]">
            {upcomingStays.length} Upcoming Stays
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingStays.map((stay) => (
            <div
              key={stay.id}
              className="editorial-card rounded-2xl bg-white border border-[#E9E5EE] p-5 space-y-4 shadow-xs hover:border-[#D4C5E3] transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-[#4A1D6D] bg-[#F3EDF8] px-2 py-0.5 rounded border border-[#E2D4F0]">
                    #{stay.confirmationCode}
                  </span>
                  <h4 className="text-base font-heading font-bold text-[#1E1627] mt-1.5">
                    {stay.propertyName}
                  </h4>
                  <p className="text-xs text-[#6E6678] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#4A1D6D]" /> {stay.propertyCity}, {stay.propertyState}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F3EDF8] text-[#4A1D6D] border border-[#E2D4F0]">
                  In {stay.daysAway} Days
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE] grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#6E6678] block">Dates & Nights</span>
                  <span className="font-medium text-[#1E1627]">
                    {stay.checkInDate} → {stay.checkOutDate} ({stay.nights} nts)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6E6678] block">Suite Category</span>
                  <span className="font-medium text-[#1E1627] truncate block">{stay.roomTypeName}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#E9E5EE]">
                <span className="text-xs font-bold text-[#1E1627]">
                  Total Charged: ${stay.totalAmount.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFolioModal(stay)}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF9FC] text-[#4A1D6D] font-semibold text-xs border border-[#E9E5EE] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Receipt className="w-3.5 h-3.5" /> View Folio
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Past Stays History */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-heading font-bold text-[#1E1627]">
              Past Sanctuary Visits & Stay History
            </h3>
            <p className="text-xs text-[#6E6678]">
              Relive your previous visits or quickly rebook your favorite mountain suite.
            </p>
          </div>
        </div>

        <div className="editorial-card rounded-2xl bg-white border border-[#E9E5EE] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E9E5EE] bg-[#FAF9FC] text-[#6E6678] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Lodge Destination</th>
                  <th className="py-3.5 px-4">Suite Category</th>
                  <th className="py-3.5 px-4">Stay Dates</th>
                  <th className="py-3.5 px-4">Confirmation</th>
                  <th className="py-3.5 px-4">Total Billed</th>
                  <th className="py-3.5 px-4 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E5EE]">
                {pastStays.map((past) => (
                  <tr key={past.id} className="hover:bg-[#FAF9FC] transition">
                    <td className="py-3.5 px-4 font-semibold text-[#1E1627] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#4A1D6D]" /> {past.propertyName}
                    </td>
                    <td className="py-3.5 px-4 text-[#1E1627] font-medium">{past.roomTypeName}</td>
                    <td className="py-3.5 px-4 text-[#6E6678] font-mono">{past.stayPeriod}</td>
                    <td className="py-3.5 px-4 text-[#6E6678] font-mono font-bold">#{past.confirmationCode}</td>
                    <td className="py-3.5 px-4 font-bold text-[#1E1627]">${past.totalAmount.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate('/guest?tab=search')}
                        className="px-3 py-1.5 rounded-lg bg-[#FAF9FC] hover:bg-[#F3EDF8] text-[#4A1D6D] border border-[#E9E5EE] font-semibold text-xs transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Rebook</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Folio Modal preview */}
      {selectedFolioModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E9E5EE] max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9E5EE]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#4A1D6D] bg-[#F3EDF8] px-2.5 py-0.5 rounded-full border border-[#E2D4F0]">
                  #{selectedFolioModal.confirmationCode}
                </span>
                <h4 className="font-heading text-lg font-bold text-[#1E1627] mt-1">
                  {selectedFolioModal.propertyName}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFolioModal(null)}
                className="p-1.5 rounded-xl hover:bg-[#FAF9FC] text-[#6E6678] hover:text-[#1E1627] transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-[#6E6678]">Room Rate ({selectedFolioModal.nights} nights)</span>
                <span className="font-semibold text-[#1E1627]">${(selectedFolioModal.totalAmount * 0.88).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-[#6E6678]">Resort Fee & Amenities</span>
                <span className="font-semibold text-[#1E1627]">$75.00</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-[#6E6678]">Local Occupancy & State Tax (12%)</span>
                <span className="font-semibold text-[#1E1627]">${(selectedFolioModal.totalAmount * 0.12).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-sm text-[#1E1627] border-t border-[#E9E5EE]">
                <span>Total Folio Billed</span>
                <span className="text-[#4A1D6D]">${selectedFolioModal.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedFolioModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#4A1D6D] hover:bg-[#3B1457] text-white text-xs font-semibold transition"
            >
              Close Folio Summary
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestStaysTab;
