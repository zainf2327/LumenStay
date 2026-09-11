import React, { useState } from 'react';
import { Search, Loader2, CheckCircle2, FileText } from 'lucide-react';
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
    <div className="space-y-6 max-w-2xl mx-auto font-sans">
      <div className="editorial-card rounded-2xl bg-white border border-[#E9E5EE] p-6 sm:p-8 space-y-5 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F3EDF8] text-[#4A1D6D] border border-[#E2D4F0] mb-2">
            <FileText className="w-3 h-3" />
            <span>Self-Service Itinerary Search</span>
          </div>
          <h3 className="font-heading text-2xl font-extrabold text-[#1E1627] tracking-tight">
            Look Up Your Reservation
          </h3>
          <p className="text-xs text-[#6E6678] mt-1 font-normal">
            Access your stay itinerary, view digital room key status, review billing folios, or view property directions.
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6E6678] mb-1.5">
                Confirmation Code
              </label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                placeholder="e.g. BW-782914 or LMN-CO-8201"
                className="w-full p-2.5 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE] text-xs font-mono font-bold text-[#1E1627] focus:outline-hidden focus:border-[#4A1D6D] transition uppercase"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6E6678] mb-1.5">
                Guest Email (Optional)
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="guest@example.com"
                className="w-full p-2.5 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE] text-xs font-medium text-[#1E1627] focus:outline-hidden focus:border-[#4A1D6D] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#4A1D6D] hover:bg-[#3B1457] text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Search className="w-4 h-4 text-white" />}
            <span>Retrieve Reservation Itinerary</span>
          </button>
        </form>
      </div>

      {booking && (
        <div className="editorial-card rounded-2xl bg-white border border-[#E9E5EE] p-6 space-y-5 shadow-xs animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E9E5EE]">
            <div>
              <span className="font-mono text-xs font-bold text-[#4A1D6D] bg-[#F3EDF8] px-2.5 py-0.5 rounded-md border border-[#E2D4F0]">
                #{booking.confirmationCode}
              </span>
              <h4 className="font-heading text-lg font-bold text-[#1E1627] mt-1.5">
                {booking.roomType?.name || 'Sanctuary Suite'}
              </h4>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EBF5F0] text-[#1E5631] border border-[#C8E3D4] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {booking.status || 'Confirmed'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE]">
              <span className="text-[10px] text-[#6E6678] uppercase font-bold block">Check-In / Out</span>
              <span className="font-medium text-[#1E1627] mt-0.5 block">
                {booking.checkInDate} → {booking.checkOutDate}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE]">
              <span className="text-[10px] text-[#6E6678] uppercase font-bold block">Guest Name</span>
              <span className="font-medium text-[#1E1627] mt-0.5 block truncate">
                {booking.guestName || 'Registered Guest'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF9FC] border border-[#E9E5EE] col-span-2 sm:col-span-1">
              <span className="text-[10px] text-[#6E6678] uppercase font-bold block">Total Amount</span>
              <span className="font-heading font-extrabold text-[#1E1627] text-base mt-0.5 block">
                ${(booking.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationLookupTab;
