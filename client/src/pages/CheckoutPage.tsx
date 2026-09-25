import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement, 
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import type { Property, RoomType, RatePlan } from '../types';

const stripePublishableKey =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_51UAmGTLMJQxu2eglSuApU6ZJDUu7hSQhRwIZi3nnMCloVUR7fysycDUMLwcnoVrNMIs8QCSjCTsYpxRnCrib9OmJ00OJTIqIEE';

const stripePromise = loadStripe(stripePublishableKey);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#1C1815',
      fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
      fontSmoothing: 'antialiased',
      fontSize: '14px',
      '::placeholder': {
        color: '#A69E95',
      },
      iconColor: '#B08D57',
    },
    invalid: {
      color: '#8C2F22',
      iconColor: '#8C2F22',
    },
  },
  hidePostalCode: false,
};

interface CheckoutFormProps {
  property?: Property;
  roomType?: RoomType;
  ratePlan?: RatePlan;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  totalNights: number;
  nightlyPrice: number;
  totalPrice: number;
  taxAmount: number;
  resortFee: number;
  grandTotal: number;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  property,
  roomType,
  ratePlan,
  checkInDate,
  checkOutDate,
  adults,
  children,
  totalNights,
  nightlyPrice,
  totalPrice,
  taxAmount,
  resortFee,
  grandTotal,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [guestFirstName, setGuestFirstName] = useState(
    currentUser?.name?.split(' ')[0] || 'Alexandra'
  );
  const [guestLastName, setGuestLastName] = useState(
    currentUser?.name?.split(' ').slice(1).join(' ') || 'Vance'
  );
  const [guestEmail, setGuestEmail] = useState(
    currentUser?.email || 'alexandra.vance@techventures.io'
  );
  const [guestPhone, setGuestPhone] = useState('+1 (555) 019-2831');
  const [specialRequests, setSpecialRequests] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDisplayDate = (dStr: string) => {
    try {
      const d = new Date(dStr + 'T12:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setError('Payment gateway initializing. Please try again in a moment.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card payment input was not found.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Securing payment token...');
    setError(null);

    try {
      // 1. Client-Side Tokenization directly with Stripe (PCI-DSS compliant)
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${guestFirstName} ${guestLastName}`.trim(),
          email: guestEmail.trim(),
          phone: guestPhone.trim(),
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment validation failed.');
      }

      if (!paymentMethod || !paymentMethod.id) {
        throw new Error('Could not create secure payment token.');
      }

      // 2. Send tokenized paymentMethodId to server
      setStatusMessage('Authorizing reservation with Stripe...');
      const payload = {
        propertyId: property?.id || 'prop_birchwood',
        roomTypeId: roomType?.id,
        ratePlanId: ratePlan?.id,
        checkInDate,
        checkOutDate,
        adultCount: adults,
        childCount: children,
        guest: {
          firstName: guestFirstName,
          lastName: guestLastName,
          email: guestEmail,
          phone: guestPhone,
        },
        specialRequests: specialRequests || undefined,
        paymentDetails: {
          paymentMethodId: paymentMethod.id,
        },
      };

      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      // 3. Handle 3D Secure / Strong Customer Authentication (SCA) Challenge if required by bank
      if (res.success && res.data?.requiresAction && res.data.clientSecret) {
        setStatusMessage('Card issuer requested 3D Secure verification. Please complete the bank challenge...');
        const { error: actionError, paymentIntent } = await stripe.handleNextAction({
          clientSecret: res.data.clientSecret,
        });

        if (actionError) {
          throw new Error(actionError.message || '3D Secure bank authentication was declined or cancelled.');
        }

        if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture')) {
          // Re-submit booking with verified paymentIntentId
          setStatusMessage('Bank verification approved! Confirming reservation...');
          const retryPayload = {
            ...payload,
            paymentDetails: {
              paymentIntentId: paymentIntent.id,
            },
          };

          const confirmRes = await fetch('/api/v1/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(retryPayload),
          }).then((r) => r.json());

          if (confirmRes.success && confirmRes.data) {
            navigate(`/confirmation/${confirmRes.data.confirmationCode}`, {
              state: {
                booking: confirmRes.data,
                property,
                roomType,
                ratePlan,
                pricing: {
                  nightlyPrice,
                  totalPrice,
                  taxAmount,
                  resortFee,
                  grandTotal,
                },
                checkInDate,
                checkOutDate,
                adults,
                children,
                totalNights,
              },
            });
            return;
          } else {
            throw new Error(confirmRes.message || 'Unable to confirm reservation after authentication.');
          }
        } else {
          throw new Error('Payment was not completed. Please try another card.');
        }
      }

      if (res.success && res.data) {
        navigate(`/confirmation/${res.data.confirmationCode}`, {
          state: {
            booking: res.data,
            property,
            roomType,
            ratePlan,
            pricing: {
              nightlyPrice,
              totalPrice,
              taxAmount,
              resortFee,
              grandTotal,
            },
            checkInDate,
            checkOutDate,
            adults,
            children,
            totalNights,
          },
        });
      } else {
        setError(res.message || 'Unable to complete reservation transaction.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred during booking.');
    } finally {
      setIsSubmitting(false);
      setStatusMessage(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start font-sans">
      {/* LEFT COLUMN: Guest Details & Secure Payment Form */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Guest Information Card */}
        <div className="editorial-card rounded-2xl bg-white border border-[#DDD7CD] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
            <div>
              <h2 className="font-serif font-normal text-xl text-[#1C1815]">Guest Information</h2>
              <p className="text-xs text-[#736B63] mt-0.5">Please enter the lead guest details for the reservation</p>
            </div>
            <span className="text-[10px] font-medium text-[#8C621E] uppercase tracking-wider bg-[#FAF6EE] px-2.5 py-1 rounded border border-[#ECE2CE]">
              Direct Booking
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={guestLastName}
                onChange={(e) => setGuestLastName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1.5">
              Special Requests (Optional)
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={2}
              placeholder="High floor, quiet suite, early check-in, dietary preferences..."
              className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
            />
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="editorial-card rounded-2xl bg-white border border-[#DDD7CD] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
            <div>
              <h2 className="font-serif font-normal text-xl text-[#1C1815]">Payment Details</h2>
              <p className="text-xs text-[#736B63] mt-0.5">Encrypted payment authorized via Stripe</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#736B63]">
              <Lock className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-md bg-[#FAF0ED] border border-[#EACEC8] text-[#8C2F22] text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleConfirmBooking} className="space-y-6">
            {/* Stripe Card Container */}
            <div>
              <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-2">
                Credit or Debit Card
              </label>

              <div className="p-3.5 bg-white border border-[#DDD7CD] rounded-md focus-within:border-[#B08D57] transition shadow-inner">
                <CardElement
                  options={CARD_ELEMENT_OPTIONS}
                  onChange={(e) => {
                    setCardComplete(e.complete);
                    if (e.error) {
                      setError(e.error.message);
                    } else {
                      setError(null);
                    }
                  }}
                />
              </div>
            </div>

            {/* Booking Guarantees */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs space-y-2 text-[#4A433D]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#236446] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#1C1815] font-semibold">Flexible Cancellation:</strong> Free cancellation up to 48 hours prior to arrival ({formatDisplayDate(checkInDate)}).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#236446] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#1C1815] font-semibold">Instant Guarantee:</strong> Direct suite reservation confirmed immediately upon authorization.
                </span>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting || !stripe || !cardComplete}
              className="w-full py-3.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] disabled:opacity-40 disabled:cursor-not-allowed text-[#F7F4EE] font-medium text-base flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#B08D57]" />
                  <span>{statusMessage || 'Authorizing Payment...'}</span>
                </span>
              ) : (
                <>
                  <span>Complete Reservation (${grandTotal.toFixed(2)} USD)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Sticky Reservation Summary */}
      <div className="lg:col-span-5 sticky top-24 space-y-6">
        <div className="editorial-card rounded-2xl bg-white border border-[#DDD7CD] overflow-hidden shadow-sm">
          {/* Room Image */}
          <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-[#FAF8F5]">
            <img
              src={roomType?.images?.[0] || property?.heroImage}
              alt={roomType?.name || property?.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            <div className="absolute top-3 left-3">
              <span className="text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded bg-white/90 text-[#1C1815] backdrop-blur-md border border-[#DDD7CD]">
                {property?.name}
              </span>
            </div>

            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
              <div>
                <h3 className="font-serif font-normal text-lg leading-tight">
                  {roomType?.name || 'Deluxe Suite'}
                </h3>
                <p className="text-xs text-white/90 mt-0.5">
                  {ratePlan?.name || 'Standard Flexible Rate'} • {roomType?.bedConfiguration || '1 King Bed'}
                </p>
              </div>
              <span className="font-serif text-sm font-bold">
                ${nightlyPrice}/nt
              </span>
            </div>
          </div>

          {/* Stay Details */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#736B63] block mb-0.5 font-medium">
                  Check-In
                </span>
                <div className="font-semibold text-[#1C1815]">{formatDisplayDate(checkInDate)}</div>
                <div className="text-[11px] text-[#736B63] flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-[#B08D57]" /> 3:00 PM Arrival
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#736B63] block mb-0.5 font-medium">
                  Check-Out
                </span>
                <div className="font-semibold text-[#1C1815]">{formatDisplayDate(checkOutDate)}</div>
                <div className="text-[11px] text-[#736B63] flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-[#B08D57]" /> 11:00 AM Departure
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#736B63] px-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#B08D57]" />
                <span>{totalNights} {totalNights === 1 ? 'Night' : 'Nights'} Stay</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#B08D57]" />
                <span>
                  {adults} {adults === 1 ? 'Adult' : 'Adults'}{children > 0 ? `, ${children} Children` : ''}
                </span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs space-y-2.5">
              <div className="flex justify-between text-[#736B63]">
                <span>Room Subtotal ({totalNights} nts × ${nightlyPrice || 0})</span>
                <span className="font-mono text-[#1C1815]">${(totalPrice || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#736B63]">
                <span>Lodging & Resort Taxes (12%)</span>
                <span className="font-mono text-[#1C1815]">${(taxAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[#736B63]">
                <span>Resort & Amenity Fee</span>
                <span className="font-mono text-[#1C1815]">${(resortFee || 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-[#DDD7CD] text-sm">
                <span className="text-[#1C1815] font-semibold">Total Due</span>
                <span className="font-serif text-lg font-bold text-[#1C1815]">
                  ${(grandTotal || 0).toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const { properties } = useAuth();

  const stateData = location.state as {
    property?: Property;
    roomType?: RoomType;
    ratePlan?: RatePlan;
    pricing?: {
      nightlyPrice: number;
      totalPrice: number;
      taxAmount: number;
      resortFee: number;
      grandTotal: number;
    };
    checkInDate?: string;
    checkOutDate?: string;
    adults?: number;
    children?: number;
    totalNights?: number;
  } | null;

  const property = stateData?.property || properties[0] || null;
  const [resolvedRoomType, setResolvedRoomType] = useState<RoomType | undefined>(stateData?.roomType);
  const [resolvedRatePlan, setResolvedRatePlan] = useState<RatePlan | undefined>(stateData?.ratePlan);
  const loadedPropertyRef = useRef<string | null>(null);

  const checkInDate = stateData?.checkInDate || '2026-09-26';
  const checkOutDate = stateData?.checkOutDate || '2026-09-28';
  const adults = stateData?.adults || 2;
  const children = stateData?.children || 0;
  const totalNights = stateData?.totalNights || 2;

  useEffect(() => {
    if (!property?.id) return;
    if (loadedPropertyRef.current === property.id && resolvedRoomType && resolvedRatePlan) return;

    let isMounted = true;
    async function loadDefaults() {
      try {
        const res = await fetch(
          `/api/v1/availability?propertyId=${property.id}&checkIn=${checkInDate}&checkOut=${checkOutDate}`
        ).then((r) => r.json());
        if (isMounted && res.success && res.data?.results?.length > 0) {
          const firstResult = res.data.results[0];
          setResolvedRoomType((prev) => (prev && prev.propertyId === property.id ? prev : firstResult.roomType));
          setResolvedRatePlan((prev) => (prev && prev.propertyId === property.id ? prev : firstResult.nightlyRates?.[0]?.ratePlan));
          loadedPropertyRef.current = property.id;
        }
      } catch (err) {
        console.error('Failed to load room type / rate plan defaults:', err);
      }
    }

    if (!resolvedRoomType || !resolvedRatePlan || resolvedRoomType.propertyId !== property.id || resolvedRatePlan.propertyId !== property.id) {
      loadDefaults();
    }

    return () => {
      isMounted = false;
    };
  }, [property?.id, checkInDate, checkOutDate]);

  if (!property) {
    return (
      <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center p-6 text-[#1C1815]">
        <div className="flex flex-col items-center gap-3 text-[#736B63]">
          <Loader2 className="w-8 h-8 animate-spin text-[#B08D57]" />
          <span className="text-sm font-medium">Preparing sanctuary checkout...</span>
        </div>
      </div>
    );
  }

  const rawNightly = resolvedRoomType?.basePrice
    ? Math.round(resolvedRoomType.basePrice * (resolvedRatePlan?.priceModifier || 1.0))
    : 380;
  const nightlyPrice = Number.isFinite(rawNightly) && rawNightly > 0 ? rawNightly : 380;
  const totalPrice = Number.isFinite(stateData?.pricing?.totalPrice)
    ? stateData!.pricing!.totalPrice
    : nightlyPrice * totalNights;
  const taxAmount = Number.isFinite(stateData?.pricing?.taxAmount)
    ? stateData!.pricing!.taxAmount
    : totalPrice * 0.12;
  const resortFee = Number.isFinite(stateData?.pricing?.resortFee)
    ? stateData!.pricing!.resortFee
    : 35 * totalNights;
  const grandTotal = Number.isFinite(stateData?.pricing?.grandTotal)
    ? stateData!.pricing!.grandTotal
    : totalPrice + taxAmount + resortFee;

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#1C1815] pb-20 font-sans selection:bg-[#B08D57]/20 selection:text-[#1C1815]">
      {/* Dedicated Luxury Minimalist Checkout Header */}
      <header className="border-b border-[#E2DCD2] bg-[#F4EFE6]/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs text-[#736B63] hover:text-[#1C1815] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Suites</span>
          </Link>

          <Link to="/" className="font-serif text-xl font-medium text-[#1C1815] tracking-tight">
            LumenStay
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-[#736B63]">
            <Lock className="w-3.5 h-3.5 text-[#B08D57]" />
            <span className="hidden sm:inline font-medium">Encrypted Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Checkout Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <Elements stripe={stripePromise}>
          <CheckoutForm
            property={property}
            roomType={resolvedRoomType}
            ratePlan={resolvedRatePlan}
            checkInDate={checkInDate}
            checkOutDate={checkOutDate}
            adults={adults}
            children={children}
            totalNights={totalNights}
            nightlyPrice={nightlyPrice}
            totalPrice={totalPrice}
            taxAmount={taxAmount}
            resortFee={resortFee}
            grandTotal={grandTotal}
          />
        </Elements>
      </div>
    </div>
  );
};

export default CheckoutPage;
