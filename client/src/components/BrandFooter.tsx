import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Clock, Sparkles, MapPin, ArrowUpRight, Lock } from 'lucide-react';
import type { Property } from '../types';
import { LumenStayLogo } from './LumenStayLogo';

export const BrandFooter: React.FC = () => {
  const { properties, setCurrentPropertyId } = useAuth();
  const navigate = useNavigate();

  const handleSelectLodge = (p: Property) => {
    setCurrentPropertyId(p.id);
    const elem = document.getElementById('accommodations');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#0F172A] text-white pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Brand Highlights Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#C5A059] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Direct Booking Guarantee
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Guaranteed lowest available nightly rates and priority suite upgrades.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#C5A059] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Flexible Sanctuary Policy
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Full refund cancellations up to 48 hours prior to check-in on flexible rates.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#C5A059] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Bespoke Guest Concierge
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Dedicated local experience curators and private culinary arrangements.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#C5A059] shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Staff Operations Portal
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Front desk, housekeeping, and executive PMS management console.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C5A059] hover:underline mt-1 cursor-pointer"
              >
                Access Staff Portal <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <LumenStayLogo
              size="md"
              theme="light"
              showWordmark={true}
              subtitle="Boutique Hospitality Group"
            />
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              A curated collection of intimate boutique sanctuaries designed around natural light, silence, and modern architectural elegance across America's most iconic landscapes.
            </p>
            <div className="text-[11px] text-slate-400">
              Direct Inquiries: <a href="mailto:concierge@lumenstay.com" className="text-slate-300 hover:text-white transition">concierge@lumenstay.com</a>
            </div>
          </div>

          {/* Destinations Portfolio */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Boutique Lodges & Sanctuaries
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {properties.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectLodge(p)}
                  className="text-left text-slate-400 hover:text-[#C5A059] transition flex items-center gap-1.5 py-1 group cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-slate-400 group-hover:text-[#C5A059] transition" />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Management */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Guest Services
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a
                  href="#lookup"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('lookup')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition cursor-pointer"
                >
                  Lookup Existing Booking
                </a>
              </li>
              <li>
                <a
                  href="#accommodations"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('accommodations')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition cursor-pointer"
                >
                  Live Suite Availability
                </a>
              </li>
              <li>
                <button
                  onClick={() => navigate('/login')}
                  className="text-slate-400 hover:text-[#C5A059] transition text-left cursor-pointer"
                >
                  Staff Sign In
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} LumenStay Hospitality Group. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Accessibility</span>
            <button
              onClick={() => navigate('/login')}
              className="text-[#C5A059] hover:underline font-medium cursor-pointer"
            >
              Staff Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
