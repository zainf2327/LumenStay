import React, { useState, useEffect } from 'react';
import { X, UserPlus, ShieldCheck, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import type { Room, RoomType, RatePlan } from '../types';
import { useToast } from '../context/ToastContext';

interface WalkInBookingModalProps {
  propertyId: string;
  onClose: () => void;
  onSuccess: () => void;
}


export const WalkInBookingModal: React.FC<WalkInBookingModalProps> = ({
  propertyId,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);


  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedRatePlanId, setSelectedRatePlanId] = useState<string>('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idType, setIdType] = useState('Passport');
  const [idNumber, setIdNumber] = useState('USA-' + Math.floor(1000000 + Math.random() * 9000000));

  const [checkInDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [checkOutDate, setCheckOutDate] = useState<string>(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const adultCount = 1;
  const specialRequests = '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/rooms?propertyId=${propertyId}`).then((r) => r.json()),
      fetch(`/api/v1/properties/${propertyId}`).then((r) => r.json()),
    ])
      .then(([roomsRes, propRes]) => {
        if (roomsRes.success && Array.isArray(roomsRes.data)) {
          const cleanRooms = roomsRes.data.filter(
            (r: Room) => !r.isOccupied && (r.status === 'clean' || r.status === 'inspected')
          );
          setRooms(cleanRooms);
          if (cleanRooms.length > 0) {
            setSelectedRoomId(cleanRooms[0].id);
          }
        }
        if (propRes.success && propRes.data) {
          if (propRes.data.roomTypes) setRoomTypes(propRes.data.roomTypes);
          if (propRes.data.ratePlans) {
            setRatePlans(propRes.data.ratePlans);
            if (propRes.data.ratePlans.length > 0) {
              setSelectedRatePlanId(propRes.data.ratePlans[0].id);
            }
          }
        }
      })
      .catch((err) => console.error('Failed to load walk-in reference data:', err));
  }, [propertyId]);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const matchedRoomType = roomTypes.find((rt) => rt.id === selectedRoom?.roomTypeId);
  const selectedRatePlan = ratePlans.find((rp) => rp.id === selectedRatePlanId);

  const nightlyRate = matchedRoomType
    ? Math.round(matchedRoomType.basePrice * (selectedRatePlan?.priceModifier || 1.0))
    : 350;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      setError('Please select an available clean room.');
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError('Guest first name, last name, and email are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        propertyId,
        roomTypeId: selectedRoom?.roomTypeId || roomTypes[0]?.id,
        ratePlanId: selectedRatePlanId || ratePlans[0]?.id,
        checkInDate,
        checkOutDate,
        adultCount,
        childCount: 0,
        guest: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || '+1-555-0199',
        },
        payment: {
          token: 'pm_card_walkin_desk',
          amount: nightlyRate,
        },
        specialRequests,
      };

      const res = await fetch('/api/v1/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      if (res.success && res.data) {
        const reservationId = res.data.id;
        const code = res.data.confirmationCode;
        // Instant check in
        await fetch(`/api/v1/rooms/reservations/${reservationId}/check-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: selectedRoomId,
            idType,
            idNumber,
            vehiclePlate: 'WALK-IN',
            depositAmount: 150,
          }),
        });

        toast.success(
          `Room #${selectedRoom?.roomNumber || ''} checked in for ${firstName} ${lastName}`,
          `Booking Confirmed • ${code}`,
          5500,
          {
            label: 'Copy Code',
            icon: 'copy',
            onClick: () => {
              navigator.clipboard.writeText(code);
              toast.info(`Code ${code} copied to clipboard`, 'Copied');
            },
          }
        );

        onSuccess();
      } else {

        setError(res.message || 'Failed to create walk-in reservation.');
      }
    } catch (err: any) {
      setError(err.message || 'Walk-in request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-[#DDD7CD] rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl animate-fadeIn text-[#1C1815] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-[#FAF6EE] text-[#8C621E] border border-[#ECE2CE]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-normal text-lg text-[#1C1815]">Walk-In Guest Registration</h3>
              <p className="text-xs text-[#736B63]">Direct front desk room assignment & instant check-in</p>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-md bg-[#FAF0ED] border border-[#EACEC8] text-[#8C2F22] text-xs">
              {error}
            </div>
          )}

          {/* Room Selection */}
          <div>
            <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1.5">
              Select Clean Suite ({rooms.length} Ready)
            </label>
            {rooms.length === 0 ? (
              <div className="p-3 rounded-md bg-[#FAF0ED] border border-[#EACEC8] text-[#8C2F22] text-xs">
                No clean/inspected suites currently available. Please check housekeeping status.
              </div>
            ) : (
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#DDD7CD] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:outline-none transition"
              >
                {rooms.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    Room #{rm.roomNumber} — Floor {rm.floor} ({rm.status.toUpperCase()})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Guest Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Eleanor"
                className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Vance"
                className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="guest@example.com"
                className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* Rate Plan & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1">
                Rate Plan
              </label>
              <select
                value={selectedRatePlanId}
                onChange={(e) => setSelectedRatePlanId(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-[#DDD7CD] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:outline-none transition"
              >
                {ratePlans.map((rp) => (
                  <option key={rp.id} value={rp.id}>
                    {rp.name} (${Math.round((matchedRoomType?.basePrice || 350) * rp.priceModifier)}/nt)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#736B63] uppercase tracking-wider mb-1">
                Departure Date
              </label>
              <input
                type="date"
                value={checkOutDate}
                min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FAF8F5] border border-[#E5E0D8] rounded-md text-sm text-[#1C1815] focus:border-[#B08D57] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* ID & Verification */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#1C1815] font-semibold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#236446]" /> Government ID Verification
              </span>
              <span className="text-[10px] text-[#236446] font-medium">Compliance Required</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#736B63] mb-1 uppercase">ID Type</label>
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
                <label className="block text-[10px] text-[#736B63] mb-1 uppercase">ID Number</label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#DDD7CD] rounded text-xs text-[#1C1815] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Rate Summary */}
          <div className="p-3.5 rounded-xl bg-white border border-[#DDD7CD] flex items-center justify-between text-xs">
            <div>
              <span className="text-[#736B63] block text-[11px]">Authorized Room Rate</span>
              <span className="font-serif font-bold text-base text-[#1C1815]">${nightlyRate} / night</span>
            </div>
            <div className="text-right">
              <span className="text-[#736B63] block text-[11px]">Security Hold</span>
              <span className="font-serif font-bold text-base text-[#236446]">$150.00 Authorized</span>
            </div>
          </div>

          {/* Submit */}
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
              disabled={isSubmitting || rooms.length === 0}
              className="px-5 py-2.5 rounded-md bg-[#1C1815] hover:bg-[#2C2622] text-[#F7F4EE] text-xs font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Assigning & Activating Keys...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Walk-In & Check In</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalkInBookingModal;
