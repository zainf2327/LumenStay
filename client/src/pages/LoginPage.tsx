import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import type { UserRole } from '../types';
import { LumenStayLogo } from '../components/LumenStayLogo';
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Lock,
  Mail,
  Building2,
} from 'lucide-react';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const routeForRole = (role: UserRole): string => {
    switch (role) {
      case 'guest':
        return '/guest';
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

  const validateEmail = (val: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address.';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Please enter your password.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const res = await login(email, password);
      if (res.success && res.user) {
        navigate(routeForRole(res.user.role));
      } else if (res.success) {
        navigate('/guest');
      } else {
        setErrors({ general: res.message || 'Invalid email or password. Please try again.' });
      }
    } catch {
      setErrors({ general: 'A network error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setEmail('');
    setPassword('');
    setErrors({});
  }, []);

  const setDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0F172A] font-sans antialiased flex flex-col justify-between selection:bg-[#C5A059]/20 selection:text-[#0F172A]">
      {/* Top Header Bar */}
      <header className="w-full px-6 py-5 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center cursor-pointer"
        >
          <LumenStayLogo
            size="sm"
            theme="dark"
            showWordmark={true}
            subtitle="Sanctuaries & Operations"
          />
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
              Account Portal
            </span>
            <h1 className="text-3xl font-heading font-extrabold text-[#0F172A] tracking-tight">
              Sign in to LumenStay
            </h1>
            <p className="text-xs text-[#64748B]">
              Access your guest reservations or staff operations management system.
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
            <form onSubmit={handleSignIn} className="space-y-4">
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

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#334155]">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F8F9FA] border text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#C5A059] ${
                      errors.password ? 'border-[#E11D48]' : 'border-[#E5E7EB]'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 text-[#94A3B8] hover:text-[#0F172A] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-[#E11D48]">{errors.password}</p>}
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
                      <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Direct Link to Register */}
            <div className="pt-2 text-center border-t border-[#F1F5F9]">
              <p className="text-xs text-[#64748B]">
                New to LumenStay?{' '}
                <Link
                  to="/register"
                  className="font-bold text-[#0F172A] hover:underline cursor-pointer"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          {/* Quick Demo Access Console */}
          <div className="editorial-card rounded-2xl p-4 bg-white border border-[#E5E7EB] space-y-3">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                <Building2 className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Quick Demo Accounts (Password: 123456)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setDemoAccount('guest@lumenstay.com')}
                className="p-2 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#E5E7EB] text-left transition cursor-pointer"
              >
                <p className="font-bold text-[11px] text-[#0F172A]">Guest</p>
                <p className="text-[9px] text-[#64748B] truncate">guest@...</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('frontdesk@lumenstay.com')}
                className="p-2 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#E5E7EB] text-left transition cursor-pointer"
              >
                <p className="font-bold text-[11px] text-[#0F172A]">Front Desk</p>
                <p className="text-[9px] text-[#64748B] truncate">frontdesk@...</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('housekeeper@lumenstay.com')}
                className="p-2 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#E5E7EB] text-left transition cursor-pointer"
              >
                <p className="font-bold text-[11px] text-[#0F172A]">Housekeeper</p>
                <p className="text-[9px] text-[#64748B] truncate">housekeeper@...</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('supervisor@lumenstay.com')}
                className="p-2 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#E5E7EB] text-left transition cursor-pointer"
              >
                <p className="font-bold text-[11px] text-[#0F172A]">Supervisor</p>
                <p className="text-[9px] text-[#64748B] truncate">supervisor@...</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('gm@lumenstay.com')}
                className="p-2 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#E5E7EB] text-left transition cursor-pointer"
              >
                <p className="font-bold text-[11px] text-[#0F172A]">General Mgr</p>
                <p className="text-[9px] text-[#64748B] truncate">gm@...</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('owner@lumenstay.com')}
                className="p-2 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#E5E7EB] text-left transition cursor-pointer"
              >
                <p className="font-bold text-[11px] text-[#0F172A]">Owner</p>
                <p className="text-[9px] text-[#64748B] truncate">owner@...</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('revenue@lumenstay.com')}
                className="p-2 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#E5E7EB] text-left transition cursor-pointer"
              >
                <p className="font-bold text-[11px] text-[#0F172A]">Revenue</p>
                <p className="text-[9px] text-[#64748B] truncate">revenue@...</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('maintenance@lumenstay.com')}
                className="p-2 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F5F9] border border-[#E5E7EB] text-left transition cursor-pointer"
              >
                <p className="font-bold text-[11px] text-[#0F172A]">Maintenance</p>
                <p className="text-[9px] text-[#64748B] truncate">maintenance@...</p>
              </button>
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

export default LoginPage;
