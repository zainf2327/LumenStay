import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { RoomType, RatePlan } from '../types';
import {
  X,
  Calendar,
  Users,
  CreditCard,
  CheckCircle2,
  Lock,
  Printer,
  Copy,
  Check,
  Sparkles,
  Zap,
} from 'lucide-react';

interface BookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    roomType: RoomType;
    ratePlan: RatePlan;
    pricing: {
      nightlyPrice: number;
      totalPrice: number;
      taxAmount: number;
      resortFee: number;
      grandTotal: number;
    };
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    children: number;
    totalNights: number;
  } | null;
  onBookingComplete?: () => void;
}

export const BookingDrawer: React.FC<BookingDrawerProps> = ({
  isOpen,
  onClose,
  bookingData,
  onBookingComplete,
}) => {
  const { currentUser, currentProperty } = useAuth();

  // Manual Stripe Sandbox Card form state
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardZip, setCardZip] = useState('81611');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !bookingData) return null;

  const { roomType, ratePlan, pricing, checkInDate, checkOutDate, adults, children, totalNights } =
    bookingData;

  // Live Card Brand Detection
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return { name: 'Visa', color: 'bg-blue-900/60 text-blue-300 border-blue-600/60' };
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return { name: 'Mastercard', color: 'bg-orange-900/60 text-orange-300 border-orange-600/60' };
    if (/^3[47]/.test(clean)) return { name: 'Amex', color: 'bg-cyan-900/60 text-cyan-300 border-cyan-600/60' };
    if (/^(6011|65|64[4-9])/.test(clean)) return { name: 'Discover', color: 'bg-amber-900/60 text-amber-300 border-amber-600/60' };
    return { name: 'Credit Card', color: 'bg-slate-800 text-slate-400 border-slate-700' };
  };

  // Card Number Auto-formatting (Spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Expiry Auto-formatting (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExp(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExp(raw);
    }
  };

  // Quick-fill Stripe Sandbox test card
  const handleQuickFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExp('12/28');
    setCardCvc('888');
    setCardZip('81611');
  };

  const handleBookReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (cleanCard.length < 13) {
        throw new Error('Please enter a valid 16-digit card number.');
      }

      // Guest details derived cleanly from session or luxury default
      const guestFirstName = currentUser?.name?.split(' ')[0] || 'Alexandra';
      const guestLastName = currentUser?.name?.split(' ').slice(1).join(' ') || 'Vance';
      const guestEmail = currentUser?.email || 'alexandra.vance@techventures.io';

      const payload = {
        propertyId: currentProperty?.id,
        roomTypeId: roomType.id,
        ratePlanId: ratePlan.id,
        checkInDate,
        checkOutDate,
        adultCount: adults,
        childCount: children,
        guest: {
          firstName: guestFirstName,
          lastName: guestLastName,
          email: guestEmail,
          phone: '+1 (555) 019-2831',
        },
        paymentDetails: {
          cardNumber: cleanCard,
          cardExpiry: cardExp,
          cardCvc,
          cardZip,
          token: 'pm_card_visa',
        },
      };

      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      if (res.success && res.data) {
        setConfirmedBooking(res.data);
        if (onBookingComplete) onBookingComplete();
      } else {
        setError(res.message || 'Unable to complete Stripe transaction.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred during booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!confirmedBooking?.confirmationCode) return;
    navigator.clipboard.writeText(confirmedBooking.confirmationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const activeBrand = getCardBrand(cardNumber);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark Overlay Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-Over Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-sheet text-slate-100 flex flex-col h-full animate-slideRight">
          {/* Header */}
          <div className="p-5 border-b border-slate-800/90 flex items-center justify-between bg-slate-900/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  {currentProperty?.name}
                </span>
                <span className="text-xs text-slate-400">• {roomType.code}</span>
              </div>
              <h2 className="text-lg font-heading font-bold text-white mt-1">
                {confirmedBooking ? 'Reservation Confirmed' : 'Payment & Checkout'}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-5 overflow-y-auto flex-1 space-y-5">
            {confirmedBooking ? (
              /* Success Confirmation Voucher */
              <div className="space-y-5 py-2 animate-scaleUp">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-white">
                    Reservation Confirmed!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Your stay is secured and charged through Stripe with zero double-booking risk.
                  </p>
                </div>

                {/* Confirmation Code Card */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center space-y-1.5 glow-gold">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 block">
                    Confirmation Code
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-mono font-bold text-amber-400 tracking-wider">
                      {confirmedBooking.confirmationCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Copy Confirmation Code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Stripe Payment Captured
                  </span>
                </div>

                {/* Stay Details Summary */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Suite</span>
                    <span className="font-semibold text-white">{roomType.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Rate Plan</span>
                    <span className="text-amber-300">{ratePlan.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Dates</span>
                    <span>{checkInDate} → {checkOutDate} ({totalNights} nights)</span>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800">
                    <span className="text-slate-400 font-semibold">Total Paid</span>
                    <span className="font-mono text-base font-bold text-amber-400">
                      ${pricing.grandTotal.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl gold-btn text-xs font-bold transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Direct Payment Form (Card Details Only) */
              <form onSubmit={handleBookReservation} className="space-y-4">
                {/* Stay Summary Card */}
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-white">{roomType.name}</h4>
                      <p className="text-[11px] text-amber-400/90 font-medium">{ratePlan.name}</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-amber-400">
                      ${pricing.nightlyPrice}/night
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span>{checkInDate} to {checkOutDate}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-amber-400" />
                      <span>{adults} Guests ({totalNights} nts)</span>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Card Details Section (The Only Required Inputs) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Payment Method
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ml-1 ${activeBrand.color}`}>
                        {activeBrand.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleQuickFillTestCard}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 transition"
                      title="Auto-fill Stripe test card"
                    >
                      <Zap className="w-3 h-3" /> Test Card
                    </button>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-inner">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Card Number</span>
                        <span className="text-[10px] text-slate-500">256-Bit SSL Encrypted</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          required
                          placeholder="4242 4242 4242 4242"
                          maxLength={19}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm font-mono text-white tracking-wider focus:border-amber-400 focus:outline-none"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-emerald-400" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Expires</label>
                        <input
                          type="text"
                          value={cardExp}
                          onChange={handleExpiryChange}
                          placeholder="12/28"
                          maxLength={5}
                          required
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white text-center focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">CVC</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="888"
                          maxLength={4}
                          required
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white text-center focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">ZIP</label>
                        <input
                          type="text"
                          value={cardZip}
                          onChange={(e) => setCardZip(e.target.value.slice(0, 10))}
                          placeholder="81611"
                          required
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white text-center focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Itemized Price Breakdown */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Room Total ({totalNights} nights × ${pricing.nightlyPrice})</span>
                    <span className="font-mono text-slate-200">${pricing.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Lodging Tax (12%)</span>
                    <span className="font-mono text-slate-200">${pricing.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Resort & Amenity Fee</span>
                    <span className="font-mono text-slate-200">${pricing.resortFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs font-bold">
                    <span className="text-white">Total Amount Due</span>
                    <span className="font-mono text-base text-amber-400">
                      ${pricing.grandTotal.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 gold-btn rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-50 transition"
                >
                  {isSubmitting ? (
                    'Authorizing Stripe Payment...'
                  ) : (
                    <>
                      <span>Pay ${pricing.grandTotal.toFixed(2)} with Stripe</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
