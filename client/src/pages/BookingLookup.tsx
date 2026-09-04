import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Calendar,
  Building,
  Key,
  Download,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Receipt,
  CreditCard,
  ShieldCheck,
  Clock,
  Loader2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { downloadFolioDocument } from '../utils/folioExport.util';

export const BookingLookup: React.FC = () => {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [searchParams] = useSearchParams();
  const [confirmationCode, setConfirmationCode] = useState(searchParams.get('code') || '');
  const [guestEmail, setGuestEmail] = useState('');
  const [reservation, setReservation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchBooking = async (code: string) => {
    if (!code.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setActionSuccess(null);
      const res = await fetch(`/api/v1/bookings/${code.trim().toUpperCase()}`).then((r) => r.json());

      if (res.success && res.data) {
        setReservation(res.data);
      } else {
        setError(res.message || 'No reservation found matching this confirmation code.');
        setReservation(null);
      }
    } catch (err) {
      setError('An error occurred while retrieving your reservation.');
      setReservation(null);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const cleanReceiptDescription = (desc: string): string => {
    if (!desc) return '';
    if (desc.includes('pi_') || desc.includes('Stripe Live Payment') || desc.includes('Settlement Payment')) {
      const matchLast4 = desc.match(/ending in (\d{4})/i);
      if (matchLast4) {
        return `Payment Received — Card ending in ${matchLast4[1]}`;
      }
      return 'Electronic Payment Received';
    }
    return desc;
  };

  const cleanPostedBy = (postedBy?: string): string => {
    if (!postedBy || postedBy.toLowerCase().includes('sandbox') || postedBy.toLowerCase().includes('system')) {
      return 'Direct Online Prepayment';
    }
    return postedBy;
  };

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setConfirmationCode(code);
      fetchBooking(code);
    }
  }, [searchParams]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationCode.trim()) {
      setError('Please enter a confirmation code.');
      return;
    }
    fetchBooking(confirmationCode);
  };

  const handleCancelReservation = async () => {
    if (!reservation) return;
    const isConfirmed = await confirm({
      title: 'Cancel Reservation',
      message: 'Are you sure you want to cancel this reservation? This action is permanent and suite inventory will be released immediately.',
      confirmText: 'Yes, Cancel Reservation',
      cancelText: 'Keep Reservation',
      variant: 'danger',
    });

    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/v1/bookings/${reservation.id}/cancel`, {
        method: 'POST',
      }).then((r) => r.json());

      if (res.success) {
        toast.success('Reservation has been cancelled successfully.', 'Reservation Cancelled');
        setActionSuccess('Reservation successfully cancelled.');
        setReservation({ ...reservation, status: 'cancelled' });
      } else {
        const msg = res.message || 'Unable to cancel reservation.';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      setError('Failed to process cancellation.');
      toast.error('Failed to process cancellation.');
    }
  };

  const charges = reservation?.charges || [];
  const totalCharges = charges.length > 0
    ? charges.reduce((acc: number, c: any) => c.amount > 0 && c.status !== 'void' ? acc + c.amount : acc, 0)
    : (reservation?.totalAmount || 0);

  const totalPayments = charges.length > 0
    ? charges.reduce((acc: number, c: any) => c.amount < 0 && c.status === 'paid' ? acc + Math.abs(c.amount) : acc, 0)
    : (reservation?.paidAmount || reservation?.totalAmount || 0);

  const balanceDue = Math.max(0, Math.round((totalCharges - totalPayments) * 100) / 100);

  return (
    <div className="min-h-screen pb-24 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8 text-[#1C1815] bg-[#F7F4EE] font-sans selection:bg-[#B08D57]/20 selection:text-[#1C1815]">
      {/* Header (Hidden during print) */}
      <div className="text-center space-y-2 pt-4 no-print">
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#8C621E]">
          Guest Self-Service Portal
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-normal text-[#1C1815] tracking-tight">
          Manage Your Reservation
        </h1>
        <p className="text-xs sm:text-sm text-[#736B63] max-w-md mx-auto">
          Look up your stay details, check room allocations, view live folio transactions, and print your confirmed itinerary.
        </p>
      </div>

      {/* Lookup Search Form Card (Hidden during print) */}
      <div className="editorial-card p-6 sm:p-8 rounded-xl border border-[#DDD7CD] shadow-sm bg-white no-print">
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4A433D] mb-1.5 uppercase tracking-wider">
                Confirmation Code
              </label>
              <input
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="e.g. LMN-BI-4841"
                required
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-sm font-mono uppercase text-[#1C1815] placeholder-[#A69E95] font-bold focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A433D] mb-1.5 uppercase tracking-wider">
                Guest Email (Optional)
              </label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-sm text-[#1C1815] placeholder-[#A69E95] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] font-medium rounded-md text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Find Reservation</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Feedback Messages (Hidden during print) */}
      {error && (
        <div className="p-4 rounded-xl bg-[#FAF0ED] border border-[#EACEC8] text-[#8C2F22] text-xs flex items-center gap-2.5 no-print">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-[#EBF4EF] border border-[#C8E3D4] text-[#236446] text-xs flex items-center gap-2.5 no-print">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#236446]" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Reservation Result Dossier / Printable Folio Voucher */}
      {reservation && (
        <div className="editorial-card rounded-xl border border-[#DDD7CD] overflow-hidden shadow-sm space-y-6 bg-white printable-folio-invoice">
          {/* Header Banner */}
          <div className="p-6 bg-[#FAF8F5] border-b border-[#E5E0D8] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded bg-white text-[#8C621E] border border-[#ECE2CE]">
                  Confirmed Itinerary
                </span>
                <span className="text-xs text-[#736B63] font-mono">#{reservation.confirmationCode}</span>
              </div>
              <h2 className="text-2xl font-serif font-normal text-[#1C1815] mt-1.5">
                {reservation.property?.name || reservation.propertyName || 'LumenStay Sanctuary'}
              </h2>
            </div>

            <span
              className={`px-3 py-1 rounded-md text-xs font-medium uppercase tracking-wider border ${
                reservation.status === 'checked_in'
                  ? 'bg-[#EBF4EF] text-[#236446] border-[#C8E3D4]'
                  : reservation.status === 'cancelled'
                  ? 'bg-[#FAF0ED] text-[#8C2F22] border-[#EACEC8]'
                  : 'bg-[#FAF6EE] text-[#8C621E] border-[#ECE2CE]'
              }`}
            >
              {reservation.status.replace('_', ' ')}
            </span>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 pt-0">
            {/* 3-Column Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                <span className="text-[11px] text-[#736B63] uppercase font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#B08D57]" /> Stay Dates
                </span>
                <p className="text-sm font-semibold text-[#1C1815]">{reservation.checkInDate} → {reservation.checkOutDate}</p>
                <p className="text-[11px] text-[#736B63]">{reservation.totalNights} Nights</p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                <span className="text-[11px] text-[#736B63] uppercase font-medium flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-[#B08D57]" /> Suite
                </span>
                <p className="text-sm font-semibold text-[#1C1815]">
                  {reservation.roomType?.name || reservation.roomTypeName || 'Boutique Suite'}
                </p>
                <p className="text-[11px] text-[#8C621E] font-medium">
                  {reservation.assignedRoom?.roomNumber || reservation.roomNumber
                    ? `Assigned Room #${reservation.assignedRoom?.roomNumber || reservation.roomNumber}`
                    : 'Room Assigned at Check-In'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-1">
                <span className="text-[11px] text-[#736B63] uppercase font-medium flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#B08D57]" /> Digital Key
                </span>
                <p className="text-sm font-semibold text-[#236446]">
                  {reservation.digitalKeyIssued ? 'Digital Key Active' : 'Key Ready at Desk'}
                </p>
                <p className="text-[11px] text-[#736B63]">Lock: {reservation.lockType?.toUpperCase() || 'SALTO BLE'}</p>
              </div>
            </div>

            {/* Guest & Rate Details */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs space-y-2.5">
              <div className="flex justify-between text-[#4A433D]">
                <span className="text-[#736B63]">Guest Name</span>
                <span className="font-semibold text-[#1C1815]">
                  {reservation.guest
                    ? `${reservation.guest.firstName} ${reservation.guest.lastName}`
                    : reservation.guestName || 'Valued Guest'}
                </span>
              </div>
              <div className="flex justify-between text-[#4A433D]">
                <span className="text-[#736B63]">Rate Plan</span>
                <span className="text-[#8C621E] font-medium">
                  {reservation.ratePlan?.name || reservation.ratePlanName || 'Standard Flexible Rate'}
                </span>
              </div>
              <div className="flex justify-between text-[#4A433D]">
                <span className="text-[#736B63]">Nightly Rate</span>
                <span className="font-serif font-bold text-[#1C1815]">${reservation.nightlyRate} / night</span>
              </div>
            </div>

            {/* Live Folio Ledger */}
            <div className="rounded-xl bg-white border border-[#DDD7CD] overflow-hidden space-y-3 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8]">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#B08D57]" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1C1815]">
                    Itemized Folio Ledger & Settlement
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-medium bg-[#EBF4EF] text-[#236446] border border-[#C8E3D4] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  {balanceDue <= 0 ? 'Fully Settled ($0.00 Due)' : `$${balanceDue.toFixed(2)} Balance Open`}
                </span>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                {charges.length > 0 ? (
                  charges.map((charge: any) => {
                    const isPayment = charge.amount < 0 || charge.category === 'payment';
                    return (
                      <div
                        key={charge.id}
                        className="flex items-center justify-between p-2.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {isPayment ? (
                              <CreditCard className="w-3.5 h-3.5 text-[#236446] shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-[#736B63] shrink-0" />
                            )}
                            <span className={`font-medium ${isPayment ? 'text-[#236446]' : 'text-[#1C1815]'}`}>
                              {cleanReceiptDescription(charge.description)}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#736B63] flex flex-wrap items-center gap-2 pl-5.5">
                            <span className="font-mono text-[#1C1815] font-medium">{formatTimestamp(charge.createdAt || charge.postedAt)}</span>
                            <span>• {cleanPostedBy(charge.postedBy)}</span>
                            {charge.paymentRef && !charge.paymentRef.startsWith('ch_') && (
                              <span>• Ref: {charge.paymentRef}</span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`font-mono text-xs font-semibold ${
                            isPayment ? 'text-[#236446]' : 'text-[#1C1815]'
                          }`}
                        >
                          {isPayment ? `-$${Math.abs(charge.amount).toFixed(2)}` : `$${charge.amount.toFixed(2)}`}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="flex items-center justify-between p-2.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs">
                      <span className="text-[#4A433D]">Room Charges ({reservation.totalNights} nts)</span>
                      <span className="font-mono text-[#1C1815]">${((reservation.nightlyRate || 0) * (reservation.totalNights || 1)).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs">
                      <span className="text-[#4A433D]">State & Lodging Taxes (12%)</span>
                      <span className="font-mono text-[#1C1815]">${(reservation.taxAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs">
                      <span className="text-[#4A433D]">Property Resort Fee</span>
                      <span className="font-mono text-[#1C1815]">${(reservation.resortFee || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-md bg-[#EBF4EF] border border-[#C8E3D4] text-xs">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-[#236446]" />
                        <span className="text-[#236446] font-medium">Stripe Payment Captured (Settled)</span>
                      </div>
                      <span className="font-mono text-[#236446] font-bold">-${(reservation.paidAmount || reservation.totalAmount || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Folio Summary Footer */}
              <div className="pt-3 border-t border-[#E5E0D8] flex items-center justify-between text-xs">
                <span className="text-[#736B63]">Net Outstanding Balance:</span>
                <span className="font-serif font-bold text-sm text-[#236446]">
                  ${balanceDue.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 no-print">
              <button
                onClick={() => {
                  downloadFolioDocument({
                    confirmationCode: reservation.confirmationCode,
                    propertyName: reservation.property?.name || reservation.propertyName || 'LumenStay Hotel',
                    propertyAddress: reservation.property?.address || `${reservation.property?.city || 'Aspen'}, ${reservation.property?.state || 'CO'}`,
                    propertyPhone: reservation.property?.phone || '+1 (800) 555-0199',
                    guestName: reservation.guest ? `${reservation.guest.firstName} ${reservation.guest.lastName}` : reservation.guestName || 'Valued Guest',
                    roomNumber: reservation.assignedRoom?.roomNumber || reservation.roomNumber || 'Assigned at Check-In',
                    checkInDate: reservation.checkInDate,
                    checkOutDate: reservation.checkOutDate,
                    charges: charges.length > 0 ? charges : [
                      {
                        id: 'room_charge_default',
                        category: 'room_rate',
                        description: `Room Charge (${reservation.totalNights} nts @ $${reservation.nightlyRate}/nt)`,
                        amount: (reservation.nightlyRate || 0) * (reservation.totalNights || 1),
                        postedBy: 'Online Prepayment',
                        createdAt: reservation.createdAt,
                      },
                      {
                        id: 'tax_default',
                        category: 'tax',
                        description: 'State & Lodging Taxes (12%)',
                        amount: reservation.taxAmount || 0,
                        postedBy: 'Online Prepayment',
                        createdAt: reservation.createdAt,
                      },
                      {
                        id: 'resort_fee_default',
                        category: 'resort_fee',
                        description: 'Property Resort & Amenity Fee',
                        amount: reservation.resortFee || 0,
                        postedBy: 'Online Prepayment',
                        createdAt: reservation.createdAt,
                      },
                      {
                        id: 'payment_default',
                        category: 'payment',
                        description: 'Payment Received — Card on File',
                        amount: -(reservation.paidAmount || reservation.totalAmount || 0),
                        postedBy: 'Online Prepayment',
                        createdAt: reservation.createdAt,
                      }
                    ],
                    totalCharges,
                    totalPayments,
                    balanceDue,
                  });
                }}
                className="px-4 py-2 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] text-xs font-medium flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save Folio</span>
              </button>

              {reservation.status === 'confirmed' && (
                <button
                  onClick={handleCancelReservation}
                  className="px-4 py-2 rounded-md bg-[#FAF0ED] hover:bg-[#F3D2C9] text-[#8C2F22] border border-[#EACEC8] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                >
                  <XCircle className="w-4 h-4" /> Cancel Reservation
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingLookup;
