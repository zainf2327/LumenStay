import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    } else if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      }).then((r) => r.json());

      if (res.success) {
        setSuccessMessage(
          res.message || 'Password reset instructions have been dispatched to your email address.'
        );
      } else {
        setError(res.message || 'Unable to process reset request.');
      }
    } catch {
      setSuccessMessage(
        'If an account exists with this email address, password reset instructions have been sent.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setEmail('');
    setError(null);
    setSuccessMessage(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] font-sans antialiased flex flex-col justify-between selection:bg-[#C5A059]/20 selection:text-[#0F172A]">
      {/* Top Header Bar */}
      <header className="w-full px-6 py-5 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs tracking-wider group-hover:bg-[#C5A059] transition">
            L
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-sm tracking-[0.22em] text-[#0F172A] uppercase leading-none">
              LUMENSTAY
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#64748B] font-medium mt-0.5">
              Sanctuaries & Operations
            </span>
          </div>
        </Link>

        <Link
          to="/login"
          className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </header>

      {/* Main Minimalist Centered Stone Island */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#C5A059]">
              Account Recovery
            </span>
            <h1 className="text-3xl font-heading font-extrabold text-[#0F172A] tracking-tight">
              Reset Your Password
            </h1>
            <p className="text-xs text-[#64748B]">
              Enter your registered email address to receive secure password reset instructions.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <div className="w-2 h-2 rounded-full bg-[#BE123C] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-medium space-y-1 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
                <span>Instructions Dispatched</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#065F46]">{successMessage}</p>
            </div>
          )}

          {/* Centered Stone Island Card */}
          <div className="editorial-card rounded-3xl p-6 sm:p-8 bg-white border border-[#E5E7EB] shadow-sm space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="name@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059]"
                    required
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full astra-btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending Instructions...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Instructions</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Direct Link to Login */}
            <div className="pt-2 text-center border-t border-[#F1F5F9]">
              <p className="text-xs text-[#64748B]">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="font-bold text-[#0F172A] hover:underline cursor-pointer"
                >
                  Return to sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Security Footer */}
      <footer className="w-full py-5 text-center text-xs text-[#64748B] border-t border-[#E5E7EB] bg-white flex flex-col sm:flex-row items-center justify-between px-6 gap-2">
        <div className="flex items-center gap-1.5 font-medium text-[#047857]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" />
          <span>256-bit encrypted authentication</span>
        </div>
        <p>© 2026 LumenStay Hospitality Group LLC</p>
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;
