import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LumenStayLogo } from '../components/LumenStayLogo';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Building2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface InvitationInfo {
  email: string;
  name: string;
  role: string;
  propertyId?: string | null;
  propertyName: string;
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  owner: 'Property Owner / Principal',
  gm: 'General Manager',
  front_desk: 'Front Desk Host',
  housekeeping: 'Housekeeping Attendant',
  housekeeping_supervisor: 'Housekeeping Supervisor',
  maintenance: 'Lead Maintenance Engineer',
  revenue_manager: 'Revenue & Yield Director',
};

const getRoleRedirect = (role: string): string => {
  switch (role) {
    case 'front_desk':
      return '/frontdesk';
    case 'housekeeping':
      return '/housekeeper';
    case 'housekeeping_supervisor':
      return '/supervisor';
    case 'maintenance':
      return '/maintenance';
    case 'gm':
      return '/gm';
    case 'owner':
      return '/owner';
    case 'revenue_manager':
      return '/revenue';
    default:
      return '/';
  }
};

export const SetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setPasswordAndActivate } = useAuth();
  const { success: showSuccessToast } = useToast();

  const token = searchParams.get('token') || '';

  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate Invitation Token on Mount
  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setTokenError('No invitation token was detected. Please check your invitation email link.');
      return;
    }

    let isMounted = true;
    async function verifyToken() {
      try {
        setIsVerifying(true);
        const res = await fetch(`/api/v1/auth/verify-invitation?token=${encodeURIComponent(token)}`);
        const json = await res.json();

        if (!isMounted) return;

        if (json.success && json.data) {
          setInvitation(json.data);
          setTokenError(null);
        } else {
          setTokenError(json.message || 'Invalid or expired invitation token.');
        }
      } catch (err: any) {
        if (!isMounted) return;
        setTokenError(err.message || 'Network error verifying invitation token.');
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    }

    verifyToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isFormValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await setPasswordAndActivate(token, password);
      if (result.success && result.user) {
        setIsSuccess(true);
        showSuccessToast(`Welcome to LumenStay, ${result.user.name}! Your account is now active.`);
        const targetRoute = getRoleRedirect(result.user.role);
        setTimeout(() => {
          navigate(targetRoute, { replace: true });
        }, 1200);
      } else {
        setSubmitError(result.message || 'Failed to activate your account.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] font-sans antialiased flex flex-col justify-between selection:bg-[#C5A059]/20 selection:text-[#0F172A]">
      {/* Top Header Bar */}
      <header className="w-full px-6 py-5 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <Link to="/" className="flex items-center cursor-pointer">
          <LumenStayLogo
            size="sm"
            theme="dark"
            showWordmark={true}
            subtitle="Staff Onboarding"
          />
        </Link>
        <span className="text-[11px] font-semibold tracking-wider uppercase text-[#64748B] bg-white px-3 py-1 rounded-full border border-[#E2E8F0]">
          Staff Onboarding
        </span>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* State 1: Verifying Token */}
          {isVerifying && (
            <div className="bg-white border border-[#E5E7EB] rounded-3xl p-10 text-center shadow-lg space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-[#C5A059] mx-auto" />
              <h2 className="font-heading font-bold text-xl text-[#0F172A]">
                Verifying Security Credentials...
              </h2>
              <p className="text-xs text-[#64748B]">
                Authenticating your invitation token with LumenStay Sanctuaries.
              </p>
            </div>
          )}

          {/* State 2: Invalid / Expired Token */}
          {!isVerifying && tokenError && (
            <div className="bg-white border border-[#FEE2E2] rounded-3xl p-8 sm:p-10 shadow-lg text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
                  Invitation Link Unavailable
                </h2>
                <p className="text-xs text-[#64748B] leading-relaxed max-w-sm mx-auto">
                  {tokenError}
                </p>
              </div>
              <div className="pt-4 border-t border-[#F1F5F9] flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="flex-1 py-3 text-xs font-bold bg-[#0F172A] text-white rounded-xl hover:bg-[#1E293B] transition text-center"
                >
                  Return to Sign In
                </Link>
                <Link
                  to="/"
                  className="flex-1 py-3 text-xs font-bold border border-[#E2E8F0] text-[#64748B] rounded-xl hover:bg-[#F8FAFC] transition text-center"
                >
                  Visit Homepage
                </Link>
              </div>
            </div>
          )}

          {/* State 3: Valid Token — Set Password Form */}
          {!isVerifying && !tokenError && invitation && (
            <div className="bg-white border border-[#E5E7EB] rounded-3xl shadow-xl overflow-hidden">
              {/* Luxury Ribbon */}
              <div className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] p-6 sm:p-8 text-white relative">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/30 mb-3">
                  <Sparkles className="w-3 h-3" />
                  Staff Activation
                </div>
                <h1 className="font-heading font-bold text-2xl sm:text-3xl text-white">
                  Welcome, {invitation.name}
                </h1>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Complete your profile by choosing a secure password.
                </p>

                {/* Role & Property Badge */}
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>
                    {ROLE_DISPLAY_NAMES[invitation.role] || invitation.role}
                  </div>
                  <span className="text-[#64748B]">•</span>
                  <div className="flex items-center gap-1.5 text-[#CBD5E1]">
                    <Building2 className="w-3.5 h-3.5 text-[#C5A059]" />
                    {invitation.propertyName}
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                {submitError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <XCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Email (Readonly confirmation) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1.5">
                    Assigned Account Email
                  </label>
                  <input
                    type="email"
                    value={invitation.email}
                    disabled
                    className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#64748B] cursor-not-allowed select-none"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                    Create New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters..."
                      required
                      className="w-full pl-10 pr-10 py-3 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#0F172A] transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password..."
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059] transition"
                    />
                  </div>
                </div>

                {/* Password Criteria Checklist */}
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Security Requirements
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {hasMinLength ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-[#CBD5E1] shrink-0" />
                      )}
                      <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-[#64748B]'}>
                        8+ characters
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasUppercase ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-[#CBD5E1] shrink-0" />
                      )}
                      <span className={hasUppercase ? 'text-emerald-700 font-medium' : 'text-[#64748B]'}>
                        1 uppercase letter (A-Z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasLowercase ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-[#CBD5E1] shrink-0" />
                      )}
                      <span className={hasLowercase ? 'text-emerald-700 font-medium' : 'text-[#64748B]'}>
                        1 lowercase letter (a-z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasNumber ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-[#CBD5E1] shrink-0" />
                      )}
                      <span className={hasNumber ? 'text-emerald-700 font-medium' : 'text-[#64748B]'}>
                        1 digit (0-9)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 sm:col-span-2">
                      {passwordsMatch ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-[#CBD5E1] shrink-0" />
                      )}
                      <span className={passwordsMatch ? 'text-emerald-700 font-medium' : 'text-[#64748B]'}>
                        Passwords match exactly
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting || isSuccess}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
                    isFormValid && !isSubmitting && !isSuccess
                      ? 'bg-[#C5A059] hover:bg-[#b08e4d] text-[#0F172A] shadow-md hover:shadow-lg'
                      : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating Profile...</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#0F172A]" />
                      <span>Success! Redirecting to Hub...</span>
                    </>
                  ) : (
                    <>
                      <span>Activate Account & Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-6 border-t border-[#E5E7EB] text-center text-xs text-[#94A3B8]">
        &copy; {new Date().getFullYear()} LumenStay Sanctuaries & Resorts Inc. All rights reserved.
      </footer>
    </div>
  );
};
