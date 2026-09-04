import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Building2,
  ChevronDown,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { UserRole } from '../types';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'signin' | 'register' | 'forgot'>('signin');

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register State (Dedicated for Guests)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoList, setShowDemoList] = useState(false);

  if (!isLoginModalOpen) return null;

  const routeForRole = (role: UserRole | string): string => {
    switch (role) {
      case 'housekeeping':
        return '/housekeeper';
      case 'housekeeping_supervisor':
        return '/supervisor';
      case 'front_desk':
        return '/frontdesk';
      case 'gm':
        return '/gm';
      case 'owner':
        return '/owner';
      case 'maintenance':
        return '/maintenance';
      case 'revenue_manager':
        return '/revenue';
      default:
        return '/guest';
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await login(signInEmail, signInPassword);
      if (res.success && res.user) {
        closeLoginModal();
        if (res.user.role && res.user.role !== 'guest') {
          navigate(routeForRole(res.user.role));
        }
      } else if (res.success) {
        closeLoginModal();
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch {
      setError('An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await register({
        name: regName,
        email: regEmail,
        phone: regPhone || undefined,
        password: regPassword,
        role: 'guest',
        propertyId: null,
      });
      if (res.success) {
        closeLoginModal();
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch {
      setError('An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setForgotSuccess(null);

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      }).then((r) => r.json());

      if (res.success) {
        setForgotSuccess(
          res.message || 'Password reset instructions have been dispatched to your email address.'
        );
      } else {
        setError(res.message || 'Unable to process reset request. Please check your email.');
      }
    } catch {
      setForgotSuccess(
        'If an account exists with this email address, password reset instructions have been sent.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (email: string) => {
    setSignInEmail(email);
    setSignInPassword('123456');
    setError(null);
    setShowDemoList(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Soft Dark Scrim Backdrop */}
      <div
        onClick={closeLoginModal}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fadeIn"
      />

      {/* Centered Modern Stone Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl overflow-hidden transition-all duration-300 animate-slideUp z-10 font-sans text-[#0F172A]">
        {/* Header with Wordmark & Close Button */}
        <div className="p-6 pb-4 border-b border-[#F1F5F9] relative flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs tracking-wider">
              L
            </div>
            <div>
              <span className="font-heading font-extrabold text-sm tracking-[0.2em] text-[#0F172A] uppercase block leading-none">
                LUMENSTAY
              </span>
              <span className="text-[9px] uppercase tracking-wider text-[#64748B] font-medium mt-0.5 block">
                {tab === 'forgot' ? 'Account Recovery' : 'Guest & Staff Access'}
              </span>
            </div>
          </div>

          <button
            onClick={closeLoginModal}
            className="p-2 rounded-full hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher (Visible on Sign In & Register) */}
        {tab !== 'forgot' ? (
          <div className="px-6 pt-5">
            <div className="p-1 bg-[#F1F5F9] rounded-2xl border border-[#E5E7EB] flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setTab('signin');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tab === 'signin'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tab === 'register'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Join Elite Club
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 pt-5">
            <button
              type="button"
              onClick={() => {
                setTab('signin');
                setError(null);
                setForgotSuccess(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#475569] hover:text-[#0F172A] transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#BE123C] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {forgotSuccess && (
            <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] text-xs font-medium space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
                <span>Instructions Dispatched</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#065F46]">{forgotSuccess}</p>
            </div>
          )}

          {tab === 'signin' ? (
            /* ================= SIGN IN FORM ================= */
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    placeholder="name@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(signInEmail);
                      setTab('forgot');
                      setError(null);
                      setForgotSuccess(null);
                    }}
                    className="text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-[#94A3B8] hover:text-[#0F172A] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                    'Signing In...'
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Quick Demo Fill Dropdown */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowDemoList(!showDemoList)}
                  className="w-full py-2 px-3 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-[11px] font-semibold text-[#475569] flex items-center justify-between hover:bg-[#F1F5F9] transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Quick Demo Staff Logins</span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDemoList ? 'rotate-180' : ''}`} />
                </button>

                {showDemoList && (
                  <div className="mt-2 p-2 bg-[#F8F9FA] rounded-2xl border border-[#E5E7EB] grid grid-cols-2 gap-1 text-[11px] animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => fillDemo('guest@lumenstay.com')}
                      className="p-1.5 text-left rounded-lg hover:bg-white transition cursor-pointer"
                    >
                      <p className="font-bold text-[#0F172A]">Guest</p>
                      <p className="text-[9px] text-[#64748B]">guest@lumenstay.com</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemo('frontdesk@lumenstay.com')}
                      className="p-1.5 text-left rounded-lg hover:bg-white transition cursor-pointer"
                    >
                      <p className="font-bold text-[#0F172A]">Front Desk</p>
                      <p className="text-[9px] text-[#64748B]">frontdesk@...</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemo('housekeeper@lumenstay.com')}
                      className="p-1.5 text-left rounded-lg hover:bg-white transition cursor-pointer"
                    >
                      <p className="font-bold text-[#0F172A]">Housekeeper</p>
                      <p className="text-[9px] text-[#64748B]">housekeeper@...</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemo('gm@lumenstay.com')}
                      className="p-1.5 text-left rounded-lg hover:bg-white transition cursor-pointer"
                    >
                      <p className="font-bold text-[#0F172A]">General Manager</p>
                      <p className="text-[9px] text-[#64748B]">gm@...</p>
                    </button>
                  </div>
                )}
              </div>
            </form>
          ) : tab === 'forgot' ? (
            /* ================= FORGOT PASSWORD FORM ================= */
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-heading font-bold text-base text-[#0F172A]">
                  Reset Your Password
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Enter your account email address and we'll send you instructions to securely reset your password.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Registered Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="name@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
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

                <button
                  type="button"
                  onClick={() => {
                    setTab('signin');
                    setError(null);
                    setForgotSuccess(null);
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8F9FA] transition cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          ) : (
            /* ================= REGISTER FORM (NO YELLOW/GOLD BUTTON) ================= */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    placeholder="Eleanor Vance"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="name@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="p-1 text-[#94A3B8] hover:text-[#0F172A] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit CTA — Clean Deep Carbon (No Yellow/Gold) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full astra-btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    'Creating Account...'
                  ) : (
                    <>
                      <span>Join Lumen Elite Club</span>
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Footer */}
        <div className="px-6 py-3.5 bg-[#F8F9FA] border-t border-[#E5E7EB] text-[11px] text-[#64748B] flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium text-[#047857]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" />
            256-bit encrypted authentication
          </span>
          <span className="font-semibold text-[#0F172A]">LumenStay</span>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
