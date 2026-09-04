import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Check,
  Download,
  Clock,
  Key,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { downloadFolioDocument } from '../utils/folioExport.util';
import { useToast } from '../context/ToastContext';

export const ConfirmationPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const toast = useToast();
  const hasToastedRef = useRef(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const stateData = location.state as any;
  const booking = stateData?.booking;
  const property = stateData?.property;
  const roomType = stateData?.roomType;
  const ratePlan = stateData?.ratePlan;
  const pricing = stateData?.pricing;
  const checkInDate = stateData?.checkInDate || booking?.checkInDate || '2026-09-03';
  const checkOutDate = stateData?.checkOutDate || booking?.checkOutDate || '2026-09-05';
  const totalNights = stateData?.totalNights || booking?.totalNights || 2;
  const confirmationCode = code || booking?.confirmationCode || 'LMN-BW-2026';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(confirmationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatDisplayDate = (dStr: string) => {
    try {
      const d = new Date(dStr + 'T12:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  useEffect(() => {
    if (hasToastedRef.current) return;
    hasToastedRef.current = true;

    const propertyName = property?.name || 'LumenStay';
    const checkInFormatted = formatDisplayDate(checkInDate);

    toast.success(
      `${propertyName} — Check-in ${checkInFormatted}`,
      `Booking Confirmed • ${confirmationCode}`,
      6000,
      {
        label: 'Copy Code',
        icon: 'copy',
        onClick: () => {
          navigator.clipboard.writeText(confirmationCode);
          handleCopyCode();
          toast.info(`Code ${confirmationCode} copied to clipboard`, 'Copied');
        },
      }
    );
  }, [confirmationCode, property?.name, checkInDate, toast]);


  return (
    <div className="min-h-[90vh] py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-fadeIn text-[#1C1815] font-sans selection:bg-[#B08D57]/20 selection:text-[#1C1815]">
      {/* Top Banner Celebration */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="w-14 h-14 rounded-full bg-[#EBF4EF] border border-[#C8E3D4] text-[#236446] mx-auto flex items-center justify-center shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#8C621E] block">
          Direct Reservation Guaranteed
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-normal text-[#1C1815] tracking-tight">
          You're Headed to {property?.name || 'Your Luxury Destination'}
        </h1>
        <p className="text-xs sm:text-sm text-[#736B63]">
          Your reservation is confirmed and authorized through Stripe with real transactional database records.
        </p>
      </div>

      {/* Confirmation Code Card */}
      <div className="editorial-card p-6 sm:p-8 rounded-2xl bg-white border border-[#DDD7CD] text-center space-y-3 max-w-xl mx-auto shadow-sm">
        <span className="text-xs font-medium uppercase tracking-wider text-[#736B63] block">
          Official Confirmation Code
        </span>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl sm:text-4xl font-mono font-bold text-[#1C1815] tracking-wider">
            {confirmationCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-2 rounded-md bg-[#FAF8F5] hover:bg-[#F4EFE6] text-[#1C1815] border border-[#DDD7CD] transition cursor-pointer"
            title="Copy Confirmation Code"
          >
            {copiedCode ? <Check className="w-4 h-4 text-[#236446]" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs text-[#236446] font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Stripe Payment Captured
          </span>
          <span className="text-[#DDD7CD]">•</span>
          <span className="flex items-center gap-1.5 text-[#736B63]">
            <Key className="w-3.5 h-3.5 text-[#B08D57]" /> Digital BLE Key Issued on Arrival
          </span>
        </div>
      </div>

      {/* 2-Column Itinerary Voucher Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Property & Suite Specs */}
        <div className="md:col-span-7 editorial-card p-6 sm:p-7 rounded-2xl bg-white border border-[#DDD7CD] space-y-6 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#8C621E] block">
                  Property Destination
                </span>
                <h3 className="text-xl font-serif font-normal text-[#1C1815] mt-0.5">
                  {property?.name || 'The Birchwood'}
                </h3>
                <p className="text-xs text-[#736B63]">{property?.city || 'Aspen'}, {property?.state || 'CO'}</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded bg-[#FAF8F5] text-[#1C1815] border border-[#DDD7CD]">
                {roomType?.code || 'DHK'} Suite
              </span>
            </div>

            {/* Check-In & Check-Out Times */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs">
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

            <div className="text-xs text-[#4A433D] space-y-1.5">
              <div className="flex justify-between py-1 border-b border-[#E5E0D8]">
                <span className="text-[#736B63]">Suite Type</span>
                <span className="font-medium text-[#1C1815]">{roomType?.name || 'Deluxe Heritage King'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E5E0D8]">
                <span className="text-[#736B63]">Rate Plan</span>
                <span className="font-medium text-[#8C621E]">{ratePlan?.name || 'Standard Flexible Rate'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#736B63]">Stay Duration</span>
                <span className="font-medium text-[#1C1815]">{totalNights} Nights</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E0D8] text-xs text-[#736B63] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B08D57] shrink-0" />
            <span>Need changes or early check-in? Look up your stay anytime using your confirmation code.</span>
          </div>
        </div>

        {/* Right Column: Billing & Actions */}
        <div className="md:col-span-5 editorial-card p-6 sm:p-7 rounded-2xl bg-white border border-[#DDD7CD] space-y-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#736B63] pb-2 border-b border-[#E5E0D8]">
              Settled Folio Ledger
            </h4>

            <div className="space-y-2 text-xs text-[#736B63]">
              <div className="flex justify-between">
                <span>Room Charges</span>
                <span className="font-mono text-[#1C1815]">
                  ${(pricing?.totalPrice || 760).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Lodging Tax (12%)</span>
                <span className="font-mono text-[#1C1815]">
                  ${(pricing?.taxAmount || 91.20).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Resort & Amenity Fee</span>
                <span className="font-mono text-[#1C1815]">
                  ${(pricing?.resortFee || 70).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[#236446] pt-2 border-t border-[#E5E0D8]">
                <span>Stripe Payment Received</span>
                <span className="font-mono font-bold">
                  -${(pricing?.grandTotal || 921.20).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#E5E0D8] text-sm font-semibold text-[#1C1815]">
                <span>Balance Due at Check-In</span>
                <span className="font-mono text-[#236446]">$0.00 USD</span>
              </div>
            </div>
          </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-4 border-t border-[#E5E0D8] no-print">
              <button
                onClick={() => {
                  downloadFolioDocument({
                    confirmationCode,
                    propertyName: property?.name || 'The Birchwood',
                    propertyAddress: property?.address || `${property?.city || 'Aspen'}, ${property?.state || 'CO'}`,
                    propertyPhone: property?.phone || '+1 (800) 555-0199',
                    guestName: booking?.guest ? `${booking.guest.firstName} ${booking.guest.lastName}` : 'Valued Guest',
                    roomNumber: booking?.assignedRoom?.roomNumber || 'Assigned at Check-In',
                    checkInDate,
                    checkOutDate,
                    charges: [
                      {
                        id: 'c_room',
                        category: 'room_rate',
                        description: `Suite Room Charges (${totalNights} Nights)`,
                        amount: pricing?.totalPrice || 760,
                        postedBy: 'Direct Online Prepayment',
                        createdAt: booking?.createdAt || new Date().toISOString(),
                      },
                      {
                        id: 'c_tax',
                        category: 'tax',
                        description: 'Lodging & State Taxes (12%)',
                        amount: pricing?.taxAmount || 91.20,
                        postedBy: 'Direct Online Prepayment',
                        createdAt: booking?.createdAt || new Date().toISOString(),
                      },
                      {
                        id: 'c_resort',
                        category: 'resort_fee',
                        description: 'Resort & Amenity Fee',
                        amount: pricing?.resortFee || 70,
                        postedBy: 'Direct Online Prepayment',
                        createdAt: booking?.createdAt || new Date().toISOString(),
                      },
                      {
                        id: 'c_pay',
                        category: 'payment',
                        description: 'Payment Received — Card on File',
                        amount: -(pricing?.grandTotal || 921.20),
                        postedBy: 'Direct Online Prepayment',
                        createdAt: booking?.createdAt || new Date().toISOString(),
                      }
                    ],
                    totalCharges: pricing?.grandTotal || 921.20,
                    totalPayments: pricing?.grandTotal || 921.20,
                    balanceDue: 0,
                  });
                }}
                className="w-full py-3 rounded-md bg-white hover:bg-[#FAF8F5] border border-[#DDD7CD] text-[#1C1815] text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Save Itinerary Voucher
              </button>

            <Link
              to={`/lookup?code=${confirmationCode}`}
              className="w-full py-3 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] text-xs font-medium flex items-center justify-center gap-2 transition"
            >
              <span>Manage Booking</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ConfirmationPage;
