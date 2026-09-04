import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const ReservationLookupTab: React.FC = () => {
  const toast = useToast();
  const [confirmationCode, setConfirmationCode] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationCode.trim()) {
      toast.error('Please enter your Confirmation Code');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/v1/bookings/${confirmationCode.trim().toUpperCase()}`).then((r) => r.json());
      if (res.success && res.data) {
        setBooking(res.data);
      } else {
        toast.error(res.message || 'No reservation found matching this code');
        setBooking(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Lookup failed');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-6 space-y-4 shadow-sm">
        <div>
          <h3 className="font-serif text-xl font-semibold text-[#1C1815]">Look Up Your Reservation</h3>
          <p className="text-xs text-[#736B63]">
            Access your stay itinerary, view billing charges, or request room upgrades.
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1815] uppercase tracking-wider mb-1">
                Confirmation Code
              </label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                placeholder="e.g. BW-101"
                className="w-full p-2.5 rounded-lg bg-[#FAF8F5] border border-[#DDD7CD] text-xs font-mono font-medium text-[#1C1815] focus:outline-none focus:border-[#B08D57]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1C1815] uppercase tracking-wider mb-1">
                Guest Email
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="e.g. guest@lumenstay.com"
                className="w-full p-2.5 rounded-lg bg-[#FAF8F5] border border-[#DDD7CD] text-xs font-medium text-[#1C1815] focus:outline-none focus:border-[#B08D57]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-[#B08D57]" /> : <Search className="w-4 h-4 text-[#B08D57]" />}
            <span>Find Reservation</span>
          </button>
        </form>
      </div>

      {booking && (
        <div className="editorial-card rounded-xl bg-white border border-[#DDD7CD] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
            <div>
              <span className="font-mono text-xs font-bold text-[#8C621E]">#{booking.confirmationCode}</span>
              <h4 className="font-serif text-lg font-bold text-[#1C1815]">{booking.roomType?.name || 'Suite'}</h4>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#EBF4EF] text-[#236446] border border-[#C8E3D4]">
              {booking.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#736B63] block">Dates</span>
              <span className="font-mono font-medium text-[#1C1815]">{booking.checkInDate} → {booking.checkOutDate}</span>
            </div>
            <div>
              <span className="text-[#736B63] block">Total Charged</span>
              <span className="font-mono font-bold text-[#1C1815]">${(booking.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationLookupTab;
