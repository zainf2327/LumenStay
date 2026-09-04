import React, { useState } from 'react';
import { X, Wrench, AlertTriangle } from 'lucide-react';
import type { Room } from '../types';

interface ReportMaintenanceModalProps {
  room: Room;
  onClose: () => void;
  onSubmit: (issueData: {
    category: string;
    description: string;
    priority: 'urgent' | 'standard';
    takeOutOfOrder: boolean;
  }) => void;
}

const ISSUE_CATEGORIES = [
  'HVAC & Climate Control',
  'Plumbing & Drainage',
  'Lighting & Electrical',
  'Lock & Key Access (Salto/BLE)',
  'Furniture & Fixture Damage',
  'Deep Steam Clean Needed',
];

export const ReportMaintenanceModal: React.FC<ReportMaintenanceModalProps> = ({
  room,
  onClose,
  onSubmit,
}) => {
  const [category, setCategory] = useState(ISSUE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'standard'>('standard');
  const [takeOutOfOrder, setTakeOutOfOrder] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onSubmit({
      category,
      description: description.trim(),
      priority,
      takeOutOfOrder,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="relative w-full max-w-lg bg-white border border-[#DDD7CD] rounded-2xl p-6 sm:p-8 shadow-2xl text-[#1C1815] space-y-6 animate-fadeIn">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] text-[#8C621E] border border-[#ECE2CE] flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-[#1C1815]">
                Report Issue: Room #{room.roomNumber}
              </h2>
              <p className="text-xs text-[#736B63]">Escalate maintenance or repairs to engineering</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#F4EFE6] text-[#736B63] hover:text-[#1C1815] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1.5">
              Issue Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#DDD7CD] rounded-md text-xs text-[#1C1815] focus:border-[#B08D57] focus:outline-none transition"
            >
              {ISSUE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1.5">
              Problem Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Detail specific defect, location in suite, or guest report..."
              className="w-full px-3.5 py-2.5 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-xs text-[#1C1815] placeholder-[#A69E95] focus:outline-none focus:border-[#B08D57] focus:bg-white transition"
            />
          </div>

          {/* Priority Toggle */}
          <div>
            <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1.5">
              Urgency Priority
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPriority('standard')}
                className={`py-2 px-3 rounded-md text-xs font-medium border transition cursor-pointer ${
                  priority === 'standard'
                    ? 'bg-[#FAF6EE] text-[#1C1815] border-[#B08D57]'
                    : 'bg-white text-[#736B63] border-[#DDD7CD]'
                }`}
              >
                Standard Engineering
              </button>

              <button
                type="button"
                onClick={() => setPriority('urgent')}
                className={`py-2 px-3 rounded-md text-xs font-medium border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  priority === 'urgent'
                    ? 'bg-[#FAF0ED] text-[#8C2F22] border-[#EACEC8] font-bold'
                    : 'bg-white text-[#736B63] border-[#DDD7CD]'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Urgent (Active Guest)</span>
              </button>
            </div>
          </div>

          {/* Out of order checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] cursor-pointer">
            <input
              type="checkbox"
              checked={takeOutOfOrder}
              onChange={(e) => setTakeOutOfOrder(e.target.checked)}
              className="rounded text-[#B08D57] focus:ring-[#B08D57]"
            />
            <span className="text-xs text-[#4A433D]">
              Take suite out of order immediately (blocks guest check-in)
            </span>
          </label>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E5E0D8] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-white border border-[#DDD7CD] text-[#736B63] hover:text-[#1C1815] text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] text-xs font-medium transition cursor-pointer"
            >
              Submit Ticket to Engineering
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportMaintenanceModal;
