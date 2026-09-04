import React, { useState, useEffect } from 'react';
import type { Room } from '../types';
import { X, Key, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

interface CheckInModalProps {
  reservation: any;
  propertyId: string;
  onClose: () => void;
  onCheckInSuccess: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  reservation,
  propertyId,
  onClose,
  onCheckInSuccess,
}) => {
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(reservation?.assignedRoomId || '');
  const [idType, setIdType] = useState<string>(reservation?.guest?.idDocumentType || 'Passport');
  const [idNumber, setIdNumber] = useState<string>(
    reservation?.guest?.idDocumentNumber || 'USA-P' + Math.floor(1000000 + Math.random() * 9000000)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/rooms?propertyId=${propertyId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const readyRooms = res.data.filter((rm: any) =>
            (!rm.isOccupied && rm.status !== 'out_of_order') || rm.id === reservation?.assignedRoomId
          );
          setAvailableRooms(readyRooms);

          if (!selectedRoomId && readyRooms.length > 0) {
            const match =
              readyRooms.find((rm: any) => rm.roomTypeId === reservation?.roomTypeId) || readyRooms[0];
            setSelectedRoomId(match.id);
          }
        }
      })
      .catch((err) => console.error('Failed to load check-in rooms:', err));
  }, [propertyId, reservation, selectedRoomId]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      setError('Please select an available clean room to assign.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch(`/api/v1/rooms/reservations/${reservation.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedRoomId: selectedRoomId,
          idDocumentType: idType,
          idDocumentNumber: idNumber,
        }),
      }).then((r) => r.json());

      if (res.success) {
        onCheckInSuccess();
      } else {
        setError(res.error || 'Failed to complete guest check-in.');
      }
    } catch (err: any) {
      setError(err.message || 'Check-in request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRoom = availableRooms.find((r) => r.id === selectedRoomId);
  const guestName = reservation.guest
    ? `${reservation.guest.firstName} ${reservation.guest.lastName}`
    : reservation.guestName || 'Valued Guest';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-[#DDD7CD] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-fadeIn text-[#1C1815] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-[#FAF6EE] text-[#8C621E] border border-[#ECE2CE]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-normal text-lg text-[#1C1815]">Front Desk Guest Check-In</h3>
              <p className="text-xs text-[#736B63]">
                {guestName} • <span className="font-mono text-[#1C1815] font-semibold">{reservation.confirmationCode}</span>
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

        {/* Content Form */}
        <form onSubmit={handleCheckIn} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-[#FAF0ED] border border-[#EACEC8] text-[#8C2F22] text-xs">
              {error}
            </div>
          )}

          {/* Room Assignment */}
          <div>
            <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1.5">
              Room Assignment ({availableRooms.length} Ready)
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#DDD7CD] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:outline-none transition"
            >
              {availableRooms.map((rm) => (
                <option key={rm.id} value={rm.id}>
                  Room #{rm.roomNumber} — Floor {rm.floor} ({(rm as any).roomTypeName || 'Deluxe Suite'} • {rm.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* ID Verification */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#1C1815] font-semibold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#236446]" /> Government ID Registration
              </span>
              <span className="text-[10px] text-[#236446] font-medium">Compliance</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#736B63] mb-1 uppercase">ID Document Type</label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#DDD7CD] rounded text-xs text-[#1C1815] focus:outline-none"
                >
                  <option value="Passport">Passport</option>
                  <option value="Driver's License">Driver's License</option>
                  <option value="National ID">National ID</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#736B63] mb-1 uppercase">Document Number</label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#DDD7CD] rounded text-xs text-[#1C1815] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Key & Room Card Info */}
          <div className="p-3.5 rounded-xl bg-white border border-[#DDD7CD] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#736B63] block text-[11px]">Selected Room Allocation</span>
              <span className="font-serif font-bold text-base text-[#1C1815]">
                {selectedRoom ? `Suite #${selectedRoom.roomNumber}` : 'Assigning Room...'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[#736B63] block text-[11px]">Digital Key Bus</span>
              <span className="font-semibold text-xs text-[#236446] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Instant BLE Provisioning
              </span>
            </div>
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
              disabled={isSubmitting || !selectedRoomId}
              className="px-5 py-2.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking In & Provisioning Key...</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>Complete Check-In & Issue Key</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckInModal;
