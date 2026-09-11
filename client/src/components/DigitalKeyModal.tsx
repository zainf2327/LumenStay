import React, { useState } from 'react';
import { Key, Wifi, CheckCircle2, ShieldCheck, X, Smartphone, Sparkles, Copy, Check } from 'lucide-react';

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
  const [copiedWifi, setCopiedWifi] = useState(false);

  const handleUnlock = () => {
    setIsUnlocking(true);
    setTimeout(() => {
      setIsUnlocking(false);
      setIsUnlocked(true);
      setTimeout(() => {
        setIsUnlocked(false);
      }, 4000);
    }, 1200);
  };

  const handleCopyWifi = () => {
    navigator.clipboard.writeText('Sanctuary2026');
    setCopiedWifi(true);
    setTimeout(() => setCopiedWifi(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="bg-[#1E1627] text-white rounded-3xl border border-[#4A1D6D]/40 max-w-sm w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Amethyst Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#4A1D6D]/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#4A1D6D]/30 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close digital key modal"
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#4A1D6D]/40 text-purple-200 border border-[#4A1D6D]/60 shadow-sm">
            <Wifi className="w-3 h-3 animate-pulse text-purple-300" />
            <span>Salto BLE Digital Key Live</span>
          </div>
          <h3 className="font-heading text-2xl font-extrabold text-white tracking-tight">{propertyName}</h3>
          <p className="text-xs text-purple-200/80">Guest: {guestName}</p>
        </div>

        {/* Digital Key Card Display */}
        <div className="editorial-card rounded-2xl bg-gradient-to-br from-[#2D1B3E] to-[#1E1627] border border-[#4A1D6D]/50 p-6 text-center space-y-4 shadow-inner relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-purple-300 font-bold block">
              Your Assigned Suite
            </span>
            <div className="font-heading text-5xl font-extrabold text-white tracking-tight">#{roomNumber}</div>
            <span className="text-xs text-slate-300 block">{checkInDate} → {checkOutDate}</span>
          </div>

          <div className="py-3">
            <button
              type="button"
              disabled={isUnlocking}
              onClick={handleUnlock}
              className={`w-28 h-28 rounded-full mx-auto flex flex-col items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer shadow-xl ${
                isUnlocked
                  ? 'bg-emerald-600 text-white ring-8 ring-emerald-500/30 scale-105'
                  : isUnlocking
                  ? 'bg-[#3B1457] text-white animate-pulse ring-8 ring-purple-400/30'
                  : 'bg-[#4A1D6D] hover:bg-[#5C2487] text-white ring-6 ring-[#4A1D6D]/30 hover:scale-105 active:scale-95'
              }`}
            >
              {isUnlocked ? (
                <>
                  <CheckCircle2 className="w-9 h-9 text-white animate-bounce" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Unlocked</span>
                </>
              ) : isUnlocking ? (
                <>
                  <Wifi className="w-9 h-9 animate-spin text-purple-200" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Opening...</span>
                </>
              ) : (
                <>
                  <Key className="w-9 h-9 text-white" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Tap to Open</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-purple-200/80 flex items-center justify-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-purple-300" />
            <span>Hold smartphone within 2 inches of door sensor</span>
          </p>
        </div>

        {/* Complimentary Guest Wi-Fi Card */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-purple-200 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-purple-300" /> High-Speed Sanctuary Wi-Fi
            </div>
            <p className="text-white font-medium mt-0.5">
              SSID: <span className="font-mono font-bold text-white">LumenStay-Guest</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyWifi}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-mono flex items-center gap-1 transition cursor-pointer"
            title="Copy Wi-Fi password"
          >
            {copiedWifi ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[10px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-[10px]">Sanctuary2026</span>
              </>
            )}
          </button>
        </div>

        {/* Security Footer */}
        <div className="text-center relative z-10">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#A855F7]" /> 256-bit Encrypted Salto BLE Mobile Credential
          </span>
        </div>
      </div>
    </div>
  );
};

export default DigitalKeyModal;
