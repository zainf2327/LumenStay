import React, { useState } from 'react';
import { X, Sparkles, Check, Bed, Bath, Coffee, Wind, ShieldCheck } from 'lucide-react';
import type { Room } from '../types';

interface HousekeepingChecklistModalProps {
  room: Room;
  onClose: () => void;
  onComplete: (notes: string) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  category: 'linens' | 'bath' | 'amenities' | 'ambience';
  icon: React.ComponentType<{ className?: string }>;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'linen_change', label: 'Fresh Frette 400-thread luxury linens & pillowcases', category: 'linens', icon: Bed },
  { id: 'duvet_check', label: 'Goose down duvet fluffed & bed styled to brand standard', category: 'linens', icon: Bed },
  { id: 'bath_deep_clean', label: 'Soaking tub & rainfall shower deep sanitized and dried', category: 'bath', icon: Bath },
  { id: 'towels_plush', label: 'Restock 6 plush bath sheets, hand towels & bathmats', category: 'bath', icon: Bath },
  { id: 'artisan_amenities', label: 'Restock botanical bath & body amenities', category: 'amenities', icon: Sparkles },
  { id: 'espresso_minibar', label: 'Espresso capsules, artisanal teas & crystal glassware restocked', category: 'amenities', icon: Coffee },
  { id: 'surfaces_vacuum', label: 'Hardwood & wool rugs vacuumed, glass surfaces streak-free', category: 'ambience', icon: Sparkles },
  { id: 'climate_scent', label: 'Thermostat set to 68°F (20°C) & signature scent misted', category: 'ambience', icon: Wind },
];

export const HousekeepingChecklistModal: React.FC<HousekeepingChecklistModalProps> = ({
  room,
  onClose,
  onComplete,
}) => {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  const toggleItem = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCheckAll = () => {
    if (checkedIds.length === CHECKLIST_ITEMS.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(CHECKLIST_ITEMS.map((item) => item.id));
    }
  };

  const progressPercent = Math.round((checkedIds.length / CHECKLIST_ITEMS.length) * 100);
  const isAllComplete = checkedIds.length === CHECKLIST_ITEMS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-xl bg-white border border-[#DDD7CD] rounded-2xl p-6 sm:p-8 shadow-2xl text-[#1C1815] space-y-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E5E0D8]">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider text-[#236446] bg-[#EBF4EF] border border-[#C8E3D4] mb-1.5">
              <span>Turnover Checklist</span>
              <span>•</span>
              <span>Boutique Standard</span>
            </div>
            <h2 className="text-2xl font-serif text-[#1C1815]">
              Room #{room.roomNumber} Inspection
            </h2>
            <p className="text-xs text-[#736B63] mt-0.5">{(room as any).roomTypeName || 'Boutique Suite'}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#F4EFE6] text-[#736B63] hover:text-[#1C1815] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#736B63]">Standard Turnover Completion</span>
            <span className="font-serif font-bold text-[#236446]">
              {checkedIds.length} / {CHECKLIST_ITEMS.length} Items ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#E5E0D8] overflow-hidden">
            <div
              className="h-full bg-[#236446] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleCheckAll}
              className="text-[11px] text-[#1C1815] hover:underline font-medium cursor-pointer"
            >
              {checkedIds.length === CHECKLIST_ITEMS.length ? 'Deselect All' : 'Select All 8 Items'}
            </button>
          </div>
        </div>

        {/* Itemized Tasks */}
        <div className="space-y-2.5">
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = checkedIds.includes(item.id);
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  isChecked
                    ? 'bg-[#EBF4EF] border-[#C8E3D4] text-[#1C1815]'
                    : 'bg-white border-[#DDD7CD] hover:border-[#B08D57] text-[#4A433D]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center transition shrink-0 ${
                      isChecked
                        ? 'bg-[#236446] border-[#236446] text-white'
                        : 'border-[#DDD7CD] bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs ${isChecked ? 'line-through text-[#736B63]' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </div>

                <Icon className={`w-4 h-4 shrink-0 ${isChecked ? 'text-[#236446]' : 'text-[#A69E95]'}`} />
              </div>
            );
          })}
        </div>

        {/* Housekeeper Quirks/Notes */}
        <div>
          <label className="block text-xs font-medium text-[#736B63] mb-1.5">
            Turnover Notes / Room Condition (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Extra pillows provided; fireplace pilot verified"
            className="w-full px-3.5 py-2.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#1C1815] focus:outline-none focus:border-[#B08D57] focus:bg-white transition"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#E5E0D8] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-white border border-[#DDD7CD] text-[#736B63] hover:text-[#1C1815] text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!isAllComplete}
            onClick={() => onComplete(notes)}
            className="px-5 py-2.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] disabled:opacity-40 text-[#F7F4EE] text-xs font-medium transition flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-[#B08D57]" />
            <span>Complete Checklist & Mark Clean</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HousekeepingChecklistModal;
