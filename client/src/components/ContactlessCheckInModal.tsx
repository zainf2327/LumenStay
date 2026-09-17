import React, { useState } from 'react';
import {
  X,
  Key,
  Car,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  FileText,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';

interface ContactlessCheckInModalProps {
  reservation: {
    id: string;
    confirmationCode: string;
    propertyName: string;
    roomTypeName: string;
    checkInDate: string;
    checkOutDate: string;
    guestName?: string;
    assignedRoomId?: string;
    roomNumber?: string;
  };
  onClose: () => void;
  onSuccess: (checkedInStay: any) => void;
}

export const ContactlessCheckInModal: React.FC<ContactlessCheckInModalProps> = ({
  reservation,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [estimatedArrival, setEstimatedArrival] = useState<string>('15:00');
  const [hasVehicle, setHasVehicle] = useState<boolean>(true);
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [vehicleMake, setVehicleMake] = useState<string>('');
  const [mobilePhone, setMobilePhone] = useState<string>('(970) 555-0199');

  // Step 2: Terms & Agreement
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [digitalSignature, setDigitalSignature] = useState<string>(reservation.guestName || 'Valued Guest');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [assignedRoom, setAssignedRoom] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedWifi, setCopiedWifi] = useState<boolean>(false);

  const handleNextToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError('Please review and accept the sanctuary house rules and terms.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const vehicleInfo = hasVehicle && vehiclePlate ? `${vehiclePlate} (${vehicleMake || 'Standard'})` : undefined;

      const res = await fetch(`/api/v1/rooms/reservations/${reservation.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimatedArrival,
          vehiclePlate: vehicleInfo,
          idDocumentType: 'Contactless Mobile Agreement',
          idDocumentNumber: `ESIGN-${digitalSignature.replace(/\s+/g, '-').toUpperCase()}`,
          termsAccepted: true,
        }),
      }).then((r) => r.json());

      if (res.success) {
        const assignedSuiteNumber = res.data?.roomNumber || reservation.roomNumber || '204';
        setAssignedRoom({
          roomNumber: assignedSuiteNumber,
          checkInTime: res.data?.checkInTime,
        });
        setStep(3);
      } else {
        setError(res.error || res.message || 'Check-in failed. Please contact the front desk.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error during contactless check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyWifi = () => {
    navigator.clipboard.writeText('Sanctuary2026');
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2000);
  };

  const handleComplete = () => {
    onSuccess({
      ...reservation,
      roomNumber: assignedRoom?.roomNumber || '204',
      status: 'In-House',
      keyStatus: 'Active & Provisioned',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 font-sans animate-fadeIn">
      <div className="bg-white border border-[#E9E5EE] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative text-[#1E1627] flex flex-col max-h-[90vh]">
        {/* Subtle Luxury Amethyst Gradient Ribbon */}
        <div className="h-2 bg-gradient-to-r from-[#4A1D6D] via-[#7B3FA2] to-[#B85D19]" />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#E9E5EE] flex items-center justify-between bg-[#FAF9FC]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F3EDF8] text-[#4A1D6D] border border-[#E2D4F0] mb-1">
              <Sparkles className="w-3 h-3" />
              <span>Contactless Pre-Arrival Check-In</span>
            </div>
            <h3 className="font-heading font-extrabold text-xl text-[#1E1627] tracking-tight">
              {reservation.propertyName}
            </h3>
            <p className="text-xs text-[#6E6678]">
              Confirmation <span className="font-mono font-bold text-[#1E1627]">#{reservation.confirmationCode}</span> • {reservation.roomTypeName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Step Indicator */}
        <div className="px-6 py-3 bg-[#FAF9FC] border-b border-[#E9E5EE] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step >= 1 ? 'bg-[#4A1D6D] text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span className={`font-semibold ${step === 1 ? 'text-[#4A1D6D]' : 'text-slate-500'}`}>Arrival Details</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step >= 2 ? 'bg-[#4A1D6D] text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span className={`font-semibold ${step === 2 ? 'text-[#4A1D6D]' : 'text-slate-500'}`}>House Rules</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <span className={`font-semibold ${step === 3 ? 'text-emerald-700' : 'text-slate-500'}`}>Suite Key</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Arrival & Vehicle Details */}
          {step === 1 && (
            <form onSubmit={handleNextToStep2} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#F3EDF8]/60 border border-[#E2D4F0] text-xs text-[#4A1D6D] leading-relaxed">
                <p className="font-semibold flex items-center gap-1.5 mb-0.5">
                  <Clock className="w-4 h-4" /> Standard Check-in begins at 3:00 PM
                </p>
                <span>
                  Please provide your estimated arrival time and vehicle details so our valet and concierge can prepare your suite and digital lock.
                </span>
              </div>

              {/* Arrival Time Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Estimated Arrival Time
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['14:00', '15:00', '16:30', '18:00+'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEstimatedArrival(t)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                        estimatedArrival === t
                          ? 'bg-[#4A1D6D] text-white border-[#4A1D6D] shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle / Parking Selection */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Parking & Valet Service
                  </label>
                  <button
                    type="button"
                    onClick={() => setHasVehicle(!hasVehicle)}
                    className="text-xs font-semibold text-[#4A1D6D] hover:underline cursor-pointer"
                  >
                    {hasVehicle ? 'Arriving by flight / rideshare' : 'Arriving with a vehicle'}
                  </button>
                </div>

                {hasVehicle ? (
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-600 block">License Plate #</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CO-892-XYZ"
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#4A1D6D]/20 focus:border-[#4A1D6D]"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-600 block">Vehicle Make / Model</span>
                      <input
                        type="text"
                        placeholder="e.g. Audi Q7 or Subaru"
                        value={vehicleMake}
                        onChange={(e) => setVehicleMake(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#4A1D6D]/20 focus:border-[#4A1D6D]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <Car className="w-4 h-4 text-slate-400" />
                    <span>No vehicle registered. Valet permit will not be issued.</span>
                  </div>
                )}
              </div>

              {/* Mobile Phone for Notifications */}
              <div className="space-y-1 pt-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Mobile Phone for Key Notifications
                </label>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={mobilePhone}
                    onChange={(e) => setMobilePhone(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4A1D6D]/20 focus:border-[#4A1D6D]"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#4A1D6D] hover:bg-[#3B1457] text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <span>Continue to House Policies</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Sanctuary Policies & Terms */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Sanctuary House Policies
                </span>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700 max-h-48 overflow-y-auto">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">100% Smoke-Free Property</span>
                      A $500 recovery fee applies to any smoking, vaping, or cannabis use inside guest suites or balconies.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-[#4A1D6D] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Alpine Quiet Hours (10:00 PM – 7:00 AM)</span>
                      To maintain a serene restorative atmosphere, amplified audio and corridor noise are strictly limited.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Key className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Keyless Digital Access</span>
                      Your mobile key is personal and non-transferable. Deactivates automatically upon checkout at 11:00 AM (2:00 PM for Lumen Elite).
                    </div>
                  </div>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-purple-50/50 border border-purple-200/60 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#4A1D6D] focus:ring-[#4A1D6D]"
                />
                <span className="text-xs text-slate-700 leading-snug">
                  I agree to the property house rules, terms of stay, and authorize incidental security authorizations.
                </span>
              </label>

              {/* Digital Signature */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Digital Guest Signature (Type Full Legal Name)
                </label>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={digitalSignature}
                    onChange={(e) => setDigitalSignature(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-serif font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4A1D6D]/20 focus:border-[#4A1D6D]"
                  />
                </div>
                
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !termsAccepted}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Allocating Suite & Provisioning Key...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Pre-Check In & Issue Key</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Suite Allocation & Digital Key Success */}
          {step === 3 && (
            <div className="text-center space-y-5 py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto ring-8 ring-emerald-50 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Check-In Verified & Ready
                </div>
                <h4 className="font-heading font-extrabold text-2xl text-[#1E1627]">
                  Welcome to {reservation.propertyName}
                </h4>
                <p className="text-xs text-[#6E6678]">
                  Your reservation is confirmed and your suite has been allocated.
                </p>
              </div>

              {/* Suite Reveal Card */}
              <div className="editorial-card rounded-2xl bg-gradient-to-br from-[#2D1B3E] to-[#1E1627] text-white p-6 text-center space-y-3 shadow-lg border border-[#4A1D6D]/40">
                <span className="text-[10px] uppercase font-bold tracking-widest text-purple-300 block">
                  Your Assigned Sanctuary
                </span>
                <div className="font-heading text-5xl font-extrabold text-white tracking-tight">
                  Suite #{assignedRoom?.roomNumber || '204'}
                </div>
                <div className="text-xs text-purple-200">
                  Floor 2, East Wing • {reservation.roomTypeName}
                </div>

                <div className="pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs text-purple-200">
                  <span>Guest Wi-Fi: <strong className="text-white font-mono">LumenStay-Guest</strong></span>
                  <button
                    type="button"
                    onClick={handleCopyWifi}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-200 hover:text-white bg-white/10 px-2.5 py-1 rounded-lg transition cursor-pointer"
                  >
                    {copiedWifi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedWifi ? 'Copied' : 'Copy PW'}</span>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleComplete}
                  className="w-full py-3.5 rounded-xl bg-[#4A1D6D] hover:bg-[#3B1457] text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <Key className="w-4 h-4 text-purple-200" />
                  <span>Launch Salto Digital Key & Enter Stay</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
