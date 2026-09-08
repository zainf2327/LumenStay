import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Copy,
  Check,
  Sparkles,
  BedDouble,
} from 'lucide-react';
import type { Property } from '../../types';

interface OwnerLedgerAuditTabProps {
  reservations: any[];
  onOpenFolio: (resId: string) => void;
  currentProperty?: Property | null;
}

type PaymentFilter = 'all' | 'paid' | 'authorized' | 'pending';

const AVATAR_COLORS = [
  { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', glow: 'rgba(16, 185, 129, 0.25)' },
  { bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', glow: 'rgba(99, 102, 241, 0.25)' },
  { bg: 'bg-amber-100 text-amber-800 border-amber-300', glow: 'rgba(245, 158, 11, 0.25)' },
  { bg: 'bg-rose-100 text-rose-800 border-rose-300', glow: 'rgba(244, 63, 94, 0.25)' },
  { bg: 'bg-teal-100 text-teal-800 border-teal-300', glow: 'rgba(13, 148, 136, 0.25)' },
  { bg: 'bg-purple-100 text-purple-800 border-purple-300', glow: 'rgba(168, 85, 247, 0.25)' },
];

function formatStayDates(checkIn: string, checkOut: string): string {
  try {
    const parts1 = checkIn.split('-');
    const parts2 = checkOut.split('-');
    if (parts1.length === 3 && parts2.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m1 = months[parseInt(parts1[1], 10) - 1] || parts1[1];
      const m2 = months[parseInt(parts2[1], 10) - 1] || parts2[1];
      const d1 = parseInt(parts1[2], 10);
      const d2 = parseInt(parts2[2], 10);
      const yr = parts2[0].slice(2);
      if (m1 === m2) {
        return `${m1} ${d1}–${d2}, '${yr}`;
      }
      return `${m1} ${d1}–${m2} ${d2}, '${yr}`;
    }
    return `${checkIn} → ${checkOut}`;
  } catch {
    return `${checkIn} → ${checkOut}`;
  }
}

export const OwnerLedgerAuditTab: React.FC<OwnerLedgerAuditTabProps> = ({
  reservations,
  onOpenFolio,
  currentProperty = null,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentFilter>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Financial aggregates
  const financials = useMemo(() => {
    let totalRevenue = 0;
    let paidRevenue = 0;
    let authorizedRevenue = 0;
    let pendingRevenue = 0;

    reservations.forEach((r) => {
      const amt = Number(r.totalAmount) || 0;
      totalRevenue += amt;

      const st = (r.paymentStatus || '').toLowerCase();
      if (st === 'paid') {
        paidRevenue += amt;
      } else if (st === 'authorized') {
        authorizedRevenue += amt;
      } else {
        pendingRevenue += amt;
      }
    });

    const totalCount = reservations.length || 1;
    const avgFolio = Math.round(totalRevenue / totalCount);
    const paidPct = Math.round((paidRevenue / (totalRevenue || 1)) * 100);
    const authPct = Math.round((authorizedRevenue / (totalRevenue || 1)) * 100);

    return {
      totalRevenue,
      paidRevenue,
      authorizedRevenue,
      pendingRevenue,
      avgFolio,
      paidPct,
      authPct,
    };
  }, [reservations]);

  // Filtered reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const gName = (r.guestName || (r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : '')).toLowerCase();
      const conf = (r.confirmationCode || '').toLowerCase();
      const term = searchTerm.toLowerCase().trim();

      const matchesSearch = !term || gName.includes(term) || conf.includes(term);

      const st = (r.paymentStatus || 'authorized').toLowerCase();
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && st === 'paid') ||
        (statusFilter === 'authorized' && st === 'authorized') ||
        (statusFilter === 'pending' && (st === 'pending' || st === 'unpaid'));

      return matchesSearch && matchesStatus;
    });
  }, [reservations, searchTerm, statusFilter]);

  // Export CSV helper
  const handleExportCSV = () => {
    const headers = ['Confirmation,Guest Name,Check-In,Check-Out,Total Amount,Payment Status,Room Type'];
    const rows = filteredReservations.map((r) => {
      const name = r.guestName || (r.guest ? `${r.guest.firstName} ${r.guest.lastName}` : 'Guest');
      return `"${r.confirmationCode}","${name}","${r.checkInDate}","${r.checkOutDate}","$${Number(r.totalAmount || 0).toFixed(2)}","${r.paymentStatus || 'Authorized'}","${r.roomTypeName || 'Suite'}"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LumenStay_Ledger_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Glowing Financial Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Audited Revenue (Emerald Glow) */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-[#E5E7EB] p-5 shadow-sm hover:shadow-md transition group">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-500/15 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Total Ledger Revenue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shadow-xs">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-[#0F172A] tracking-tight block">
              ${financials.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#64748B]">
              <span>{reservations.length} total folios in audit queue</span>
            </div>
          </div>
        </div>

        {/* Card 2: Settled & Paid (Cyan / Sky Glow) */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-[#E5E7EB] p-5 shadow-sm hover:shadow-md transition group">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-sky-500/15 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Settled & Captured
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-sky-700 tracking-tight block">
              ${financials.paidRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-sky-700 font-medium">
              <span className="px-2 py-0.5 rounded-full bg-sky-100 font-bold text-[10px]">
                {financials.paidPct}% Captured
              </span>
              <span className="hidden sm:inline">Direct merchant vault</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Pre-Auths (Warm Gold Glow) */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-[#E5E7EB] p-5 shadow-sm hover:shadow-md transition group">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Active Pre-Authorizations
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#C5A059] flex items-center justify-center font-bold text-xs shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-[#8C621E] tracking-tight block">
              ${financials.authorizedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-700 font-medium">
              <span className="px-2 py-0.5 rounded-full bg-amber-100 font-bold text-[10px]">
                {financials.authPct}% Pre-Auth
              </span>
              <span className="hidden sm:inline">Pending guest check-out</span>
            </div>
          </div>
        </div>

        {/* Card 4: Average Folio Value (Violet Glow) */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-[#E5E7EB] p-5 shadow-sm hover:shadow-md transition group">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-purple-500/15 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Average Folio Spend
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-heading font-black text-[#0F172A] tracking-tight block">
              ${financials.avgFolio.toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-purple-700 font-medium">
              <span>Rooms + Incidentals + Taxes</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Settlement Ratio Progress Visual */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <span className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
            Portfolio Settlement Balance Distribution
          </span>
          <span className="text-[#64748B] text-[11px]">
            {financials.paidPct}% Settled • {financials.authPct}% Guaranteed Pre-Auth
          </span>
        </div>
        <div className="h-3 rounded-full bg-[#F1F5F9] overflow-hidden flex p-0.5 gap-1 shadow-inner">
          <div
            style={{ width: `${Math.max(10, financials.paidPct)}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-l-full relative transition-all"
            title={`Paid & Settled: $${financials.paidRevenue.toFixed(2)}`}
          />
          <div
            style={{ width: `${Math.max(8, financials.authPct)}%` }}
            className="h-full bg-gradient-to-r from-amber-400 to-[#C5A059] rounded-r-full relative transition-all"
            title={`Authorized Pre-Auth: $${financials.authorizedRevenue.toFixed(2)}`}
          />
        </div>
      </div>

      {/* 3. Main Filter & Table Card (100% Width Fit in Desktop — Zero Horizontal Scroll) */}
      <div className="editorial-card rounded-3xl bg-white border border-[#E5E7EB] overflow-hidden shadow-sm">
        {/* Table Toolbar */}
        <div className="p-5 sm:p-6 border-b border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF8F5]/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-heading font-bold text-[#0F172A]">
                Financial Folio & Revenue Ledger
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#0F172A] text-white">
                {filteredReservations.length}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Live guest folios, room night rates, charges, and settlement audits{currentProperty ? ` for ${currentProperty.name}` : ''}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search guest or code..."
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-white border border-[#E5E7EB] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#C5A059] transition w-full sm:w-52"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-white border border-[#E2E8F0]">
              {(['all', 'paid', 'authorized', 'pending'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition cursor-pointer ${
                    statusFilter === st ? 'bg-[#0F172A] text-white shadow-xs' : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F8F9FA] text-[#0F172A] border border-[#E5E7EB] text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* 3A. Desktop Table View — Single-Row Fit with Zero Horizontal Scroll */}
        <div className="hidden md:block w-full overflow-hidden">
          <table className="w-full text-left text-xs table-fixed">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E5E7EB] text-[#64748B] uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3 px-3 pl-5 w-[22%]">Guest Profile</th>
                <th className="py-3 px-2 w-[14%]">Confirmation</th>
                <th className="py-3 px-2 w-[18%]">Suite Category</th>
                <th className="py-3 px-2 w-[18%]">Stay Dates</th>
                <th className="py-3 px-2 w-[11%]">Total</th>
                <th className="py-3 px-2 w-[9%]">Status</th>
                <th className="py-3 px-3 pr-5 w-[8%] text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredReservations.length > 0 ? (
                filteredReservations.map((res, idx) => {
                  const gName =
                    res.guestName ||
                    (res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : 'Guest');

                  const initials = gName
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  const avatarStyle = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                  let nights = 1;
                  try {
                    const d1 = new Date(res.checkInDate).getTime();
                    const d2 = new Date(res.checkOutDate).getTime();
                    nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
                  } catch {
                    nights = 1;
                  }

                  const pStatus = (res.paymentStatus || 'authorized').toLowerCase();
                  const dateText = formatStayDates(res.checkInDate, res.checkOutDate);

                  return (
                    <tr
                      key={res.id}
                      className="hover:bg-[#F8F9FA]/80 transition group h-12"
                    >
                      {/* Guest Profile (Single Row) */}
                      <td className="py-2.5 px-3 pl-5">
                        <div className="flex items-center gap-2 min-w-0" title={`${gName} (${res.guestEmail || 'Sanctuary Guest'})`}>
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-heading font-black text-[11px] border shrink-0 ${avatarStyle.bg}`}
                            style={{ boxShadow: `0 2px 6px ${avatarStyle.glow}` }}
                          >
                            {initials}
                          </div>
                          <span className="font-heading font-bold text-xs text-[#0F172A] truncate group-hover:text-[#C5A059] transition-colors">
                            {gName}
                          </span>
                        </div>
                      </td>

                      {/* Confirmation Code Chip (Single Row whitespace-nowrap) */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[#F8F9FA] border border-[#E2E8F0] font-mono font-bold text-[11px] text-[#0F172A]">
                          <span className="tracking-tight">{res.confirmationCode}</span>
                          <button
                            onClick={() => handleCopy(res.confirmationCode)}
                            className="text-[#94A3B8] hover:text-[#0F172A] p-0.5 cursor-pointer transition"
                            title="Copy code"
                          >
                            {copiedCode === res.confirmationCode ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Suite Category (Single Row) */}
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-1 text-xs text-[#0F172A] font-semibold min-w-0" title={res.roomTypeName || 'Deluxe Suite'}>
                          <BedDouble className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                          <span className="truncate">{res.roomTypeName || 'Deluxe Suite'}</span>
                          {res.assignedRoomNumber && (
                            <span className="text-[10px] text-[#64748B] font-mono shrink-0 ml-0.5">
                              #{res.assignedRoomNumber}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stay Dates (Single Row whitespace-nowrap) */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-[#334155] font-semibold whitespace-nowrap">
                            {dateText}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#F1F5F9] text-[#64748B] shrink-0">
                            {nights}n
                          </span>
                        </div>
                      </td>

                      {/* Total Realized Amount (Single Row whitespace-nowrap) */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span className="font-heading font-black text-xs sm:text-sm text-[#0F172A]">
                          ${Number(res.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Payment Status Badge (Single Row whitespace-nowrap) */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {pStatus === 'paid' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Paid</span>
                          </span>
                        )}
                        {pStatus === 'authorized' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-300">
                            <ShieldCheck className="w-3 h-3 text-sky-600 shrink-0" />
                            <span>Auth</span>
                          </span>
                        )}
                        {pStatus !== 'paid' && pStatus !== 'authorized' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{res.paymentStatus || 'Pending'}</span>
                          </span>
                        )}
                      </td>

                      {/* Audit Folio Button (Single Row) */}
                      <td className="py-2.5 px-3 pr-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenFolio(res.id)}
                          className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#0F172A] to-[#1E293B] hover:from-[#1E293B] hover:to-[#334155] text-white text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-2xs"
                          title="Audit Folio"
                        >
                          <Receipt className="w-3 h-3 text-[#FDE68A]" />
                          <span>Audit</span>
                          <ArrowUpRight className="w-2.5 h-2.5 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-xs text-[#64748B]">
                    No folio records match the active search or status filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3B. Mobile Card View (md:hidden) */}
        <div className="md:hidden divide-y divide-[#E5E7EB]">
          {filteredReservations.length > 0 ? (
            filteredReservations.map((res, idx) => {
              const gName =
                res.guestName ||
                (res.guest ? `${res.guest.firstName} ${res.guest.lastName}` : 'Guest');

              const initials = gName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              const avatarStyle = AVATAR_COLORS[idx % AVATAR_COLORS.length];

              let nights = 1;
              try {
                const d1 = new Date(res.checkInDate).getTime();
                const d2 = new Date(res.checkOutDate).getTime();
                nights = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
              } catch {
                nights = 1;
              }

              const pStatus = (res.paymentStatus || 'authorized').toLowerCase();
              const dateText = formatStayDates(res.checkInDate, res.checkOutDate);

              return (
                <div key={res.id} className="p-4 space-y-3.5 hover:bg-[#F8F9FA]/60 transition">
                  {/* Top Row: Guest Profile + Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-heading font-black text-xs border shrink-0 ${avatarStyle.bg}`}
                        style={{ boxShadow: `0 2px 6px ${avatarStyle.glow}` }}
                      >
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-sm text-[#0F172A]">
                          {gName}
                        </h4>
                        <span className="text-[11px] text-[#64748B]">
                          {res.guestEmail || 'Sanctuary Guest'}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {pStatus === 'paid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Paid</span>
                        </span>
                      )}
                      {pStatus === 'authorized' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-300">
                          <ShieldCheck className="w-3 h-3 text-sky-600" />
                          <span>Authorized</span>
                        </span>
                      )}
                      {pStatus !== 'paid' && pStatus !== 'authorized' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{res.paymentStatus || 'Pending'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Details Grid */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-[#F8F9FA] border border-[#E2E8F0] text-xs">
                    {/* Confirmation Code */}
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#64748B] block tracking-wider">
                        Confirmation
                      </span>
                      <div className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-[#0F172A] mt-0.5">
                        <span>{res.confirmationCode}</span>
                        <button
                          onClick={() => handleCopy(res.confirmationCode)}
                          className="text-[#94A3B8] hover:text-[#0F172A]"
                        >
                          {copiedCode === res.confirmationCode ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Suite Category */}
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#64748B] block tracking-wider">
                        Suite Type
                      </span>
                      <span className="font-semibold text-[#0F172A] truncate block mt-0.5">
                        {res.roomTypeName || 'Deluxe Suite'}
                      </span>
                    </div>

                    {/* Stay Dates */}
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#64748B] block tracking-wider">
                        Stay Duration
                      </span>
                      <span className="font-mono text-xs text-[#334155] font-semibold block mt-0.5">
                        {dateText}
                      </span>
                      <span className="text-[10px] text-[#64748B]">({nights} {nights === 1 ? 'nt' : 'nts'})</span>
                    </div>

                    {/* Realized Amount */}
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-bold text-[#64748B] block tracking-wider">
                        Total Amount
                      </span>
                      <span className="font-heading font-black text-sm sm:text-base text-[#0F172A] block mt-0.5">
                        ${Number(res.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Audit Button */}
                  <button
                    type="button"
                    onClick={() => onOpenFolio(res.id)}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-[#0F172A] to-[#1E293B] hover:from-[#1E293B] hover:to-[#334155] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <Receipt className="w-3.5 h-3.5 text-[#FDE68A]" />
                    <span>Audit Folio Voucher</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-[#64748B]">
              No folio records match the active filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerLedgerAuditTab;
