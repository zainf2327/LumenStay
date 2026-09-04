import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Mail,
  User,
  Phone,
} from 'lucide-react';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Please enter your full name.';
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Please enter a password.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role: 'guest',
        propertyId: null,
      });

      if (res.success) {
        // As requested: guests immediately land on /guest
        navigate('/guest');
      } else {
        setErrors({ general: res.message || 'Registration failed. Please check your information.' });
      }
    } catch {
      setErrors({ general: 'A network error occurred during registration. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
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
          to="/"
          className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition flex items-center gap-1 cursor-pointer"
        >
          <span>Explore Sanctuaries</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Minimalist Centered Stone Island */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#C5A059]">
              Guest Membership
            </span>
            <h1 className="text-3xl font-heading font-extrabold text-[#0F172A] tracking-tight">
              Join Lumen Elite Club
            </h1>
            <p className="text-xs text-[#64748B]">
              Create an account for direct booking guarantees, suite upgrades, and bespoke concierge access.
            </p>
          </div>

          {/* Error Banner */}
          {errors.general && (
            <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] text-xs font-medium flex items-center gap-2 animate-fadeIn">
              <div className="w-2 h-2 rounded-full bg-[#BE123C] shrink-0" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Centered Stone Island Card */}
          <div className="editorial-card rounded-3xl p-6 sm:p-8 bg-white border border-[#E5E7EB] shadow-sm space-y-5">
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Eleanor Vance"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F9FA] border text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059] ${
                      errors.name ? 'border-[#E11D48]' : 'border-[#E5E7EB]'
                    }`}
                    required
                  />
                </div>
                {errors.name && <p className="text-[11px] text-[#E11D48]">{errors.name}</p>}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="name@domain.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F9FA] border text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059] ${
                      errors.email ? 'border-[#E11D48]' : 'border-[#E5E7EB]'
                    }`}
                    required
                  />
                </div>
                {errors.email && <p className="text-[11px] text-[#E11D48]">{errors.email}</p>}
              </div>

              {/* Phone (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-[#94A3B8] hover:text-[#0F172A] absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[10px] text-[#E11D48]">{errors.password}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                    Confirm
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                      }}
                      placeholder="••••••••"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="p-1 text-[#94A3B8] hover:text-[#0F172A] absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[10px] text-[#E11D48]">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Submit CTA — Carbon, Zero Yellow */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full astra-btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Lumen Elite Club</span>
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Direct Link to Login */}
            <div className="pt-2 text-center border-t border-[#F1F5F9]">
              <p className="text-xs text-[#64748B]">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-bold text-[#0F172A] hover:underline cursor-pointer"
                >
                  Sign in
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

export default RegisterPage;
