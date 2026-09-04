import React, { useState } from 'react';
import { Key, Wifi, CheckCircle2, ShieldCheck, X, Smartphone } from 'lucide-react';

interface DigitalKeyModalProps {
  reservationId: string;
  roomNumber: string;
  guestName: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  onClose: () => void;
}

export const DigitalKeyModal: React.FC<DigitalKeyModalProps> = ({
  roomNumber,
  guestName,
  propertyName,
  checkInDate,
  checkOutDate,
  onClose,
}) => {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleUnlock = () => {
    setIsUnlocking(true);
    setTimeout(() => {
      setIsUnlocking(false);
      setIsUnlocked(true);
      setTimeout(() => {
        setIsUnlocked(false);
      }, 3500);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1C1815] text-[#F7F4EE] rounded-3xl border border-[#B08D57]/30 max-w-sm w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close digital key modal"
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-[#A69E95] hover:text-white transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#B08D57]/20 text-[#D8BC84] border border-[#B08D57]/30">
            <Wifi className="w-3 h-3 animate-pulse" />
            <span>Salto BLE Digital Key Live</span>
          </div>
          <h3 className="font-serif text-2xl font-normal text-[#F7F4EE]">{propertyName}</h3>
          <p className="text-xs text-[#A69E95]">Guest: {guestName}</p>
        </div>

        {/* Digital Key Card Display */}
        <div className="editorial-card rounded-2xl bg-gradient-to-br from-[#2A241F] to-[#1C1815] border border-[#B08D57]/40 p-6 text-center space-y-4 shadow-inner relative">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-[#B08D57] font-semibold">Your Assigned Suite</span>
            <div className="font-serif text-5xl font-bold text-white tracking-tight">#{roomNumber}</div>
            <span className="text-xs text-[#A69E95] block">{checkInDate} → {checkOutDate}</span>
          </div>

          <div className="py-2">
            <button
              type="button"
              disabled={isUnlocking}
              onClick={handleUnlock}
              className={`w-24 h-24 rounded-full mx-auto flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-lg ${
                isUnlocked
                  ? 'bg-[#236446] text-white ring-4 ring-[#236446]/30'
                  : isUnlocking
                  ? 'bg-[#8C621E] text-white animate-pulse'
                  : 'bg-[#B08D57] hover:bg-[#8C621E] text-white'
              }`}
            >
              {isUnlocked ? (
                <>
                  <CheckCircle2 className="w-8 h-8" />
                  <span className="text-[9px] font-bold uppercase">Unlocked</span>
                </>
              ) : isUnlocking ? (
                <>
                  <Wifi className="w-8 h-8 animate-spin" />
                  <span className="text-[9px] font-bold uppercase">Connecting</span>
                </>
              ) : (
                <>
                  <Key className="w-8 h-8" />
                  <span className="text-[9px] font-bold uppercase">Tap to Open</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-[#A69E95] flex items-center justify-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>Hold phone near Salto door sensor</span>
          </p>
        </div>

        <div className="text-center">
          <span className="text-[10px] text-[#736B63] flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B08D57]" /> 256-bit Encrypted Mobile Credential
          </span>
        </div>
      </div>
    </div>
  );
};

export default DigitalKeyModal;
