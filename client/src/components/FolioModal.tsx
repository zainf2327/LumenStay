import React, { useState, useEffect } from 'react';
import type { FolioSummary } from '../types';
import { X, Receipt, PlusCircle, CreditCard, Download, Loader2 } from 'lucide-react';
import { downloadFolioDocument } from '../utils/folioExport.util';

interface FolioModalProps {
  reservationId: string;
  onClose: () => void;
}

export const FolioModal: React.FC<FolioModalProps> = ({ reservationId, onClose }) => {
  const [folio, setFolio] = useState<FolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Add Charge state
  const [chargeCategory, setChargeCategory] = useState<string>('minibar');
  const [chargeDesc, setChargeDesc] = useState<string>('');
  const [chargeAmount, setChargeAmount] = useState<string>('45.00');

  // Payment state
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchFolio = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/folios/${reservationId}`).then(r => r.json());
      if (res.success && res.data) {
        setFolio(res.data);
        setPaymentAmount(res.data.balanceDue > 0 ? res.data.balanceDue.toString() : '0');
      }
    } catch (err) {
      console.error('Failed to fetch folio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolio();
  }, [reservationId]);

  const handlePostCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeDesc || !chargeAmount) return;

    try {
      setIsProcessing(true);
      const res = await fetch(`/api/v1/folios/${reservationId}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: chargeCategory,
          description: chargeDesc,
          amount: parseFloat(chargeAmount),
          postedBy: 'Front Desk Agent',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddCharge(false);
        setChargeDesc('');
        fetchFolio();
      }
    } catch (err) {
      console.error('Failed to post charge:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;

    try {
      setIsProcessing(true);
      const res = await fetch(`/api/v1/folios/${reservationId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          paymentMethod: 'Credit Card (Tokenized)',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPayment(false);
        fetchFolio();
      }
    } catch (err) {
      console.error('Failed to process payment:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveFolio = () => {
    if (!folio) return;
    downloadFolioDocument({
      confirmationCode: folio.confirmationCode,
      propertyName: folio.propertyName,
      propertyAddress: folio.propertyAddress,
      propertyPhone: folio.propertyPhone,
      guestName: folio.guestName,
      roomNumber: folio.roomNumber,
      checkInDate: folio.checkInDate,
      checkOutDate: folio.checkOutDate,
      charges: folio.charges,
      totalCharges: folio.totalCharges,
      totalPayments: folio.totalPayments,
      balanceDue: folio.balanceDue,
    });
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
      return 'Online Prepayment';
    }
    return postedBy;
  };

  const categoryLabels: Record<string, string> = {
    room_rate: 'Room Charge',
    tax: 'Lodging Tax',
    resort_fee: 'Resort Fee',
    dining: 'Food & Beverage',
    minibar: 'In-Room Refreshment',
    parking: 'Valet Parking',
    spa: 'Spa & Wellness',
    late_checkout: 'Late Checkout Fee',
    adjustment: 'Manager Adjustment',
    payment: 'Payment Credit',
  };

  const currentGeneratedTime = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-[#DDD7CD] rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-fadeIn text-[#1C1815]">
        {/* Interactive Modal Header (Hidden during Print) */}
        <div className="px-6 py-4.5 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-[#FAF6EE] text-[#8C621E] border border-[#ECE2CE]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-normal text-lg text-[#1C1815]">Guest Folio & Itemized Receipt</h3>
              <p className="text-xs text-[#736B63]">
                Code: <span className="font-mono text-[#1C1815] font-semibold">{folio?.confirmationCode}</span> • Room: <span className="text-[#1C1815] font-semibold">{folio?.roomNumber}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveFolio}
              className="px-3 py-1.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="Save Folio (PDF)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Folio (PDF)</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#736B63] hover:text-[#1C1815] p-1.5 rounded-md hover:bg-[#F4EFE6] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Folio Document Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 printable-folio-invoice">
          {loading ? (
            <div className="py-12 text-center text-[#736B63] text-sm no-print">
              <Loader2 className="w-6 h-6 text-[#B08D57] animate-spin mx-auto mb-2" />
              Loading itemized guest folio...
            </div>
          ) : folio ? (
            <>
              {/* Hotel & Guest Formal Receipt Header */}
              <div className="p-5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-4 print:bg-white print:border-black print:p-0 print:mb-4">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-[#E5E0D8] print:border-black">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C621E] print:text-black block">
                      LumenStay Luxury Hospitality Group
                    </span>
                    <h4 className="font-serif font-bold text-[#1C1815] text-xl mt-0.5 print:text-black">{folio.propertyName}</h4>
                    <p className="text-xs text-[#736B63] print:text-black">{folio.propertyAddress}</p>
                    <p className="text-xs text-[#736B63] print:text-black">Tel: {folio.propertyPhone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1C1815] print:text-black block">
                      Official Folio Invoice
                    </span>
                    <span className="text-xs font-mono font-bold text-[#1C1815] print:text-black block">
                      #{folio.confirmationCode}
                    </span>
                    <span className="text-[11px] text-[#736B63] print:text-black block mt-0.5">
                      Issued: {currentGeneratedTime}
                    </span>
                  </div>
                </div>

                {/* Lead Guest & Itinerary Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#736B63] print:text-black uppercase tracking-wider block font-medium">Lead Guest</span>
                    <span className="font-semibold text-[#1C1815] print:text-black">{folio.guestName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#736B63] print:text-black uppercase tracking-wider block font-medium">Suite Allocation</span>
                    <span className="font-semibold text-[#1C1815] print:text-black">Room #{folio.roomNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#736B63] print:text-black uppercase tracking-wider block font-medium">Arrival Date</span>
                    <span className="font-semibold text-[#1C1815] print:text-black">{folio.checkInDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#736B63] print:text-black uppercase tracking-wider block font-medium">Departure Date</span>
                    <span className="font-semibold text-[#1C1815] print:text-black">{folio.checkOutDate}</span>
                  </div>
                </div>
              </div>

              {/* Operations Action Buttons (Hidden on Print) */}
              <div className="flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowAddCharge(!showAddCharge); setShowPayment(false); }}
                    className="px-3.5 py-2 rounded-md text-xs font-medium bg-white hover:bg-[#FAF8F5] text-[#1C1815] border border-[#DDD7CD] flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-[#B08D57]" /> Post Incidental Charge
                  </button>
                  {folio.balanceDue > 0 && (
                    <button
                      onClick={() => { setShowPayment(!showPayment); setShowAddCharge(false); }}
                      className="px-3.5 py-2 rounded-md text-xs font-medium bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" /> Settle Balance (${folio.balanceDue.toFixed(2)})
                    </button>
                  )}
                </div>

                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  folio.status === 'settled'
                    ? 'bg-[#EBF4EF] text-[#236446] border-[#C8E3D4]'
                    : 'bg-[#FAF0ED] text-[#8C2F22] border-[#EACEC8]'
                }`}>
                  {folio.status === 'settled' ? '✓ Folio Settled ($0.00 Due)' : '⚠️ Balance Due at Checkout'}
                </span>
              </div>

              {/* Add Incidental Form Drawer (Hidden on Print) */}
              {showAddCharge && (
                <form onSubmit={handlePostCharge} className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DDD7CD] space-y-3 no-print animate-fadeIn">
                  <div className="text-xs font-semibold text-[#1C1815] uppercase tracking-wider">
                    Post Incidental Room Charge:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-[#736B63] block mb-1">Category</label>
                      <select
                        value={chargeCategory}
                        onChange={(e) => setChargeCategory(e.target.value)}
                        className="w-full bg-white border border-[#DDD7CD] rounded-md px-2.5 py-1.5 text-xs text-[#1C1815]"
                      >
                        <option value="minibar">Minibar / Refreshment</option>
                        <option value="dining">Restaurant / Room Service</option>
                        <option value="parking">Valet Parking</option>
                        <option value="spa">Spa / Experience</option>
                        <option value="late_checkout">Late Checkout Fee</option>
                        <option value="adjustment">Manager Adjustment</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-[#736B63] block mb-1">Description</label>
                      <input
                        type="text"
                        required
                        value={chargeDesc}
                        onChange={(e) => setChargeDesc(e.target.value)}
                        placeholder="e.g. Cabernet Sauvignon"
                        className="w-full bg-white border border-[#DDD7CD] rounded-md px-2.5 py-1.5 text-xs text-[#1C1815]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#736B63] block mb-1">Amount ($ USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={chargeAmount}
                        onChange={(e) => setChargeAmount(e.target.value)}
                        className="w-full bg-white border border-[#DDD7CD] rounded-md px-2.5 py-1.5 text-xs text-[#1C1815] font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddCharge(false)}
                      className="px-3 py-1.5 text-xs text-[#736B63] hover:text-[#1C1815]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-4 py-1.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] text-xs font-medium cursor-pointer"
                    >
                      {isProcessing ? 'Posting...' : 'Post to Room'}
                    </button>
                  </div>
                </form>
              )}

              {/* Settle Payment Drawer (Hidden on Print) */}
              {showPayment && (
                <form onSubmit={handleProcessPayment} className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DDD7CD] space-y-3 no-print animate-fadeIn">
                  <div className="text-xs font-semibold text-[#1C1815] uppercase tracking-wider">
                    Settle Guest Balance:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[#736B63] block mb-1">Payment Amount ($ USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full bg-white border border-[#DDD7CD] rounded-md px-2.5 py-1.5 text-xs text-[#1C1815] font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#736B63] block mb-1">Payment Method</label>
                      <input
                        type="text"
                        disabled
                        value="Card on File (Instant Capture)"
                        className="w-full bg-[#FAF8F5] border border-[#DDD7CD] rounded-md px-2.5 py-1.5 text-xs text-[#736B63]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPayment(false)}
                      className="px-3 py-1.5 text-xs text-[#736B63] hover:text-[#1C1815]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-4 py-1.5 rounded-md bg-[#236446] hover:bg-[#1C5138] text-white text-xs font-medium cursor-pointer"
                    >
                      {isProcessing ? 'Processing...' : 'Authorize & Settle'}
                    </button>
                  </div>
                </form>
              )}

              {/* Line Items Table with Exact Timestamps */}
              <div className="border border-[#DDD7CD] rounded-xl overflow-hidden shadow-sm print:border-black print:rounded-none">
                <table className="w-full text-left text-xs print:text-[9pt]">
                  <thead className="bg-[#FAF8F5] text-[#736B63] font-medium border-b border-[#E5E0D8] print:bg-[#F5F3EE] print:text-black print:border-black">
                    <tr>
                      <th className="p-3 print:p-2">Timestamp</th>
                      <th className="p-3 print:p-2">Category & Description</th>
                      <th className="p-3 print:p-2">Authorizer / Method</th>
                      <th className="p-3 print:p-2 text-right">Amount ($ USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E0D8] print:divide-black">
                    {folio.charges.map((item) => {
                      const isPayment = item.amount < 0 || item.category === 'payment';
                      const rawTime = item.createdAt || (item as any).postedAt;
                      return (
                        <tr key={item.id} className="hover:bg-[#FAF8F5] transition print:hover:bg-transparent">
                          <td className="p-3 print:p-2 whitespace-nowrap text-[#1C1815] font-medium font-mono text-[11px] print:text-black">
                            {formatTimestamp(rawTime)}
                          </td>
                          <td className="p-3 print:p-2">
                            <span className="font-semibold text-[#1C1815] print:text-black block">
                              {categoryLabels[item.category] || item.category}
                            </span>
                            <span className="text-[11px] text-[#736B63] print:text-black">{cleanReceiptDescription(item.description)}</span>
                          </td>
                          <td className="p-3 print:p-2 text-[#736B63] print:text-black">
                            <span className="text-[11px] block text-[#4A433D] print:text-black font-medium">
                              {cleanPostedBy(item.postedBy)}
                            </span>
                            {item.paymentRef && !item.paymentRef.startsWith('ch_') && (
                              <span className="text-[10px] text-[#A69E95] print:text-black font-mono">Ref: {item.paymentRef}</span>
                            )}
                          </td>
                          <td className="p-3 print:p-2 text-right font-mono font-semibold">
                            <span className={isPayment ? 'text-[#236446] print:text-black font-bold' : 'text-[#1C1815] print:text-black'}>
                              {isPayment ? `-$${Math.abs(item.amount).toFixed(2)}` : `$${item.amount.toFixed(2)}`}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Folio Financial Summary & Settlement Note */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2.5 print:bg-white print:border-black print:rounded-none">
                <div className="flex justify-between text-xs text-[#4A433D] print:text-black">
                  <span className="text-[#736B63] print:text-black">Total Lodging & Incidental Charges:</span>
                  <span className="font-mono font-medium">${folio.totalCharges.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-xs text-[#4A433D] print:text-black">
                  <span className="text-[#736B63] print:text-black">Total Payments & Captured Credits:</span>
                  <span className="font-mono font-medium text-[#236446] print:text-black">-${folio.totalPayments.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#1C1815] pt-2 border-t border-[#DDD7CD] print:border-black print:text-black">
                  <span>Net Outstanding Balance:</span>
                  <span className={`font-mono ${folio.balanceDue > 0 ? 'text-[#8C2F22]' : 'text-[#236446]'} print:text-black`}>
                    ${folio.balanceDue.toFixed(2)} USD
                  </span>
                </div>

                <div className="pt-2 text-[11px] text-[#736B63] print:text-black flex items-center justify-between border-t border-[#E5E0D8] print:border-black">
                  <span>Status: {folio.balanceDue <= 0 ? 'Closed & Fully Settled' : 'Balance Outstanding'}</span>
                  <span className="font-mono text-[10px]">Tax ID: US-84-9102834</span>
                </div>
              </div>

              {/* Print-Only Signature & Hotel Auditor Sign-off */}
              <div className="hidden print:block pt-8 text-[10pt] text-black">
                <div className="grid grid-cols-2 gap-12 pt-6">
                  <div>
                    <div className="border-b border-black mb-1 w-56"></div>
                    <span className="text-[9pt] uppercase tracking-wider text-black font-medium">Guest Signature</span>
                  </div>
                  <div>
                    <div className="border-b border-black mb-1 w-56"></div>
                    <span className="text-[9pt] uppercase tracking-wider text-black font-medium">Front Desk Auditor Sign-Off</span>
                  </div>
                </div>
                <p className="text-[8pt] text-gray-700 mt-6 text-center italic">
                  Thank you for choosing LumenStay. We look forward to welcoming you back.
                </p>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-[#736B63] text-sm">
              Folio could not be loaded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolioModal;
