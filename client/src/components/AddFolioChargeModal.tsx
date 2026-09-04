import React, { useState } from 'react';
import { X, PlusCircle, Coffee, Sparkles, Car, Wine, UtensilsCrossed, Loader2 } from 'lucide-react';
import type { FolioCharge } from '../types';

interface AddFolioChargeModalProps {
  reservationId: string;
  roomNumber?: string;
  guestName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddFolioChargeModal: React.FC<AddFolioChargeModalProps> = ({
  reservationId,
  roomNumber,
  guestName,
  onClose,
  onSuccess,
}) => {
  const [category, setCategory] = useState<FolioCharge['category']>('dining');
  const [description, setDescription] = useState('In-Room Dining — Artisan Dinner');
  const [amount, setAmount] = useState<string>('65.00');
  const [postedBy, setPostedBy] = useState('Front Desk Concierge');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    { label: 'Room Service Dinner', cat: 'dining', desc: 'In-Room Dining — Artisan Dinner', amt: '65.00', icon: UtensilsCrossed },
    { label: 'Spa Treatment', cat: 'spa', desc: 'Alpine Cedar Body Treatment (60 min)', amt: '180.00', icon: Sparkles },
    { label: 'Minibar Refresh', cat: 'minibar', desc: 'Premium Minibar Re-stock (Champagne & Artisan Snacks)', amt: '48.00', icon: Wine },
    { label: 'Valet Parking', cat: 'parking', desc: 'Overnight Heated Valet Parking', amt: '35.00', icon: Car },
    { label: 'Espresso Bar', cat: 'dining', desc: 'Lobby Espresso Bar & Pastries', amt: '18.50', icon: Coffee },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setCategory(p.cat as any);
    setDescription(p.desc);
    setAmount(p.amt);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setError('Please enter a valid charge amount greater than $0.');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description for this charge.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch(`/api/v1/folios/${reservationId}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          description: description.trim(),
          amount: parsedAmt,
          postedBy,
        }),
      }).then((r) => r.json());

      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Failed to post charge to guest folio.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while posting charge.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-[#DDD7CD] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-fadeIn text-[#1C1815] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-[#FAF6EE] text-[#8C621E] border border-[#ECE2CE]">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-normal text-lg text-[#1C1815]">Post Incidental Folio Charge</h3>
              <p className="text-xs text-[#736B63]">
                Room #{roomNumber || '—'} • {guestName || 'In-House Guest'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#736B63] hover:text-[#1C1815] p-1.5 rounded-md hover:bg-[#F4EFE6] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-[#FAF0ED] border border-[#EACEC8] text-[#8C2F22] text-xs">
              {error}
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-2">
              Popular Guest Incidentals
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {presets.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="p-2.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#B08D57] hover:bg-white text-left transition text-xs flex flex-col justify-between space-y-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="w-3.5 h-3.5 text-[#B08D57]" />
                      <span className="font-mono text-xs font-bold text-[#1C1815]">${p.amt}</span>
                    </div>
                    <span className="text-[11px] text-[#4A433D] font-medium truncate block">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2 bg-white border border-[#DDD7CD] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:outline-none transition"
              >
                <option value="dining">Food & Beverage (Restaurant)</option>
                <option value="minibar">In-Room Minibar Refreshment</option>
                <option value="spa">Spa & Wellness</option>
                <option value="parking">Valet Parking</option>
                <option value="late_checkout">Late Checkout Surcharge</option>
                <option value="adjustment">Manager Adjustment / Fee</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1">
                Charge Amount ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#DDD7CD] rounded-md text-sm text-[#1C1815] font-mono font-bold focus:border-[#B08D57] focus:outline-none transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1">
              Description / Memo
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Lobby Cocktail Lounge (2 drinks)"
              className="w-full px-3.5 py-2 bg-white border border-[#DDD7CD] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:outline-none transition"
            />
          </div>

          {/* Posted By Staff */}
          <div>
            <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1">
              Authorizing Agent
            </label>
            <input
              type="text"
              value={postedBy}
              onChange={(e) => setPostedBy(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-sm text-[#4A433D] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-white border border-[#DDD7CD] text-[#736B63] hover:text-[#1C1815] text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting to Folio Ledger...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Post ${parseFloat(amount || '0').toFixed(2)} to Suite</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFolioChargeModal;
