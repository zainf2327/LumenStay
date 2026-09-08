import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { User, UserRole } from '../../types';
import {
  Users,
  UserPlus,
  Mail,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  Trash2,
  Search,
  Filter,
  Loader2,
  X,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';

const ROLE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; desc: string }
> = {
  owner: {
    label: 'Property Owner',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
    desc: 'Portfolio-wide executive access',
  },
  gm: {
    label: 'General Manager',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-200',
    desc: 'Property operations director',
  },
  front_desk: {
    label: 'Front Desk Host',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-200',
    desc: 'Arrivals, key issuance & guest services',
  },
  housekeeping: {
    label: 'Housekeeping Attendant',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    desc: 'Room cleaning & suite turn-downs',
  },
  housekeeping_supervisor: {
    label: 'Housekeeping Supervisor',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-200',
    desc: 'Inspection audits & task allocation',
  },
  maintenance: {
    label: 'Maintenance Tech',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-200',
    desc: 'Defect repairs & mechanical upkeep',
  },
  revenue_manager: {
    label: 'Revenue Director',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    desc: 'Dynamic pricing & channel yield',
  },
};

export const StaffManagementTab: React.FC = () => {
  const { currentUser, currentRole, currentProperty, properties, accessToken } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const [staffList, setStaffList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('front_desk');
  const [invitePropertyId, setInvitePropertyId] = useState<string>(
    currentProperty?.id || (properties[0]?.id ?? '')
  );
  const [inviteNote, setInviteNote] = useState('');
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Post-Invite Success Modal Info (shows activation link for easy copy)
  const [invitedSuccessData, setInvitedSuccessData] = useState<{
    email: string;
    link: string;
    name: string;
  } | null>(null);

  // Copied link indicator per user id
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch Staff Members
  const fetchStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = currentRole === 'gm' && currentProperty?.id
        ? `/api/v1/users?propertyId=${currentProperty.id}`
        : '/api/v1/users';

      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      }).then((r) => r.json());

      if (res.success && Array.isArray(res.data)) {
        setStaffList(res.data);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
      showErrorToast('Could not load staff members');
    } finally {
      setIsLoading(false);
    }
  }, [currentRole, currentProperty?.id, accessToken, showErrorToast]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Handle Invite Form Submission
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    setIsSubmittingInvite(true);
    setInviteError(null);

    try {
      const res = await fetch('/api/v1/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
          propertyId: inviteRole === 'owner' ? null : invitePropertyId,
          personalNote: inviteNote.trim() || null,
        }),
      }).then((r) => r.json());

      if (res.success && res.data) {
        showSuccessToast(res.message || 'Staff invitation sent successfully!');
        setInvitedSuccessData({
          email: res.data.user.email,
          link: res.data.activationLink,
          name: res.data.user.name,
        });
        setIsInviteModalOpen(false);
        // Reset form
        setInviteName('');
        setInviteEmail('');
        setInviteNote('');
        fetchStaff();
      } else {
        setInviteError(res.message || 'Failed to dispatch staff invitation.');
      }
    } catch (err: any) {
      setInviteError(err.message || 'Network error while sending invitation.');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Resend Invite
  const handleResendInvite = async (user: User) => {
    try {
      setActionLoadingId(user.id);
      const res = await fetch(`/api/v1/users/${user.id}/resend-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      }).then((r) => r.json());

      if (res.success && res.data) {
        showSuccessToast(`Fresh activation link dispatched to ${user.email}`);
        if (res.data.activationLink) {
          navigator.clipboard.writeText(res.data.activationLink);
          setCopiedUserId(user.id);
          setTimeout(() => setCopiedUserId(null), 2500);
        }
        fetchStaff();
      } else {
        showErrorToast(res.message || 'Failed to resend invitation');
      }
    } catch (err: any) {
      showErrorToast(err.message || 'Error resending invitation');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Deactivate or Remove Staff Member
  const handleDeactivate = async (user: User) => {
    const isPending = user.status === 'invited';
    const confirmPrompt = isPending
      ? `Revoke and cancel the pending invitation for ${user.name}?`
      : `Deactivate and suspend the staff account for ${user.name}?`;

    if (!window.confirm(confirmPrompt)) return;

    try {
      setActionLoadingId(user.id);
      const res = await fetch(`/api/v1/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      }).then((r) => r.json());

      if (res.success) {
        showSuccessToast(
          isPending ? 'Invitation revoked.' : 'Staff account deactivated.'
        );
        fetchStaff();
      } else {
        showErrorToast(res.message || 'Failed to update user');
      }
    } catch (err: any) {
      showErrorToast(err.message || 'Network error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered List
  const filteredStaff = staffList.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus =
      statusFilter === 'all' || (user.status || 'active') === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // KPI Calculations
  const totalStaffCount = staffList.length;
  const activeStaffCount = staffList.filter((u) => u.status === 'active' || !u.status).length;
  const pendingStaffCount = staffList.filter((u) => u.status === 'invited').length;

  const allowedRolesForInvite: UserRole[] =
    currentRole === 'owner'
      ? ['owner', 'gm', 'front_desk', 'housekeeping', 'housekeeping_supervisor', 'maintenance', 'revenue_manager']
      : ['front_desk', 'housekeeping', 'housekeeping_supervisor', 'maintenance', 'revenue_manager'];

  return (
    <div className="space-y-8">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-2xl text-[#0F172A]">
              Staff & Team Governance
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#0F172A]/5 text-[#0F172A] border border-[#E2E8F0]">
              {totalStaffCount} Associates
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Provision staff profiles, assign hotel roles, and dispatch immediate email invitations with password activation links.
          </p>
        </div>

        <button
          onClick={() => {
            setInvitePropertyId(currentProperty?.id || properties[0]?.id || '');
            setInviteError(null);
            setIsInviteModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] text-white hover:bg-[#1E293B] font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#C5A059]" />
          <span>Invite Staff Member</span>
        </button>
      </div>

      {/* 2. KPI Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="editorial-card p-5 rounded-2xl border border-[#E5E7EB] bg-white shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
              Total Personnel
            </span>
            <p className="text-2xl font-bold font-heading text-[#0F172A] mt-1">
              {totalStaffCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0F172A]/5 text-[#0F172A] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="editorial-card p-5 rounded-2xl border border-emerald-100 bg-emerald-50/40 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Active Associates
            </span>
            <p className="text-2xl font-bold font-heading text-emerald-900 mt-1">
              {activeStaffCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="editorial-card p-5 rounded-2xl border border-amber-100 bg-amber-50/40 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Pending Activations
            </span>
            <p className="text-2xl font-bold font-heading text-amber-900 mt-1">
              {pendingStaffCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[220px] relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by associate name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059]"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#64748B]" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
          >
            <option value="all">All Roles</option>
            <option value="gm">General Manager</option>
            <option value="front_desk">Front Desk Host</option>
            <option value="housekeeping">Housekeeping Attendant</option>
            <option value="housekeeping_supervisor">Housekeeping Supervisor</option>
            <option value="maintenance">Maintenance Tech</option>
            <option value="revenue_manager">Revenue Director</option>
            <option value="owner">Property Owner</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="invited">Pending Invitations</option>
            <option value="suspended">Suspended Accounts</option>
          </select>
        </div>

        <button
          onClick={() => fetchStaff()}
          title="Refresh roster"
          className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#C5A059]' : ''}`} />
        </button>
      </div>

      {/* 4. Staff Roster Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-2xs overflow-hidden">
        {isLoading && staffList.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#C5A059] mx-auto" />
            <p className="text-xs text-[#64748B]">Loading personnel roster...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-10 h-10 text-[#CBD5E1] mx-auto" />
            <p className="text-sm font-semibold text-[#0F172A]">No staff members found</p>
            <p className="text-xs text-[#64748B]">
              {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by inviting your first team member!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  <th className="py-3.5 px-6">Associate</th>
                  <th className="py-3.5 px-4">Role & Department</th>
                  <th className="py-3.5 px-4">Sanctuary Property</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs">
                {filteredStaff.map((staff) => {
                  const roleMeta = ROLE_CONFIG[staff.role] || {
                    label: staff.role,
                    badgeClass: 'bg-gray-100 text-gray-800 border-gray-200',
                    desc: '',
                  };
                  const propertyMatch = properties.find((p) => p.id === staff.propertyId);
                  const propertyName = propertyMatch ? propertyMatch.name : 'Portfolio Wide';
                  const isPending = staff.status === 'invited';
                  const isSuspended = staff.status === 'suspended';
                  const isBusy = actionLoadingId === staff.id;

                  return (
                    <tr key={staff.id} className="hover:bg-[#F8FAFC] transition">
                      {/* Associate Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              staff.avatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                            }
                            alt={staff.name}
                            className="w-9 h-9 rounded-xl object-cover border border-[#E2E8F0] shadow-2xs"
                          />
                          <div>
                            <div className="font-bold text-[#0F172A] flex items-center gap-2">
                              <span>{staff.name}</span>
                              {staff.id === currentUser?.id && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#0F172A] text-white">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-[#94A3B8]" />
                              <span>{staff.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${roleMeta.badgeClass}`}
                        >
                          {roleMeta.label}
                        </span>
                      </td>

                      {/* Sanctuary Property */}
                      <td className="py-4 px-4 text-[#475569]">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span>{propertyName}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isPending ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" />
                              Invite Pending
                            </span>
                            <p className="text-[10px] text-[#94A3B8]">
                              Awaiting password setup
                            </p>
                          </div>
                        ) : isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                            <AlertCircle className="w-3 h-3" />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <button
                              onClick={() => handleResendInvite(staff)}
                              disabled={isBusy}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E2E8F0] text-[11px] font-bold text-[#0F172A] hover:bg-white hover:border-[#C5A059] transition cursor-pointer shadow-2xs disabled:opacity-50"
                              title="Resend activation email"
                            >
                              {copiedUserId === staff.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Link Copied</span>
                                </>
                              ) : isBusy ? (
                                <Loader2 className="w-3 h-3 animate-spin text-[#C5A059]" />
                              ) : (
                                <>
                                  <RefreshCw className="w-3 h-3 text-[#C5A059]" />
                                  <span>Resend</span>
                                </>
                              )}
                            </button>
                          )}

                          {staff.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeactivate(staff)}
                              disabled={isBusy}
                              className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#94A3B8] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                              title={isPending ? 'Revoke invitation' : 'Deactivate associate'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Invite Staff Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#C5A059] mb-1">
                  <Sparkles className="w-3 h-3" />
                  Staff Onboarding
                </div>
                <h3 className="font-heading font-bold text-xl text-white">
                  Invite Staff Member
                </h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleInviteSubmit} className="p-6 space-y-4">
              {inviteError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{inviteError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059]"
                />
              </div>

              {/* Work Email */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1">
                  Associate Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jane.doe@lumenstay.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 focus:border-[#C5A059]"
                />
                <p className="text-[10px] text-[#64748B] mt-1">
                  An immediate email invitation with a secure 48h password activation link will be sent here.
                </p>
              </div>

              {/* Role Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1">
                  Assigned Operational Role *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
                >
                  {allowedRolesForInvite.map((roleKey) => (
                    <option key={roleKey} value={roleKey}>
                      {ROLE_CONFIG[roleKey]?.label || roleKey}
                    </option>
                  ))}
                </select>
                {ROLE_CONFIG[inviteRole]?.desc && (
                  <p className="text-[10px] text-[#64748B] mt-1">
                    {ROLE_CONFIG[inviteRole].desc}
                  </p>
                )}
              </div>

              {/* Property Assignment (locked for GM, selectable for Owner) */}
              {inviteRole !== 'owner' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1">
                    Assigned Hotel Sanctuary *
                  </label>
                  {currentRole === 'gm' ? (
                    <input
                      type="text"
                      disabled
                      value={currentProperty?.name || 'Your Assigned Sanctuary'}
                      className="w-full px-3.5 py-2.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#64748B] cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={invitePropertyId}
                      onChange={(e) => setInvitePropertyId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
                    >
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.city}, {p.state})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Personal Welcome Note */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1">
                  Personal Welcome Message (Optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={500}
                  placeholder="Welcome to the team! Excited to work together on guest experience..."
                  value={inviteNote}
                  onChange={(e) => setInviteNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingInvite ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
                      <span>Sending Invitation...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>Dispatch Invitation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Success Modal (With Direct Copy Activation Link) */}
      {invitedSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-8 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-heading font-bold text-xl text-[#0F172A]">
                Invitation Dispatched!
              </h3>
              <p className="text-xs text-[#64748B]">
                An official invitation email has been routed to{' '}
                <strong className="text-[#0F172A]">{invitedSuccessData.email}</strong>.
              </p>
            </div>

            {/* Copyable Link Box */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-left space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                Instant Activation Link (Expires in 48h)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={invitedSuccessData.link}
                  className="flex-1 text-[11px] font-mono text-[#0F172A] bg-transparent border-none outline-none select-all truncate"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(invitedSuccessData.link);
                    showSuccessToast('Activation link copied to clipboard!');
                  }}
                  className="p-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#0F172A] hover:border-[#C5A059] transition cursor-pointer shadow-2xs shrink-0"
                  title="Copy link"
                >
                  <Copy className="w-3.5 h-3.5 text-[#C5A059]" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setInvitedSuccessData(null)}
              className="w-full py-2.5 px-4 bg-[#0F172A] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#1E293B] transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
