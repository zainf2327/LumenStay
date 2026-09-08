import crypto from 'crypto';
import { db } from '../db/index.js';
import { ApiError } from '../types/api.types.js';
import { emailService } from './email.service.js';
import type { User, UserRole } from '../types/domain.types.js';

export interface InviteStaffInput {
  email: string;
  name: string;
  role: UserRole;
  propertyId?: string | null;
  personalNote?: string | null;
}

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Property Owner / Portfolio Principal',
  gm: 'General Manager',
  front_desk: 'Front Desk Host',
  housekeeping: 'Housekeeping Attendant',
  housekeeping_supervisor: 'Housekeeping Supervisor',
  maintenance: 'Lead Maintenance Engineer',
  revenue_manager: 'Revenue & Yield Director',
  guest: 'Guest',
};

export class UserService {
  /**
   * Invite a new staff member or re-invite an existing pending staff member
   */
  public async inviteStaff(inviter: User, input: InviteStaffInput, originUrl?: string): Promise<{ user: User; activationLink: string }> {
    // 1. Role Authorization Checks
    if (inviter.role !== 'owner' && inviter.role !== 'gm') {
      throw new ApiError(403, 'Only Property Owners and General Managers are authorized to invite staff members.');
    }

    if (input.role === 'guest') {
      throw new ApiError(400, 'Cannot send staff invitation for a guest role. Guests register via the booking engine.');
    }

    // 2. GM Scoping Enforcement
    let targetPropertyId = input.propertyId || null;

    if (inviter.role === 'gm') {
      if (input.role === 'owner') {
        throw new ApiError(403, 'General Managers cannot invite or create Owner accounts.');
      }
      if (input.role === 'gm') {
        throw new ApiError(403, 'General Managers cannot invite other General Managers.');
      }
      if (!inviter.propertyId) {
        throw new ApiError(400, 'Your GM profile does not have an assigned property.');
      }
      // GMs can only invite staff for their own property
      targetPropertyId = inviter.propertyId;
    }

    // For property-level staff roles, propertyId is mandatory
    if (input.role !== 'owner' && !targetPropertyId) {
      throw new ApiError(400, 'An assigned hotel sanctuary property is required for this staff role.');
    }

    const cleanEmail = input.email.trim().toLowerCase();
    const existingUser = await db.users.findByEmail(cleanEmail);

    // If an active account already exists
    if (existingUser && existingUser.status === 'active') {
      throw new ApiError(409, `An active account with the email "${cleanEmail}" already exists.`);
    }

    // 3. Generate Secure 48-Hour Invitation Token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    let targetUser: User;

    if (existingUser && existingUser.status === 'invited') {
      // Re-inviting / refreshing pending invitation
      targetUser = await db.users.update(existingUser.id, {
        name: input.name.trim(),
        role: input.role,
        propertyId: targetPropertyId,
        invitationToken: token,
        invitationExpiresAt: expiresAt,
        invitedBy: inviter.id,
      });
    } else {
      // New User Invitation
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newUser: User = {
        id: userId,
        email: cleanEmail,
        name: input.name.trim(),
        role: input.role,
        status: 'invited',
        propertyId: targetPropertyId,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        preferredLanguage: 'en',
        invitationToken: token,
        invitationExpiresAt: expiresAt,
        invitedBy: inviter.id,
        createdAt: now,
      };
      targetUser = await db.users.insert(newUser);
    }

    // 4. Resolve Property Name for Email
    let propertyName = 'LumenStay Sanctuaries';
    if (targetPropertyId) {
      const prop = await db.properties.findById(targetPropertyId);
      if (prop) {
        propertyName = prop.name;
      }
    }

    // 5. Build Activation Link
    const baseUrl = (originUrl && originUrl.startsWith('http')) 
      ? originUrl 
      : (process.env.CLIENT_URL || 'http://localhost:5173');
    const activationLink = `${baseUrl.replace(/\/$/, '')}/set-password?token=${token}`;

    // 6. Dispatch Email via Resend
    const roleTitle = ROLE_LABELS[input.role] || input.role;
    await emailService.sendStaffInvitation({
      recipientName: targetUser.name,
      recipientEmail: targetUser.email,
      roleName: roleTitle,
      propertyName,
      inviterName: inviter.name || 'Executive Management',
      activationLink,
      personalNote: input.personalNote || null,
      expiresInHours: 48,
    });

    const { passwordHash: _, ...safeUser } = targetUser;
    return { user: safeUser as User, activationLink };
  }

  /**
   * Resend an invitation with a fresh 48h token
   */
  public async resendInvitation(inviter: User, userId: string, originUrl?: string): Promise<{ user: User; activationLink: string }> {
    if (inviter.role !== 'owner' && inviter.role !== 'gm') {
      throw new ApiError(403, 'Unauthorized to manage staff invitations.');
    }

    const targetUser = await db.users.findById(userId);
    if (!targetUser) {
      throw new ApiError(404, 'Staff member not found.');
    }

    if (targetUser.status === 'active') {
      throw new ApiError(400, 'This staff account is already active and cannot be re-invited.');
    }

    if (inviter.role === 'gm' && targetUser.propertyId !== inviter.propertyId) {
      throw new ApiError(403, 'General Managers can only resend invitations for staff at their own property.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const updatedUser = await db.users.update(targetUser.id, {
      invitationToken: token,
      invitationExpiresAt: expiresAt,
      invitedBy: inviter.id,
    });

    let propertyName = 'LumenStay Sanctuaries';
    if (updatedUser.propertyId) {
      const prop = await db.properties.findById(updatedUser.propertyId);
      if (prop) propertyName = prop.name;
    }

    const baseUrl = (originUrl && originUrl.startsWith('http')) 
      ? originUrl 
      : (process.env.CLIENT_URL || 'http://localhost:5173');
    const activationLink = `${baseUrl.replace(/\/$/, '')}/set-password?token=${token}`;

    const roleTitle = ROLE_LABELS[updatedUser.role] || updatedUser.role;
    await emailService.sendStaffInvitation({
      recipientName: updatedUser.name,
      recipientEmail: updatedUser.email,
      roleName: roleTitle,
      propertyName,
      inviterName: inviter.name || 'Executive Management',
      activationLink,
      expiresInHours: 48,
    });

    const { passwordHash: _, ...safeUser } = updatedUser;
    return { user: safeUser as User, activationLink };
  }

  /**
   * Get all staff users (excludes guests), filtered by scope
   */
  public async getStaff(requestingUser: User, propertyId?: string): Promise<User[]> {
    const allUsers = await db.users.find();
    
    // Exclude guests
    let staff = allUsers.filter(u => u.role !== 'guest');

    if (requestingUser.role === 'gm') {
      // GM sees staff assigned to their property plus portfolio owners/themselves
      staff = staff.filter(u => u.propertyId === requestingUser.propertyId || u.id === requestingUser.id);
    } else if (propertyId) {
      staff = staff.filter(u => u.propertyId === propertyId || u.role === 'owner');
    }

    // Strip passwordHash
    return staff.map(u => {
      const { passwordHash: _, ...safe } = u;
      return safe as User;
    });
  }

  /**
   * Deactivate / revoke a staff member
   */
  public async deactivateStaff(admin: User, userId: string): Promise<boolean> {
    if (admin.role !== 'owner' && admin.role !== 'gm') {
      throw new ApiError(403, 'Unauthorized to manage staff members.');
    }

    if (admin.id === userId) {
      throw new ApiError(400, 'You cannot deactivate your own account.');
    }

    const targetUser = await db.users.findById(userId);
    if (!targetUser) {
      throw new ApiError(404, 'User not found.');
    }

    if (admin.role === 'gm') {
      if (targetUser.role === 'owner' || targetUser.role === 'gm') {
        throw new ApiError(403, 'General Managers cannot deactivate Owners or other GMs.');
      }
      if (targetUser.propertyId !== admin.propertyId) {
        throw new ApiError(403, 'General Managers can only manage staff at their assigned property.');
      }
    }

    if (targetUser.status === 'invited') {
      // If invitation was pending, delete the record completely
      await db.users.delete(userId);
    } else {
      // If active, mark as suspended
      await db.users.update(userId, { status: 'suspended' });
    }

    return true;
  }
}

export const userService = new UserService();
